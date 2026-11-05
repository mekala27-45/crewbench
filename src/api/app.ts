import {randomBytes,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {digest,exactKeys,validId,Refusal} from '../contracts/core.ts';
import {newTrial,stop} from '../runtime/state.ts';
import {PgStore} from '../runtime/store.ts';
import {advanceBaseline} from '../methods/run-baseline.ts';
import {STATEMENT,STATEMENT_ID} from '../report/statement.ts';
const root=new URL('../../',import.meta.url);
const json=async(p:string)=>JSON.parse(await readFile(process.env.VERCEL?join(process.cwd(),p):new URL(p,root),'utf8'));
export async function demoCatalog(){const index=await json('evaluation/case-index.json');return [...new Set(index.map((r:any)=>r.family))].map(f=>index.find((r:any)=>r.family===f&&r.split==='development')).map((r:any)=>({case_id:r.case_id,title:r.family.replaceAll('_',' ')}));}
const view=(s:any)=>({trial_id:s.id,case_id:s.case_id,mode:s.mode,method:s.method,status:s.status,assessment:s.assessment,failure:s.failure,receipt_digests:s.receipts.map((r:any)=>({id:r.id,tool:r.tool,role:r.role,digest:r.payload_digest})),events:s.events.length});
export async function route(req:any,res:any){
 const requestId=randomUUID(),origin=req.headers.origin;
 res.setHeader('x-request-id',requestId);res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');res.setHeader('vary','Origin');
 const allowed=['https://mekala27-45.github.io','http://localhost:5173'];
 const reply=(status:number,body:any)=>{if(!res.writableEnded){res.writeHead(status,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));}};
 if(origin&&!allowed.includes(origin)){reply(403,{code:'ORIGIN_REFUSED',request_id:requestId});return;}
 if(origin)res.setHeader('access-control-allow-origin',origin);
 if(req.method==='OPTIONS'){res.setHeader('access-control-allow-methods','GET, POST, OPTIONS');res.setHeader('access-control-allow-headers','Authorization, Content-Type, Idempotency-Key');reply(204,null);return;}
 const timeout=setTimeout(()=>reply(503,{code:'OPERATION_TIMEOUT',request_id:requestId}),5000);
 let db:PgStore|undefined;
 try{
  const url=new URL(req.url,'http://localhost'),path=url.pathname;
  if(req.method==='GET'&&path==='/healthz'){reply(200,{service:'crewbench-api',commit:process.env.SOURCE_COMMIT||process.env.VERCEL_GIT_COMMIT_SHA||null,statement_id:STATEMENT_ID});return;}
  if(req.method==='GET'&&path==='/api/v1/catalog'){reply(200,{cases:await demoCatalog(),statement:STATEMENT,statement_id:STATEMENT_ID});return;}
  if(req.method==='GET'&&path==='/api/v1/reports/latest'){const report=await json('site/public/data/report.json');reply(200,{status:report.status,report,statement_id:STATEMENT_ID});return;}
  db=await PgStore.open();
  if(req.method==='GET'&&path==='/readyz'){const ready=await db.ready();reply(ready?200:503,{ready,schema_version:1});return;}
  if(!path.startsWith('/api/v1/'))throw new Refusal('NOT_FOUND',404);
  let body:any={};
  if(req.method==='POST'){
   if(req.headers['content-type']?.split(';')[0]!=='application/json')throw new Refusal('JSON_REQUIRED',400);
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>16384)throw new Refusal('BODY_TOO_LARGE',413);chunks.push(chunk);}try{body=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{throw new Refusal('INVALID_JSON');}
   if(!body||Array.isArray(body)||typeof body!=='object')throw new Refusal('OBJECT_REQUIRED');
  }else if(req.method!=='GET')throw new Refusal('METHOD_REFUSED',405);
  const key=req.headers['idempotency-key'];if(req.method==='POST')validId(key);
  const p=db.schema;
  if(path==='/api/v1/sessions'&&req.method==='POST'){
   exactKeys(body,[]);const c=await db.pool.connect();try{await c.query('BEGIN');
    await c.query(`SELECT id FROM ${p}.admission WHERE id=1 FOR UPDATE`);
    const old=await c.query(`SELECT id FROM ${p}.sessions WHERE creation_key=$1`,[digest(key)]);
    if(old.rowCount){await c.query('COMMIT');reply(200,{session_id:old.rows[0].id,capability:null,reason:'Capability returned only on first creation',expires_in_seconds:3600});return;}
    const admission=await c.query(`UPDATE ${p}.admission SET session_count=session_count+1 WHERE id=1 AND session_count<1000 RETURNING id`);if(!admission.rowCount)throw new Refusal('DEMO_CAPACITY',429);
    const capability=randomBytes(32).toString('base64url'),id='session_'+randomUUID().replaceAll('-','');
    await c.query(`INSERT INTO ${p}.sessions(id,capability_digest,expires_at,creation_key) VALUES($1,$2,clock_timestamp()+interval '1 hour',$3)`,[id,digest(capability),digest(key)]);await c.query('COMMIT');reply(201,{session_id:id,capability,expires_in_seconds:3600});return;
   }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  }
  const auth=req.headers.authorization;if(!auth?.startsWith('Bearer ')||auth.length>150)throw new Refusal('CAPABILITY_REQUIRED',401);
  const session=await db.pool.query(`UPDATE ${p}.sessions SET requests=requests+1 WHERE capability_digest=$1 AND expires_at>clock_timestamp() AND requests<500 RETURNING id`,[digest(auth.slice(7))]);
  if(!session.rowCount){const limited=await db.pool.query(`SELECT requests FROM ${p}.sessions WHERE capability_digest=$1 AND expires_at>clock_timestamp()`,[digest(auth.slice(7))]);throw new Refusal(limited.rowCount?'SESSION_QUOTA':'CAPABILITY_INVALID',limited.rowCount?429:401);}
  const sessionId=session.rows[0].id;
  const match=path.match(/^\/api\/v1\/trials\/([a-zA-Z0-9_-]{1,96})(?:\/(advance|events|cancel))?$/);
  if(req.method==='GET'){
   if(!match)throw new Refusal('NOT_FOUND',404);
   const owned=await db.pool.query(`SELECT state FROM ${p}.trials WHERE id=$1 AND session_id=$2`,[match[1],sessionId]);if(!owned.rowCount)throw new Refusal('NOT_FOUND',404);const s=owned.rows[0].state;
   if(match[2]==='events'){const cursor=url.searchParams.get('cursor')||'0';if(!/^\d{1,7}$/.test(cursor))throw new Refusal('INVALID_CURSOR');const events=s.events.filter((e:any)=>e.sequence>Number(cursor)).slice(0,50);reply(200,{trial_id:s.id,events,next_cursor:String(events.at(-1)?.sequence||Number(cursor)),has_more:s.events.length>Number(events.at(-1)?.sequence||cursor)});return;}
   if(match[2])throw new Refusal('NOT_FOUND',404);reply(200,view(s));return;
  }
  const c=await db.pool.connect();try{await c.query('BEGIN');await c.query(`SELECT id FROM ${p}.sessions WHERE id=$1 FOR NO KEY UPDATE`,[sessionId]);
   const requestDigest=digest({path,body});const prior=await c.query(`SELECT request_digest,response FROM ${p}.api_operations WHERE session_id=$1 AND operation=$2 AND operation_id=$3`,[sessionId,path,key]);
   if(prior.rowCount){if(prior.rows[0].request_digest!==requestDigest)throw new Refusal('IDEMPOTENCY_CONFLICT',409);await c.query('COMMIT');reply(200,prior.rows[0].response);return;}
   let output:any,status=200;
   if(path==='/api/v1/trials'){
    exactKeys(body,['case_id','method']);if(body.method!=='deterministic_baseline'||!(await demoCatalog()).some(r=>r.case_id===body.case_id))throw new Refusal('FIXED_DEMO_ONLY');
    const active=await c.query(`SELECT count(*) FROM ${p}.trials WHERE session_id=$1 AND state->>'status' IN ('planned','active')`,[sessionId]);if(Number(active.rows[0].count)>=4)throw new Refusal('ACTIVE_TRIAL_QUOTA',429);
    const packet=await json(`fixtures/runtime/${body.case_id}.json`),plan=await json('evaluation/plan.json');const id='demo_'+randomUUID().replaceAll('-','');const s=newTrial({id,packet,plan,method:'deterministic_baseline'});
    await c.query(`INSERT INTO ${p}.cases(id,packet_digest,packet) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[packet.case_id,digest(packet),packet]);
    const existing=await c.query(`SELECT packet_digest FROM ${p}.cases WHERE id=$1`,[packet.case_id]);if(existing.rows[0].packet_digest!==digest(packet))throw new Refusal('CASE_DIGEST_CONFLICT',409);
    await c.query(`INSERT INTO ${p}.snapshots(case_id,id,packet_digest) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[packet.case_id,packet.snapshot_id,digest(packet)]);
    await c.query(`INSERT INTO ${p}.trials(id,session_id,plan_digest,case_id,snapshot_id,method,repetition,state) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[id,sessionId,s.plan_digest,s.case_id,s.snapshot_id,s.method,id,s]);
    await c.query(`INSERT INTO ${p}.roles(trial_id,role,state) VALUES($1,'baseline',$2)`,[id,s.roles.baseline]);output=view(s);status=201;
   }else if(match&&['advance','cancel'].includes(match[2])){
    exactKeys(body,[]);const owned=await c.query(`SELECT state FROM ${p}.trials WHERE id=$1 AND session_id=$2`,[match[1],sessionId]);if(!owned.rowCount)throw new Refusal('NOT_FOUND',404);const s=owned.rows[0].state;
    if(match[2]==='cancel')await db.change(s.id,(s,n)=>stop(s,n,'canceled','VISITOR_CANCEL'));
    else {const packet=await json(`fixtures/runtime/${s.case_id}.json`);await advanceBaseline(db,s.id,packet);}
    output=view(await db.read(s.id));status=output.status==='active'?202:200;
   }else throw new Refusal('NOT_FOUND',404);
   await c.query(`INSERT INTO ${p}.api_operations(session_id,operation,operation_id,request_digest,response) VALUES($1,$2,$3,$4,$5)`,[sessionId,path,key,requestDigest,output]);await c.query('COMMIT');reply(status,output);
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 }catch(error:any){reply(error instanceof Refusal?error.status:503,{code:error instanceof Refusal?error.code:'DEPENDENCY_UNAVAILABLE',request_id:requestId});}
 finally{clearTimeout(timeout);if(db)await db.close();}
}
