import {canonical,bytesDigest,digest,Refusal} from '../contracts/core.ts';
export function verifyAccounting(s:any){
 if(!s||!Array.isArray(s.reservations)||!Array.isArray(s.attempts)||!s.roles||!s.spent)throw new Refusal('ACCOUNTING_EMPTY');
 const totals={model_requests:0,input_bytes:0,output_reserved_tokens:0};const ids=new Set();
 for(const r of s.reservations){if(ids.has(r.operation_id))throw new Refusal('DUPLICATE_RESERVATION');ids.add(r.operation_id);totals.model_requests++;totals.input_bytes+=r.input_bytes;totals.output_reserved_tokens+=r.output_reserved_tokens;if(r.output_reserved_tokens!==s.budget.output_per_request_tokens)throw new Refusal('OUTPUT_RESERVATION_MISMATCH');}
 for(const [k,v]of Object.entries(totals))if(v!==s.spent[k]||v>s.budget[k])throw new Refusal('AGGREGATE_ACCOUNTING_MISMATCH');
 for(const key of Object.keys(s.spent)){if(Object.values(s.roles).reduce((n:number,r:any)=>n+r.spent[key],0)!==s.spent[key])throw new Refusal('ROLE_ACCOUNTING_MISMATCH');}
 const attempts=new Set();for(const a of s.attempts){const r=s.reservations.find((r:any)=>r.operation_id===a.operation_id);if(!r||attempts.has(a.operation_id))throw new Refusal('DISPATCH_RESERVATION_MISMATCH');attempts.add(a.operation_id);
  if(s.mode==='actual_model'){if(!a.request_body)throw new Refusal('MISSING_REQUEST_BODY');const wire=canonical(a.request_body);if(wire.includes('PRIVATE_TRUTH_'))throw new Refusal('TRUTH_CANARY');if(Buffer.byteLength(wire)!==r.input_bytes||bytesDigest(wire)!==r.request_digest)throw new Refusal('TRANSPORT_BYTES_MISMATCH');if(a.request_body.options.num_predict!==r.output_reserved_tokens)throw new Refusal('OUTPUT_CAP_MISMATCH');}
  if(a.response&&digest(a.response)!==a.response_digest)throw new Refusal('RESPONSE_DIGEST_MISMATCH');if(a.output_tokens!==null&&a.output_tokens>r.output_reserved_tokens)throw new Refusal('OUTPUT_CAP_VIOLATION');
 }
 for(const r of s.receipts)if(digest(r.payload)!==r.payload_digest||r.trial_id!==s.id||!s.roles[r.role])throw new Refusal('RECEIPT_ACCOUNTING_MISMATCH');
 return {verified:true,reserved:s.reservations.length,dispatched:s.attempts.length,observed_responses:s.attempts.filter((a:any)=>a.status==='response_recorded').length,known_input_tokens:s.attempts.reduce((n:number,a:any)=>n+(a.input_tokens||0),0),known_output_tokens:s.attempts.reduce((n:number,a:any)=>n+(a.output_tokens||0),0),usage_missing:s.attempts.filter((a:any)=>a.input_tokens===null||a.output_tokens===null).length};
}
