import {canonical,bytesDigest,digest,Refusal} from '../contracts/core.ts';
import {toolsFor} from '../runtime/tools.ts';

const counters=['model_requests','tool_requests','input_bytes','output_reserved_tokens'] as const;
const fail=(code:string):never=>{throw new Refusal(code);};
const count=(n:any)=>Number.isSafeInteger(n)&&n>=0;
/** Reconcile transport records independently of the mutating budget ledger. */
export function verifyAccounting(s:any){
 if(!s||!Array.isArray(s.reservations)||!Array.isArray(s.attempts)||!Array.isArray(s.receipts)||!Array.isArray(s.tool_requests)||!s.roles||!s.spent||!s.budget)fail('ACCOUNTING_EMPTY');
 for(const key of counters){
  if(!count(s.spent[key])||!count(s.budget[key])||s.spent[key]>s.budget[key])fail('AGGREGATE_ACCOUNTING_MISMATCH');
  let sum=0;for(const [role,r]of Object.entries(s.roles) as [string,any][]){
   if(!count(r.spent[key])||!count(s.partitions?.[role]?.[key])||r.spent[key]>s.partitions[role][key])fail('ROLE_ACCOUNTING_MISMATCH');sum+=r.spent[key];
  }if(sum!==s.spent[key])fail('ROLE_ACCOUNTING_MISMATCH');
 }
 const totals={model_requests:0,input_bytes:0,output_reserved_tokens:0};const reservations=new Map();
 for(const r of s.reservations){
  if(reservations.has(r.operation_id)||!s.roles[r.role])fail('DUPLICATE_OR_UNKNOWN_RESERVATION');reservations.set(r.operation_id,r);
  if(!count(r.input_bytes)||!count(r.output_reserved_tokens)||r.output_reserved_tokens!==s.budget.output_per_request_tokens)fail('OUTPUT_RESERVATION_MISMATCH');
  totals.model_requests++;totals.input_bytes+=r.input_bytes;totals.output_reserved_tokens+=r.output_reserved_tokens;
 }
 for(const [key,n]of Object.entries(totals))if(n!==s.spent[key])fail('AGGREGATE_ACCOUNTING_MISMATCH');
 for(const [role,r] of Object.entries(s.roles) as [string,any][]){
  const selected=s.reservations.filter((x:any)=>x.role===role);
  if(r.spent.model_requests!==selected.length||r.spent.input_bytes!==selected.reduce((n:number,x:any)=>n+x.input_bytes,0)||r.spent.output_reserved_tokens!==selected.reduce((n:number,x:any)=>n+x.output_reserved_tokens,0))fail('ROLE_RESERVATION_MISMATCH');
 }
 const attempts=new Set();let confirmed=0;
 for(const a of s.attempts){
  const r=reservations.get(a.operation_id);if(!r||attempts.has(a.operation_id)||r.role!==a.role||r.request_digest!==a.request_digest)fail('DISPATCH_RESERVATION_MISMATCH');attempts.add(a.operation_id);
  if(s.mode==='actual_model'){
   if(!a.request_body)fail('MISSING_REQUEST_BODY');const wire=canonical(a.request_body);
   if(wire.includes('PRIVATE_TRUTH_'))fail('TRUTH_CANARY');
   if(Buffer.byteLength(wire)!==r.input_bytes||bytesDigest(wire)!==r.request_digest)fail('TRANSPORT_BYTES_MISMATCH');
   if(a.request_body.options.num_predict!==r.output_reserved_tokens)fail('OUTPUT_CAP_MISMATCH');
   const offered=(a.request_body.tools||[]).map((t:any)=>t.function?.name).sort();
   if(canonical(offered)!==canonical([...toolsFor(a.role)].sort())||canonical([...r.offered_tools].sort())!==canonical(offered))fail('TOOL_EXPOSURE_MISMATCH');
  }
  for(const key of ['input_tokens','output_tokens'])if(a[key]!==null&&!count(a[key]))fail('INVALID_REPORTED_USAGE');
  if(a.output_tokens!==null&&a.output_tokens>r.output_reserved_tokens)fail('OUTPUT_CAP_VIOLATION');
  if(a.response){
   if(digest(a.response)!==a.response_digest)fail('RESPONSE_DIGEST_MISMATCH');
   if((a.response.prompt_eval_count??null)!==a.input_tokens||(a.response.eval_count??null)!==a.output_tokens)fail('REPORTED_USAGE_MISMATCH');
  }else if(['response_recorded','late_excluded'].includes(a.status))fail('MISSING_RESPONSE');
  // Dispatch intent alone cannot establish that network execution occurred.
  if(['response_recorded','late_excluded','provider_failed','timed_out'].includes(a.status))confirmed++;
 }
 const receiptIds=new Set();for(const r of s.receipts){
  if(receiptIds.has(r.id)||digest(r.payload)!==r.payload_digest||r.trial_id!==s.id||!s.roles[r.role])fail('RECEIPT_ACCOUNTING_MISMATCH');receiptIds.add(r.id);
  if(!s.tool_requests.some((t:any)=>t.operation_id===r.operation_id&&t.role===r.role&&t.name===r.tool&&t.status==='executed'))fail('UNBACKED_HANDLER_RECEIPT');
 }
 if(s.assessment){const receipt=s.receipts.find((r:any)=>r.id===s.assessment_receipt);if(!receipt||receipt.tool!=='submit_assessment'||digest(receipt.payload)!==digest(s.assessment))fail('ASSESSMENT_RECEIPT_MISMATCH');}
 return {verified:true,reserved:s.reservations.length,dispatch_intents:s.attempts.length,confirmed_attempts:confirmed,observed_responses:s.attempts.filter((a:any)=>a.status==='response_recorded').length,known_input_tokens:s.attempts.reduce((n:number,a:any)=>n+(a.input_tokens??0),0),known_output_tokens:s.attempts.reduce((n:number,a:any)=>n+(a.output_tokens??0),0),usage_missing:s.attempts.filter((a:any)=>a.input_tokens===null||a.output_tokens===null).length};
}
