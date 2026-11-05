import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {Client} from 'eve/client';
import {PgStore} from '../src/runtime/store.ts';
import {newTrial,acquire,stop,workerId} from '../src/runtime/state.ts';
import {digest,terminal} from '../src/contracts/core.ts';
import {verifyAccounting} from '../src/report/accounting.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const index=await read('evaluation/case-index.json'),plan=await read('evaluation/plan.json');
const cases=['c110824f699','c2cdad678dd'].map(id=>index.find((r:any)=>r.case_id===id&&r.split==='development'));
const schedule=cases.flatMap((row:any,i:number)=>(i%2?['split_review','solo_agent']:['solo_agent','split_review']).map(method=>({row,i,method,id:`dev_${process.env.GITHUB_RUN_ID||'local'}_${row.case_id}_${method}`})));
const db=await PgStore.open();await mkdir('artifacts/development',{recursive:true});
async function save(finalize=false){const rows=[];for(const item of schedule){const s=await db.read(item.id);if(finalize&&!terminal(s.status))await db.change(item.id,(s,n)=>stop(s,n,s.status==='planned'?'unexecuted':s.attempts.some(a=>a.status==='dispatch_intent')?'indeterminate':'failed','DEVELOPMENT_WORKER_ENDED'));const fresh=await PgStore.open();try{const row=await fresh.independentReadback(item.id);let accounting;try{accounting=verifyAccounting(row.state);}catch(e:any){accounting={verified:false,failure:e.code||e.message};}rows.push({...row,accounting});}finally{await fresh.close();}}
 await writeFile('artifacts/development/trials.json',JSON.stringify({schema_version:1,mode:'actual_model_development',source_commit:process.env.GITHUB_SHA||null,plan_digest:digest(plan),planned_trials:4,trials:rows},null,2)+'\n');}
try{
 for(const {row,i,method,id}of schedule){const packet=await read(`fixtures/runtime/${row.case_id}.json`),s=newTrial({id,packet,plan,method:method as any,model_digest:process.env.MODEL_DIGEST||null});(s as any).case_order=i;await db.create(s,packet,id);}
 if(process.argv.includes('--initialize'))await save();
 else if(process.argv.includes('--finalize'))await save(true);
 else{const client=new Client({baseUrl:'http://127.0.0.1:2000',auth:{bearer:process.env.CREWBENCH_WORKER_TOKEN!}});
  for(const {id}of schedule){if((await db.read(id)).status!=='planned')continue;await db.change(id,(s,n)=>acquire(s,n,workerId()));let session:any=null,watchdog:any=null;
   try{const created=await client.sessions.create({message:JSON.stringify({trial_id:id})});session=created.session;await Promise.race([created.delivery!.result(),new Promise((_,reject)=>watchdog=setTimeout(()=>reject(new Error('WORKFLOW_DEADLINE')),plan.budget.trial_seconds*1000+5000))]);}
   catch(error:any){await db.change(id,(s,n)=>stop(s,n,error.message==='WORKFLOW_DEADLINE'?'timed_out':'failed',String(error.message).slice(0,300)));}
   finally{clearTimeout(watchdog);try{await Promise.race([session?.end({reason:'Registered trial ended'}),new Promise(r=>setTimeout(r,5000).unref())]);}catch{}if((await db.read(id)).status==='active')await db.change(id,(s,n)=>stop(s,n,'failed','NO_ASSESSMENT'));await save();}
   const s=await db.read(id);console.log(JSON.stringify({trial_id:id,status:s.status,requests:s.attempts.length}));
  }
 }
}catch(error:any){console.error(JSON.stringify({failure:error.code||error.message}));try{await save(true);}catch{}process.exitCode=1;}
finally{await db.close();}
process.exit(process.exitCode||0);
