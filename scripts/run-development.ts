import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {Client} from 'eve/client';
import {PgStore} from '../src/runtime/store.ts';
import {newTrial,acquire,stop,workerId} from '../src/runtime/state.ts';
import {digest} from '../src/contracts/core.ts';
const read=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const index=await read('evaluation/case-index.json'),plan=await read('evaluation/plan.json');
const cases=['complete_current','contradictory'].map(f=>index.find((r:any)=>r.family===f&&r.split==='development'));
const db=await PgStore.open(),client=new Client({baseUrl:'http://127.0.0.1:2000'}),rows=[];
await mkdir('artifacts/development',{recursive:true});
try{
 for(const [i,row] of cases.entries())for(const method of (i%2?['split_review','solo_agent']:['solo_agent','split_review'])){
  const packet=await read(`fixtures/runtime/${row.case_id}.json`),id=`dev_${process.env.GITHUB_RUN_ID||'local'}_${row.case_id}_${method}`;
  await db.create(newTrial({id,packet,plan,method:method as any,model_digest:process.env.MODEL_DIGEST||null}),packet,id);
  await db.change(id,(s,n)=>{(s as any).case_order=i;return acquire(s,n,workerId());});
  let session:any=null;
  try{const created=await client.sessions.create({message:JSON.stringify({trial_id:id})});session=created.session;await Promise.race([created.delivery!.result(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('WORKFLOW_DEADLINE')),245000))]);}
  catch(error:any){await db.change(id,(s,n)=>stop(s,n,error.message==='WORKFLOW_DEADLINE'?'timed_out':'failed',String(error.message).slice(0,300)));}
  finally{try{await session?.end({reason:'Registered trial ended'});}catch{}}
  const s=await db.read(id);if(s.status==='active')await db.change(id,(s,n)=>stop(s,n,'failed','NO_ASSESSMENT'));
  const fresh=await PgStore.open();try{rows.push(await fresh.independentReadback(id));}finally{await fresh.close();}
  await writeFile('artifacts/development/trials.json',JSON.stringify({schema_version:1,mode:'actual_model_development',source_commit:process.env.GITHUB_SHA||null,plan_digest:digest(plan),trials:rows},null,2)+'\n');
  console.log(JSON.stringify({trial_id:id,status:rows.at(-1).state.status,requests:rows.at(-1).state.spent.model_requests}));
 }
}finally{await db.close();}
