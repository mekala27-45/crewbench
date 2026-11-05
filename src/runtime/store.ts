import {readFile} from 'node:fs/promises';
import {digest,Refusal} from '../contracts/core.ts';
import type {Packet} from '../contracts/core.ts';
import type {Trial} from './state.ts';
export interface Store {create(state:Trial,packet:Packet,repetition:string,sessionId?:string|null):Promise<Trial>;read(id:string):Promise<Trial>;change<T>(id:string,fn:(s:Trial,now:number)=>T):Promise<T>;close():Promise<void>;}
export class PgStore implements Store {
 pool:any;schema:string;
 constructor(pool:any,schema:string){if(!/^crewbench(?:_test_[a-f0-9]+)?$/.test(schema))throw new Refusal('SCHEMA_NOT_ALLOWLISTED');this.pool=pool;this.schema=schema;}
 static async open(url=process.env.DATABASE_URL,schema=process.env.CREWBENCH_SCHEMA||'crewbench'){
  if(!url)throw new Refusal('DATABASE_UNAVAILABLE',503);
  const {Pool}=await import('pg');
  return new PgStore(new Pool({connectionString:url,max:4,connectionTimeoutMillis:4000,idleTimeoutMillis:10000,statement_timeout:4500,application_name:'crewbench'}),schema);
 }
 async migrate(){const sql=(await readFile(new URL('../../db/migrations/001_core.sql',import.meta.url),'utf8')).replace(/crewbench/g,this.schema);await this.pool.query(sql);}
 async ready(){const r=await this.pool.query(`SELECT version FROM ${this.schema}.schema_version WHERE version=1`);return r.rowCount===1;}
 async create(state:Trial,packet:Packet,repetition:string,sessionId:string|null=null){
  const c=await this.pool.connect();try{await c.query('BEGIN');
   await c.query(`INSERT INTO ${this.schema}.cases(id,packet_digest,packet) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[packet.case_id,digest(packet),packet]);
   const existing=await c.query(`SELECT packet_digest FROM ${this.schema}.cases WHERE id=$1`,[packet.case_id]);if(existing.rows[0].packet_digest!==digest(packet))throw new Refusal('CASE_DIGEST_CONFLICT',409);
   await c.query(`INSERT INTO ${this.schema}.snapshots(case_id,id,packet_digest) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[packet.case_id,packet.snapshot_id,digest(packet)]);
   const inserted=await c.query(`INSERT INTO ${this.schema}.trials(id,session_id,plan_digest,case_id,snapshot_id,method,repetition,state) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(plan_digest,case_id,method,repetition) DO NOTHING RETURNING state`,[state.id,sessionId,state.plan_digest,state.case_id,state.snapshot_id,state.method,repetition,state]);
   if(!inserted.rowCount){const r=await c.query(`SELECT state FROM ${this.schema}.trials WHERE plan_digest=$1 AND case_id=$2 AND method=$3 AND repetition=$4`,[state.plan_digest,state.case_id,state.method,repetition]);await c.query('COMMIT');return r.rows[0].state;}
   for(const [role,value] of Object.entries(state.roles))await c.query(`INSERT INTO ${this.schema}.roles(trial_id,role,state) VALUES($1,$2,$3)`,[state.id,role,value]);
   await c.query('COMMIT');return state;
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 }
 async read(id:string){const r=await this.pool.query(`SELECT state FROM ${this.schema}.trials WHERE id=$1`,[id]);if(!r.rowCount)throw new Refusal('NOT_FOUND',404);return r.rows[0].state as Trial;}
 async change<T>(id:string,fn:(s:Trial,now:number)=>T):Promise<T>{
  const c=await this.pool.connect();let result:T;let failure:any;
  try{await c.query('BEGIN');const row=await c.query(`SELECT state,extract(epoch FROM clock_timestamp())*1000 AS now_ms FROM ${this.schema}.trials WHERE id=$1 FOR UPDATE`,[id]);if(!row.rowCount)throw new Refusal('NOT_FOUND',404);
   const state:Trial=row.rows[0].state;const before=structuredClone(state);const now=Number(row.rows[0].now_ms);
   try{result=fn(state,now);}catch(e){if(!(e instanceof Refusal))throw e;failure=e;state.events.push({sequence:state.events.length+1,at:new Date(now).toISOString(),type:'refusal',details:{code:e.code}});}
   if(['submitted','failed','timed_out','canceled','indeterminate','unexecuted'].includes(before.status)&&(state.status!==before.status||digest(state.assessment)!==digest(before.assessment)))throw new Error('TERMINAL_STATE_MUTATION');
   await this.persist(c,before,state);await c.query('COMMIT');
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  if(failure)throw failure;return result!;
 }
 async persist(c:any,old:Trial,s:Trial){
  const q=(sql:string,args:any[])=>c.query(sql,args);const p=this.schema;
  for(const [role,value]of Object.entries(s.roles))await q(`UPDATE ${p}.roles SET state=$3 WHERE trial_id=$1 AND role=$2`,[s.id,role,value]);
  for(const r of s.reservations.slice(old.reservations.length))await q(`INSERT INTO ${p}.budget_reservations(trial_id,role,operation_id,payload) VALUES($1,$2,$3,$4)`,[s.id,r.role,r.operation_id,r]);
  for(const a of s.attempts){const prior=old.attempts.find(x=>x.operation_id===a.operation_id);if(!prior)await q(`INSERT INTO ${p}.provider_attempts(trial_id,operation_id,payload) VALUES($1,$2,$3)`,[s.id,a.operation_id,a]);else if(digest(prior)!==digest(a))await q(`UPDATE ${p}.provider_attempts SET payload=$3 WHERE trial_id=$1 AND operation_id=$2`,[s.id,a.operation_id,a]);}
  for(const r of s.tool_requests){const prior=old.tool_requests.find(x=>x.operation_id===r.operation_id&&x.role===r.role);if(!prior)await q(`INSERT INTO ${p}.tool_requests(trial_id,role,operation_id,payload) VALUES($1,$2,$3,$4)`,[s.id,r.role,r.operation_id,r]);else if(digest(prior)!==digest(r))await q(`UPDATE ${p}.tool_requests SET payload=$4 WHERE trial_id=$1 AND role=$2 AND operation_id=$3`,[s.id,r.role,r.operation_id,r]);}
  for(const r of s.receipts.slice(old.receipts.length))await q(`INSERT INTO ${p}.tool_receipts(trial_id,role,id,operation_id,payload,payload_digest,sequence) VALUES($1,$2,$3,$4,$5,$6,$7)`,[s.id,r.role,r.id,r.operation_id,r.payload,r.payload_digest,r.sequence]);
  for(const [role,child]of Object.entries(s.children) as [string,any][])if(!old.children[role])await q(`INSERT INTO ${p}.child_packets(trial_id,role,receipt_id,payload,payload_digest,generation) VALUES($1,$2,$3,$4,$5,$6)`,[s.id,role,child.receipt_id,child.packet,digest(child.packet),child.generation]);
  if(s.join&&!old.join)await q(`INSERT INTO ${p}.join_receipts(trial_id,payload,payload_digest) VALUES($1,$2,$3)`,[s.id,s.join,digest(s.join)]);
  if(s.assessment&&!old.assessment)await q(`INSERT INTO ${p}.assessments(trial_id,receipt_id,payload,payload_digest) VALUES($1,$2,$3,$4)`,[s.id,s.assessment_receipt,s.assessment,digest(s.assessment)]);
  for(const e of s.events.slice(old.events.length))await q(`INSERT INTO ${p}.trial_events(trial_id,sequence,payload) VALUES($1,$2,$3)`,[s.id,e.sequence,e]);
  await q(`UPDATE ${p}.trials SET state=$2,updated_at=clock_timestamp() WHERE id=$1`,[s.id,s]);
 }
 async independentReadback(id:string){const c=await this.pool.connect();try{const state=(await c.query(`SELECT state FROM ${this.schema}.trials WHERE id=$1`,[id])).rows[0]?.state;if(!state)throw new Refusal('NOT_FOUND',404);const counts:any={};for(const table of ['child_packets','join_receipts','assessments','budget_reservations','provider_attempts','tool_receipts'])counts[table]=Number((await c.query(`SELECT count(*) FROM ${this.schema}.${table} WHERE trial_id=$1`,[id])).rows[0].count);const clock=(await c.query('SELECT clock_timestamp() AS at,pg_backend_pid() AS connection_id')).rows[0];return {trial_id:id,schema:this.schema,state_digest:digest(state),state,counts,event_sequence:state.events.length,read_at:clock.at.toISOString(),connection_id:clock.connection_id};}finally{c.release();}}
 async close(){await this.pool.end();}
}
