import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PgStore} from '../src/runtime/store.ts';
import {digest} from '../src/contracts/core.ts';
const base=process.env.API_URL||'http://127.0.0.1:8080',events:any[]=[];
async function call(path:string,body?:any,token?:string,key=randomUUID().replaceAll('-',''),extra:any={}){
 const start=new Date().toISOString();const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'content-type':'application/json','idempotency-key':key}),...(token?{authorization:'Bearer '+token}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(6000)});const response=await r.json();
 const sanitized={...response};if(sanitized.capability)sanitized.capability='[omitted]';events.push({path,status:r.status,request_digest:digest({path,body:body??null}),response_digest:digest(sanitized),at:start});return {status:r.status,data:response,headers:r.headers};
}
let observation:any=null;let failure:string|null=null;
try{
 assert.equal((await call('/healthz')).status,200);assert.equal((await call('/readyz')).status,200);
 const catalog=(await call('/api/v1/catalog')).data;assert.equal(catalog.cases.length,6);
 const session=await call('/api/v1/sessions',{});assert.equal(session.status,201);const token=session.data.capability;assert.equal(Buffer.from(token,'base64url').length,32);
 const key=randomUUID().replaceAll('-','');const body={case_id:catalog.cases[0].case_id,method:'deterministic_baseline'};
 const created=await call('/api/v1/trials',body,token,key);assert.equal(created.status,201);const id=created.data.trial_id;
 const retry=await call('/api/v1/trials',body,token,key);assert.equal(retry.status,200);assert.deepEqual(retry.data,created.data);
 assert.equal((await call('/api/v1/trials',{...body,case_id:catalog.cases[1].case_id},token,key)).status,409);
 const advanceKey=randomUUID().replaceAll('-','');assert.equal((await call(`/api/v1/trials/${id}/advance`,{},token,advanceKey)).status,202);
 const final=await call(`/api/v1/trials/${id}/advance`,{},token);assert.equal(final.data.status,'submitted');
 const repeated=await call(`/api/v1/trials/${id}/advance`,{},token,advanceKey);assert.equal(repeated.data.status,'active');
 const reread=await call(`/api/v1/trials/${id}`,undefined,token);assert.equal(reread.data.status,'submitted');assert.ok(reread.data.assessment);
 const second=(await call('/api/v1/sessions',{})).data.capability;
 assert.equal((await call(`/api/v1/trials/${id}`,undefined,second)).status,404);
 assert.equal((await call(`/api/v1/trials/${id}`,undefined,'bad')).status,401);
 assert.equal((await call(`/api/v1/trials/${id}/events?cursor=oops`,undefined,token)).status,400);
 assert.equal((await call('/api/v1/trials',{...body,method:'solo_agent'},token)).status,400);
 assert.equal((await call('/api/v1/trials',{...body,prompt:'untrusted'},token)).status,400);
 assert.equal((await call('/api/v1/trials',{body:'x'.repeat(17000)},token)).status,413);
 assert.equal((await call('/api/v1/catalog',undefined,undefined,undefined,{origin:'https://untrusted.invalid'})).status,403);
 const allowed=await call('/api/v1/catalog',undefined,undefined,undefined,{origin:'https://mekala27-45.github.io'});assert.equal(allowed.headers.get('access-control-allow-origin'),'https://mekala27-45.github.io');
 const db=await PgStore.open();try{observation=await db.independentReadback(id);assert.equal(observation.counts.assessments,1);assert.equal(observation.state.assessment.case_id,body.case_id);assert.equal(digest(observation.state.assessment),digest(reread.data.assessment));const stored=(await db.pool.query(`SELECT capability_digest FROM ${db.schema}.sessions WHERE id=$1`,[session.data.session_id])).rows[0];assert.equal(stored.capability_digest,digest(token));}finally{await db.close();}
}catch(e:any){failure=e.message;process.exitCode=1;}
await mkdir('artifacts/api',{recursive:true});await writeFile('artifacts/api/check.json',JSON.stringify({schema_version:1,mode:'deterministic_baseline',environment:process.env.API_URL?'specified_deployment':'isolated_ci_database',canonical_url:base,source_commit:process.env.GITHUB_SHA||null,passed:failure===null,failure,events,observation},null,2)+'\n');
console.log(JSON.stringify({api_checks:events.length,passed:failure===null,failure}));
