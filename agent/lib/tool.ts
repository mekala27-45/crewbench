import {defineTool} from 'eve/tools';
import {PgStore} from '../../src/runtime/store.ts';
import {executeTool} from '../../src/runtime/tools.ts';
import {digest,Refusal} from '../../src/contracts/core.ts';
import type {Role} from '../../src/contracts/core.ts';
export function boundTool(role:Role,name:string,inputSchema:any){return defineTool({
 description:name==='list_evidence'?'List the complete catalog. Record states require read_evidence.':name==='read_evidence'?'Read up to four exact authored evidence records.':name==='submit_findings'?'Submit the two local check states and exact evidence references.':'Submit the final assessment and all evidence references.',
 inputSchema,
 async execute(input:any,ctx:any){const store=await PgStore.open();try{
  const found=await store.pool.query(`SELECT t.state,c.packet FROM ${store.schema}.trials t JOIN ${store.schema}.roles r ON r.trial_id=t.id JOIN ${store.schema}.cases c ON c.id=t.case_id WHERE r.role=$1 AND r.state->>'session_id'=$2`,[role,ctx.session.id]);
  if(found.rowCount!==1)throw new Refusal('SESSION_SCOPE');const {state,packet}=found.rows[0];
  const receipt=await store.change(state.id,(s,now)=>{const bound:any=s.roles[role];const requestDigest=digest({name,input});const emitted=s.tool_requests.find(r=>r.role===role&&(r.framework_call_id===ctx.callId||r.operation_id===ctx.callId))||s.tool_requests.find(r=>r.role===role&&r.status==='emitted'&&r.request_digest===requestDigest);if(!emitted)throw new Refusal('NO_PROVIDER_TOOL_EMISSION');emitted.framework_call_id=ctx.callId;return executeTool(s,now,{owner:bound.session_owner,generation:bound.session_generation},role,emitted.operation_id,name,input,packet);});
  const p:any=receipt.payload;
  const reference_options=name==='read_evidence'?p.records.filter((r:any)=>r.record_kind==='check').map((r:any)=>({receipt_id:receipt.id,evidence_id:r.evidence_id,field:'state'})):name==='list_evidence'?p.catalogs.map((c:any)=>({receipt_id:receipt.id,evidence_id:'catalog_'+c.group,field:'catalog_complete'})):undefined;
  return {receipt_id:receipt.id,...p,...(reference_options?{reference_options}:{})};
 }catch(e:any){return {refused:true,code:e.code||'TOOL_FAILURE'};}finally{await store.close();}},
 endsTurn:(output:any)=>name.startsWith('submit_')&&!output.refused,
});}
