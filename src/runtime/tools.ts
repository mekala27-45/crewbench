import {CHECKS,digest,exactKeys,groupFor,keysFor,Refusal,validateSubmissionShape,validId} from '../contracts/core.ts';
import type {Packet,Role,Receipt} from '../contracts/core.ts';
import {charge,event,guard,stop} from './state.ts';
import type {Lease,Trial} from './state.ts';
export const toolsFor=(role:Role)=>role==='synthesis'?['read_evidence','submit_assessment']:['list_evidence','read_evidence',role==='tests'||role==='staging'?'submit_findings':'submit_assessment'];
export function recordToolEmission(s:Trial,now:number,lease:Lease,role:Role,operationId:string,name:string,input:any){
 guard(s,now,lease,role);const row={role,operation_id:operationId,name,request_digest:digest({name,input}),deliveries:0,status:'emitted',error:null as string|null,framework_call_id:null as string|null};s.tool_requests.push(row);
 try{charge(s,role,{tool_requests:1});event(s,now,'tool_emitted',{role,operation_id:operationId,name});}catch(e){row.status='refused';row.error=e instanceof Refusal?e.code:'INTERNAL_TOOL_FAILURE';event(s,now,'tool_emission_refused',{role,operation_id:operationId,code:row.error});}
 return row;
}
function provenance(s:Trial,role:Role,value:any,packet:Packet){
 const own=new Set(s.receipts.filter(r=>r.role===role).map(r=>r.id));if(role==='synthesis')for(const r of s.join?.evidence_receipts||[])own.add(r.id);
 const supports:any=Object.fromEntries(keysFor(role).map(k=>[k,new Set()]));const catalogGroups=new Set();
 for(const ref of value.evidence_refs){
  const receipt=s.receipts.find(r=>r.id===ref.receipt_id&&r.trial_id===s.id);if(!receipt||!own.has(receipt.id))throw new Refusal('REFERENCE_SCOPE');
  const payload:any=receipt.payload;
  if(ref.field==='catalog_complete'){
   const group=ref.evidence_id.replace(/^catalog_/,'');const cat=payload.catalogs?.find((c:any)=>c.group===group);
   if(!cat||!cat.catalog_complete||cat.case_id!==packet.case_id||cat.snapshot_id!==packet.snapshot_id)throw new Refusal('CATALOG_REFERENCE');catalogGroups.add(group);
  }else{
   const r=payload.records?.find((r:any)=>r.evidence_id===ref.evidence_id);if(!r||!['state','subject_revision'].includes(ref.field)||!Object.hasOwn(r,ref.field))throw new Refusal('FIELD_REFERENCE');
   if(ref.field==='state'&&r.record_kind==='check'&&r.subject_revision===packet.target_revision&&supports[r.check_key])supports[r.check_key].add(r.state);
  }
 }
 for(const [key,state]of Object.entries(value.checks)){
  const support=supports[key];if(state==='missing_current'&&!catalogGroups.has(groupFor(key as any)))throw new Refusal('MISSING_CATALOG_REFERENCE');
  if(state==='current_pass'&&!support.has('pass')||state==='current_failure'&&!support.has('fail')||state==='conflicting_current'&&!(support.has('pass')&&support.has('fail')))throw new Refusal('ASSERTION_REFERENCE');
 }
}
export function executeTool(s:Trial,now:number,lease:Lease,role:Role,operationId:string,name:string,input:any,packet:Packet):Receipt{
 validId(operationId);
 const requestDigest=digest({name,input});const prior=s.tool_requests.find(r=>r.role===role&&r.operation_id===operationId);
 if(prior&&prior.status!=='emitted'){if(prior.request_digest!==requestDigest)throw new Refusal('IDEMPOTENCY_CONFLICT',409);prior.deliveries++;event(s,now,'tool_redelivery',{role,operationId});const r=s.receipts.find(r=>r.role===role&&r.operation_id===operationId);if(r)return r;throw new Refusal(prior.error||'PREVIOUS_REFUSAL',409);}
 guard(s,now,lease,role);
 if(digest(packet)!==s.packet_digest)throw new Refusal('PACKET_DIGEST_MISMATCH');
 if(prior&&prior.request_digest!==requestDigest)throw new Refusal('IDEMPOTENCY_CONFLICT',409);
 const requested=prior||{role,operation_id:operationId,name,request_digest:requestDigest,deliveries:1,status:'requested',error:null as string|null};if(!prior)s.tool_requests.push(requested);else requested.deliveries++;
 try{
  if(!prior&&s.method!=='deterministic_baseline')charge(s,role,{tool_requests:1});
  if(!toolsFor(role).includes(name))throw new Refusal('TOOL_FORBIDDEN');
  let payload:any;
  if(name==='list_evidence'){
   exactKeys(input,['group']);if(!['tests','staging','all'].includes(input.group)||(['tests','staging'].includes(role)&&input.group!==role))throw new Refusal('GROUP_SCOPE');
   const groups=input.group==='all'?['tests','staging']:[input.group];
   payload={catalogs:groups.map(group=>({case_id:packet.case_id,snapshot_id:packet.snapshot_id,group,catalog_complete:true,rows:packet.records.filter(r=>r.evidence_group===group).map(({evidence_id,evidence_group,record_kind,check_key,subject_revision})=>({evidence_id,evidence_group,record_kind,check_key,subject_revision}))}))};
  }else if(name==='read_evidence'){
   exactKeys(input,['evidence_ids']);if(!Array.isArray(input.evidence_ids)||input.evidence_ids.length<1||input.evidence_ids.length>4||new Set(input.evidence_ids).size!==input.evidence_ids.length)throw new Refusal('READ_LIMIT');
   const allowed=role==='synthesis'?new Set(s.join?.evidence_receipts.flatMap((r:any)=>r.payload.catalogs?.flatMap((c:any)=>c.rows.map((r:any)=>r.evidence_id))||[])||[]):null;
   const records=input.evidence_ids.map((id:string)=>{validId(id);const r=packet.records.find(r=>r.evidence_id===id);if(!r||(['tests','staging'].includes(role)&&r.evidence_group!==role)||(allowed&&!allowed.has(id)))throw new Refusal('EVIDENCE_SCOPE');return r;});payload={records};
  }else{
   const final=name==='submit_assessment';exactKeys(input,final?['verdict','checks','reasons','evidence_refs']:['checks','evidence_refs']);
   payload={case_id:packet.case_id,snapshot_id:packet.snapshot_id,...input};validateSubmissionShape(payload,role,packet);provenance(s,role,payload,packet);
   if(!final&&s.children[role])throw new Refusal('CHILD_SLOT_OCCUPIED',409);
   if(final&&s.assessment)throw new Refusal('ASSESSMENT_OCCUPIED',409);
  }
  requested.status='executed';const seq=event(s,now,'handler_executed',{role,name,operation_id:operationId}).sequence;
  const receipt:Receipt={id:'h'+(s.receipts.length+1),trial_id:s.id,role,operation_id:operationId,tool:name,payload,payload_digest:digest(payload),sequence:seq,created_at:new Date(now).toISOString()};s.receipts.push(receipt);
  if(name==='submit_findings'){s.children[role]={packet:payload,receipt_id:receipt.id,generation:lease.generation};s.roles[role].status='submitted';event(s,now,'child_committed',{role,receipt_id:receipt.id});}
  if(name==='submit_assessment'){s.assessment=payload;s.assessment_receipt=receipt.id;s.status='submitted';s.terminal_at=now;s.roles[role].status='submitted';event(s,now,'assessment_committed',{receipt_id:receipt.id});}
  return receipt;
 }catch(e){requested.status='refused';requested.error=e instanceof Refusal?e.code:'INTERNAL_TOOL_FAILURE';event(s,now,'tool_refused',{role,name,operation_id:operationId,code:requested.error});throw e;}
}

export function rejectUnfundedToolBatch(s:Trial,now:number,operationIds:string[]){const refused=s.tool_requests.some(t=>operationIds.includes(t.operation_id)&&t.error==='BUDGET_EXHAUSTED');if(refused)stop(s,now,'failed','TOOL_BATCH_BUDGET_EXHAUSTED');return refused;}
