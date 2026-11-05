import {digest,Refusal,exactKeys} from '../contracts/core.ts';
export function validateEvaluationRequest(r:any,freeze:any,plan:any){
 if(!r)throw new Refusal('REQUEST_EMPTY');
 exactKeys(r,['schema_version','request_id','source_commit','freeze_digest','plan_digest','mode','scope']);
 if(r.schema_version!==1||r.mode!=='actual_model'||r.scope!=='core'||!/^[a-z0-9_-]{1,64}$/.test(r.request_id)||!/^[a-f0-9]{40}$/.test(r.source_commit)||r.freeze_digest!==digest(freeze)||r.plan_digest!==digest(plan)||freeze.plan_digest!==r.plan_digest)throw new Refusal('REQUEST_PROVENANCE');
 return true;
}
