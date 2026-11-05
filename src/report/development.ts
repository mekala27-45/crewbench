import {digest,Refusal} from '../contracts/core.ts';
import {verifyAccounting} from './accounting.ts';
const fail=(code:string):never=>{throw new Refusal(code);};
export function auditDevelopment(raw:any,plan:any,packets:Map<string,any>){
 if(raw?.mode!=='actual_model_development'||!Array.isArray(raw.trials)||!raw.trials.length||!/^[a-f0-9]{40}$/.test(raw.source_commit||''))fail('DEVELOPMENT_PROVENANCE');
 if(raw.plan_digest!==digest(plan))fail('DEVELOPMENT_PLAN_MISMATCH');
 const ids=new Set(),pairs=new Set(),rows:any[]=[];
 for(const row of raw.trials){
  const s=row.state,packet=packets.get(s?.case_id);
  if(!s||row.trial_id!==s.id||row.state_digest!==digest(s)||ids.has(s.id))fail('READBACK_IDENTITY_MISMATCH');ids.add(s.id);
  if(!packet||s.mode!=='actual_model'||s.plan_digest!==raw.plan_digest||s.packet_digest!==digest(packet)||s.snapshot_id!==packet.snapshot_id||s.model_digest!==plan.actual_model.artifact_digest)fail('TRIAL_PROVENANCE_MISMATCH');
  const key=s.case_id+':'+s.method;if(pairs.has(key)||!['solo_agent','split_review'].includes(s.method))fail('DEVELOPMENT_TRIAL_DUPLICATE');pairs.add(key);
  if(!['submitted','failed','timed_out','canceled','indeterminate','unexecuted'].includes(s.status)||!Number.isFinite(Date.parse(row.read_at))||Date.parse(row.read_at)<s.terminal_at||row.event_sequence!==s.events.length||!Number.isInteger(row.connection_id))fail('READBACK_NOT_FINAL');
  const expected={child_packets:Object.keys(s.children).length,join_receipts:s.join?1:0,assessments:s.assessment?1:0,budget_reservations:s.reservations.length,provider_attempts:s.attempts.length,tool_receipts:s.receipts.length};
  for(const [name,count]of Object.entries(expected))if(row.counts?.[name]!==count)fail('READBACK_COUNT_MISMATCH');
  for(const a of s.attempts){const b=a.request_body;if(!b||b.model!==plan.actual_model.candidate||b.think!==plan.decoding.think||b.stream!==false||digest(b.options)!==digest({temperature:plan.decoding.temperature,seed:plan.decoding.seed,num_ctx:plan.decoding.num_ctx,num_predict:plan.budget.output_per_request_tokens,num_gpu:plan.decoding.num_gpu})||a.session_id!==s.roles[a.role]?.session_id)fail('MODEL_REQUEST_CONFIG_MISMATCH');}
  const accounting=verifyAccounting(s),roles:any={};
  for(const role of Object.keys(s.roles))roles[role]={responses:s.attempts.filter((a:any)=>a.role===role&&a.status==='response_recorded').length,tools:s.tool_requests.filter((t:any)=>t.role===role&&t.status==='executed').length,receipts:s.receipts.filter((r:any)=>r.role===role).length,status:s.roles[role].status};
  rows.push({trial_id:s.id,case_id:s.case_id,method:s.method,status:s.status,failure:s.failure,assessment_present:!!s.assessment,state_digest:row.state_digest,read_at:row.read_at,connection_id:row.connection_id,accounting,roles});
 }
 const role_evidence=Object.fromEntries(['solo','tests','staging','synthesis'].map(role=>[role,rows.reduce((n,r)=>n+(r.roles[role]?.responses||0),0)]));
 return {schema_version:1,mode:'actual_model_development_audit',source_commit:raw.source_commit,plan_digest:raw.plan_digest,input_digest:digest(raw),verified:true,trial_count:rows.length,role_evidence,three_role_flow_observed:rows.some(r=>r.method==='split_review'&&['tests','staging','synthesis'].every(role=>r.roles[role]?.responses>0)),all_required_roles_observed:Object.values(role_evidence).every(n=>Number(n)>0),rows};
}
