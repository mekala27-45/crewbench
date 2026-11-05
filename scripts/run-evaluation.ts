import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import {Client} from 'eve/client';
import {PgStore} from '../src/runtime/store.ts';
import {newTrial,acquire,stop,workerId} from '../src/runtime/state.ts';
import {canonical,digest,terminal} from '../src/contracts/core.ts';
import {frozenInputs,verifyFreeze} from '../src/report/freeze.ts';
import {pairedSchedule,trialRow} from '../src/report/evaluation-inventory.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const plan=await read('evaluation/plan.json'),freeze=await read('evaluation/freeze.json'),lock=await read('evaluation/model-lock.json');verifyFreeze(freeze,await frozenInputs());
const schedule=pairedSchedule(await read('evaluation/model-subset.json'),process.env.GITHUB_RUN_ID||'local');
const db=await PgStore.open(),path='artifacts/actual/results.json';await mkdir('artifacts/actual',{recursive:true});
const worker={os:os.platform(),release:os.release(),cpu:os.cpus()[0]?.model,cpu_count:os.cpus().length,memory_bytes:os.totalmem(),node:process.version,provider_version:lock.provider_version,model_digest:lock.model_digest,active_requests:1};
async function save(finalize=false){const trials=[];for(const row of schedule){let s=await db.read(row.trial_id);if(finalize&&!terminal(s.status)){await db.change(s.id,(s,n)=>stop(s,n,s.status==='planned'?'unexecuted':s.attempts.some(a=>a.status==='dispatch_intent')?'indeterminate':'failed','WORKER_ENDED_WITHOUT_SUBMISSION'));s=await db.read(s.id);}trials.push(trialRow(row,s));}const report={schema_version:1,mode:'actual_model',source_commit:process.env.SOURCE_COMMIT||process.env.GITHUB_SHA||null,freeze_digest:digest(freeze),plan_digest:digest(plan),window:{start:new Date(Math.min(...trials.map(r=>r.state.activated_at).filter(Boolean),Date.now())).toISOString(),end:new Date().toISOString()},worker,schedule,trials};await writeFile(path+'.tmp',JSON.stringify(report,null,2)+'\n');await (await import('node:fs/promises')).rename(path+'.tmp',path);}
try{
 if(!process.argv.includes('--finalize'))for(const row of schedule){const packet=await read(`fixtures/runtime/${row.case_id}.json`);const s=newTrial({id:row.trial_id,packet,plan,method:row.method as any,model_digest:lock.model_digest,config_digest:digest(freeze)});(s as any).case_order=row.case_order;await db.create(s,packet,row.trial_id);}
 if(process.argv.includes('--initialize')){await save();}
 else if(process.argv.includes('--finalize')){await save(true);}
 else{
  const get=async(path:string,body?:any)=>{const r=await fetch('http://127.0.0.1:11434'+path,{...(body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('PROVIDER_PROBE_FAILED');return r.json();};
  const version=await get('/api/version'),tags=await get('/api/tags'),show=await get('/api/show',{model:lock.model});if(version.version!==lock.provider_version||tags.models.find((m:any)=>m.name===lock.model)?.digest!==lock.model_digest||createHash('sha256').update(show.template).digest('hex')!==lock.template_digest)throw new Error('MODEL_IDENTITY_MISMATCH');
  const client=new Client({baseUrl:'http://127.0.0.1:2000',auth:{bearer:process.env.CREWBENCH_WORKER_TOKEN!}});
  for(const row of schedule){const before=await db.read(row.trial_id);if(before.status!=='planned')continue;await db.change(row.trial_id,(s,n)=>acquire(s,n,workerId()));let session:any,timer:any;const start=performance.now();try{const created=await client.sessions.create({message:JSON.stringify({trial_id:row.trial_id})});session=created.session;await Promise.race([created.delivery!.result(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('WORKFLOW_DEADLINE')),plan.budget.trial_seconds*1000+5000);})]);}catch(e:any){await db.change(row.trial_id,(s,n)=>stop(s,n,e.message==='WORKFLOW_DEADLINE'?'timed_out':'failed',String(e.message).slice(0,200)));}finally{clearTimeout(timer);try{await Promise.race([session?.end({reason:'Registered trial complete'}),new Promise(r=>setTimeout(r,5000).unref())]);}catch{}await db.change(row.trial_id,(s,n)=>{if(!terminal(s.status))stop(s,n,'failed','ROLE_DID_NOT_SUBMIT');(s as any).worker_elapsed_ms=performance.now()-start;});await save();}const s=await db.read(row.trial_id);console.log(JSON.stringify({case_id:row.case_id,method:row.method,status:s.status,requests:s.attempts.length}));}
 }
}catch(e:any){console.error(JSON.stringify({failure:e.code||e.message}));await save(true);process.exitCode=1;}
finally{await db.close();}
process.exit(process.exitCode||0);
