import {createHash} from 'node:crypto';

export const CHECKS = ['unit_tests','api_tests','artifact_match','staging_probe'] as const;
export type Check = typeof CHECKS[number];
export type Group = 'tests'|'staging';
export type Role = 'solo'|'tests'|'staging'|'synthesis'|'baseline';
export type Method = 'deterministic_baseline'|'solo_agent'|'split_review';
export type CheckState = 'current_pass'|'current_failure'|'missing_current'|'conflicting_current';
export type Verdict = 'ready'|'hold'|'unknown';
export type TrialStatus = 'planned'|'active'|'submitted'|'unexecuted'|'failed'|'timed_out'|'canceled'|'indeterminate';
export type Evidence = {case_id:string;snapshot_id:string;evidence_id:string;evidence_group:Group;check_key:Check|null;subject_revision:string;record_kind:'check'|'note';state:'pass'|'fail'|null;observed_order:number;body:string;body_digest:string};
export type Packet = {case_id:string;snapshot_id:string;target_revision:string;catalog_complete:true;records:Evidence[]};
export type Ref = {receipt_id:string;evidence_id:string;field:string};
export type Assessment = {case_id:string;snapshot_id:string;verdict:Verdict;checks:Record<Check,CheckState>;reasons:{check_key:Check;code:Exclude<CheckState,'current_pass'>}[];evidence_refs:Ref[]};
export type Findings = {case_id:string;snapshot_id:string;checks:Partial<Record<Check,CheckState>>;evidence_refs:Ref[]};
export type Receipt = {id:string;trial_id:string;role:Role;operation_id:string;tool:string;payload:unknown;payload_digest:string;sequence:number;created_at:string};
export class Refusal extends Error {code:string;status:number; constructor(code:string,status=400){super(code);this.code=code;this.status=status;}}
export function canonical(value:unknown):string {
  if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
  if(typeof value==='number'){if(!Number.isFinite(value))throw new Refusal('NONFINITE_VALUE');return JSON.stringify(value);}
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(typeof value==='object')return '{'+Object.keys(value as object).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';
  throw new Refusal('NON_JSON_VALUE');
}
export const digest=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex');
export const bytesDigest=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
export const groupFor=(key:Check):Group=>CHECKS.indexOf(key)<2?'tests':'staging';
export const keysFor=(role:Role):readonly Check[]=>role==='tests'?CHECKS.slice(0,2):role==='staging'?CHECKS.slice(2):CHECKS;
export const terminal=(s:TrialStatus)=>s!=='planned'&&s!=='active';
export function exactKeys(value:unknown,keys:string[]){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join('|')!==[...keys].sort().join('|'))throw new Refusal('SCHEMA_KEYS');
}
export function validId(id:unknown):asserts id is string {if(typeof id!=='string'||!(/^[a-zA-Z0-9_-]{1,96}$/).test(id))throw new Refusal('INVALID_ID');}
export function validatePacket(packet:Packet){
  exactKeys(packet,['case_id','snapshot_id','target_revision','catalog_complete','records']);
  [packet.case_id,packet.snapshot_id,packet.target_revision].forEach(validId);
  if(packet.catalog_complete!==true||!Array.isArray(packet.records)||packet.records.length>8)throw new Refusal('INVALID_PACKET');
  const ids=new Set();
  for(const r of packet.records){
    exactKeys(r,['case_id','snapshot_id','evidence_id','evidence_group','check_key','subject_revision','record_kind','state','observed_order','body','body_digest']);
    if(r.case_id!==packet.case_id||r.snapshot_id!==packet.snapshot_id||ids.has(r.evidence_id))throw new Refusal('EVIDENCE_SCOPE');
    validId(r.evidence_id);validId(r.subject_revision);ids.add(r.evidence_id);
    if(!['tests','staging'].includes(r.evidence_group)||!Number.isSafeInteger(r.observed_order)||r.observed_order<0||typeof r.body!=='string'||r.body.length>1000||bytesDigest(r.body)!==r.body_digest)throw new Refusal('INVALID_EVIDENCE');
    if(r.record_kind==='check'){if(!CHECKS.includes(r.check_key as Check)||groupFor(r.check_key as Check)!==r.evidence_group||!['pass','fail'].includes(r.state as string))throw new Refusal('INVALID_CHECK_RECORD');}
    else if(r.record_kind!=='note'||r.state!==null||r.check_key!==null)throw new Refusal('INVALID_NOTE');
  }
}
export function validateSubmissionShape(value:any,role:Role,packet:Packet){
  const final=role==='solo'||role==='synthesis'||role==='baseline';
  exactKeys(value,final?['case_id','snapshot_id','verdict','checks','reasons','evidence_refs']:['case_id','snapshot_id','checks','evidence_refs']);
  if(value.case_id!==packet.case_id||value.snapshot_id!==packet.snapshot_id)throw new Refusal('SUBMISSION_SCOPE');
  exactKeys(value.checks,[...keysFor(role)]);
  for(const s of Object.values(value.checks))if(!['current_pass','current_failure','missing_current','conflicting_current'].includes(s as string))throw new Refusal('CHECK_STATE');
  if(!Array.isArray(value.evidence_refs)||value.evidence_refs.length>16)throw new Refusal('REFERENCES_SIZE');
  for(const ref of value.evidence_refs){exactKeys(ref,['receipt_id','evidence_id','field']);validId(ref.receipt_id);validId(ref.evidence_id);if(!['state','subject_revision','catalog_complete'].includes(ref.field))throw new Refusal('REFERENCE_FIELD');}
  if(final){
    if(!['ready','hold','unknown'].includes(value.verdict)||!Array.isArray(value.reasons)||value.reasons.length>4)throw new Refusal('FINAL_SCHEMA');
    const seen=new Set();for(const r of value.reasons){exactKeys(r,['check_key','code']);if(!CHECKS.includes(r.check_key)||!['current_failure','missing_current','conflicting_current'].includes(r.code)||seen.has(r.check_key))throw new Refusal('REASON_SCHEMA');seen.add(r.check_key);}
  }
}
