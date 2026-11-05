import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fork,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {PgStore} from '../src/runtime/store.ts';
import {newTrial,acquire,reserve,dispatchIntent,stop} from '../src/runtime/state.ts';
import {executeTool} from '../src/runtime/tools.ts';
import {digest} from '../src/contracts/core.ts';
import {scriptedChild,scriptedFinal} from './runtime-fixture.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const plan=await read('evaluation/plan.json'),index=await read('evaluation/case-index.json');
const fixtures=['complete_current','contradictory'].map(f=>index.find((r:any)=>r.family===f&&r.split==='development'));
if(!['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))throw new Error('RECOVERY_REQUIRES_ISOLATED_LOOPBACK_DATABASE');
process.env.CREWBENCH_SCHEMA='crewbench_test_'+randomBytes(6).toString('hex');
const db=await PgStore.open(),rows=[];await db.migrate();
await mkdir('artifacts/recovery',{recursive:true});
try{for(const [fixtureIndex,f] of fixtures.entries())for(const fault of plan.fault_overlays){
 const packet=await read(`fixtures/runtime/${f.case_id}.json`),id=`fault_${f.case_id}_${fault}_${process.env.GITHUB_RUN_ID||Date.now()}`;
 const state=newTrial({id,packet,plan:structuredClone(plan),method:'split_review',mode:'scripted_runtime'});if(fault==='budget_race'){state.budget.model_requests=1;state.partitions.tests.model_requests=1;}
 await db.create(state,packet,id);const proof:any={fault,fixture:f.case_id,injected:false};const started=new Date().toISOString();
 try{
  if(fault==='worker_death'){
   const child=fork(new URL('./fault-worker.ts',import.meta.url),[id],{stdio:['ignore','pipe','pipe','ipc']});
   await new Promise((resolve,reject)=>{child.once('message',resolve);child.once('error',reject);setTimeout(()=>reject(new Error('CHILD_START_TIMEOUT')),10000).unref();});
   const exit=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));child.kill('SIGKILL');proof.exit=await exit;proof.killed_pid=child.pid;proof.injected=proof.exit.signal==='SIGKILL';
   const before=await db.read(id);proof.before_child_digest=digest(before.children.tests);proof.original_deadline=before.deadline;
   await new Promise(r=>setTimeout(r,Math.max(0,before.lease_until-Date.now()+100)));
   await scriptedChild(db,id,packet,'staging','recovered-worker');await scriptedFinal(db,id,packet,'recovered-worker');
  }else if(fault==='lost_child_response'||fault==='duplicate_delivery'){
   const receipt=await scriptedChild(db,id,packet,'tests','fault-worker');proof.original_receipt=receipt.id;
   const {case_id,snapshot_id,...args}=receipt.payload as any;
   if(fault==='lost_child_response')proof.dropped_response=true;
   const repeated=await db.change(id,(s,n)=>executeTool(s,n,{owner:s.owner!,generation:s.generation},'tests','tests_submit','submit_findings',args,packet));
   proof.repeat_receipt=repeated.id;proof.injected=receipt.id===repeated.id;await scriptedChild(db,id,packet,'staging','fault-worker');await scriptedFinal(db,id,packet,'fault-worker');
  }else if(fault==='cancel_race'){
   await scriptedChild(db,id,packet,'tests','fault-worker');await scriptedChild(db,id,packet,'staging','fault-worker');
   if(fixtureIndex===0){await db.change(id,(s,n)=>stop(s,n,'canceled','SCRIPTED_CANCEL'));try{await scriptedFinal(db,id,packet,'fault-worker');}catch(e:any){proof.late_submit_refusal=e.code;}proof.order='cancel_then_submit';}
   else{await scriptedFinal(db,id,packet,'fault-worker');await db.change(id,(s,n)=>stop(s,n,'canceled','SCRIPTED_CANCEL'));proof.order='submit_then_cancel';}
   proof.injected=true;
  }else if(fault==='budget_race'){
   const lease=await db.change(id,(s,n)=>acquire(s,n,'fault-worker'));
   const contenders=await Promise.allSettled(['one','two'].map(op=>db.change(id,(s,n)=>reserve(s,n,lease,'tests',op,100,s.budget.output_per_request_tokens,digest(op),[]))));
   proof.outcomes=contenders.map(r=>r.status==='fulfilled'?'reserved':r.reason.code);proof.injected=proof.outcomes.filter((x:string)=>x==='reserved').length===1;
   await db.change(id,(s,n)=>stop(s,n,'failed','SCRIPTED_BUDGET_RACE_COMPLETE'));
  }else if(fault==='uncertain_dispatch'){
   const lease=await db.change(id,(s,n)=>acquire(s,n,'fault-worker'));
   await db.change(id,(s,n)=>{reserve(s,n,lease,'tests','uncertain',100,s.budget.output_per_request_tokens,digest('scripted'),[]);dispatchIntent(s,n,lease,'uncertain');});
   proof.dispatch_intent_written=true;const before=await db.read(id);await new Promise(r=>setTimeout(r,Math.max(0,before.lease_until-Date.now()+100)));
   try{await db.change(id,(s,n)=>acquire(s,n,'recovered-worker'));}catch(e:any){proof.recovery_refusal=e.code;}
   proof.injected=proof.recovery_refusal==='UNCERTAIN_DISPATCH';
  }
 }catch(error:any){proof.error=error.code||error.message;}
 const actionEnd=new Date().toISOString();const fresh=await promisify(execFile)(process.execPath,[fileURLToPath(new URL('./fresh-readback.ts',import.meta.url)),id],{env:process.env,maxBuffer:4*1024*1024});const observation=JSON.parse(fresh.stdout);
 rows.push({schema_version:1,mode:'scripted_runtime',trial_id:id,fault,fixture_id:f.case_id,window:{start:started,action_end:actionEnd,end:observation.read_at},injection:proof,observation});
 await writeFile('artifacts/recovery/results.json',JSON.stringify({schema_version:1,source_commit:process.env.GITHUB_SHA||null,mode:'scripted_runtime',model_dispatches:0,trials:rows},null,2)+'\n');console.log(JSON.stringify({fault,fixture:f.case_id,status:observation.state.status,injected:proof.injected}));
}}finally{await db.close();}
assert.equal(rows.length,12);
