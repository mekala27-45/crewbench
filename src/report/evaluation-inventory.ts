import {digest,Refusal} from '../contracts/core.ts';
import {verifyAccounting} from './accounting.ts';
export function pairedSchedule(subset:string[],runId:string){
 if(!Array.isArray(subset)||subset.length!==12||new Set(subset).size!==12||!subset.every(x=>/^[a-zA-Z0-9_-]{1,48}$/.test(x))||!/^[a-zA-Z0-9_-]{1,32}$/.test(runId))throw new Refusal('INVALID_EVALUATION_INVENTORY');
 return [...subset].sort().flatMap((case_id,i)=>(i%2?['split_review','solo_agent']:['solo_agent','split_review']).map(method=>({case_id,method,case_order:i,trial_id:`eval_${runId}_${case_id}_${method}`})));
}
export function trialRow(row:any,s:any){
 let accounting:any;try{accounting=verifyAccounting(s);}catch(e:any){accounting={verified:false,failure:e.code||e.message};}
 return {...row,mode:'actual_model',status:s.status==='planned'?'unexecuted':s.status,actual_dispatch:accounting.verified&&accounting.confirmed_attempts>0,on_time:s.status==='submitted'&&s.terminal_at<s.deadline,assessment:s.assessment,receipts:s.receipts,join:s.join,state:s,state_digest:digest(s),accounting,
  usage_missing_reason:s.attempts.length?'See individual request usage':'No confirmed provider attempt',elapsed_ms:s.worker_elapsed_ms??null,elapsed_missing_reason:s.worker_elapsed_ms===undefined?'Monotonic worker timing unavailable':null,db_elapsed_ms:s.terminal_at&&s.activated_at?s.terminal_at-s.activated_at:null,teardown_ms:null,teardown_missing_reason:'Native provider stop time not independently observed'};
}
export function startupInventory(schedule:any[],sourceCommit:string,planDigest:string,freezeDigest:string,code:string){
 if(!/^[a-f0-9]{40}$/.test(sourceCommit)||!schedule.length)throw new Refusal('STARTUP_PROVENANCE');
 return {schema_version:1,mode:'actual_model',source_commit:sourceCommit,plan_digest:planDigest,freeze_digest:freezeDigest,status:'startup_failed',failure:code,window:{start:new Date().toISOString(),end:new Date().toISOString()},schedule,trials:schedule.map(row=>({...row,mode:'actual_model',status:'unexecuted',actual_dispatch:false,assessment:null,receipts:[],on_time:false,accounting:{verified:false,failure:'NO_PROVIDER_ATTEMPT'},elapsed_ms:null,usage_missing_reason:code}))};
}
