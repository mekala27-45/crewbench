import {digest,Refusal,terminal} from '../contracts/core.ts';
import type {Assessment,Findings,Method,Packet,Receipt,Role,TrialStatus} from '../contracts/core.ts';
export type Counters={model_requests:number;tool_requests:number;input_bytes:number;output_reserved_tokens:number};
export type Budget=Counters&{output_per_request_tokens:number;trial_seconds:number;request_seconds:number};
export type Lease={owner:string;generation:number};
export type Trial={id:string;case_id:string;snapshot_id:string;packet_digest:string;plan_digest:string;config_digest:string;model_digest:string|null;method:Method;mode:string;status:TrialStatus;budget:Budget;partitions:Record<string,Counters>;spent:Counters;roles:Record<string,{status:string;spent:Counters;session_id:string|null}>;owner:string|null;generation:number;lease_until:number;deadline:number|null;activated_at:number|null;terminal_at:number|null;failure:string|null;reservations:any[];attempts:any[];tool_requests:any[];receipts:Receipt[];children:Record<string,any>;join:any|null;assessment:Assessment|null;assessment_receipt:string|null;events:any[]};
export const zero=():Counters=>({model_requests:0,tool_requests:0,input_bytes:0,output_reserved_tokens:0});
export const workerId=()=>process.env.CREWBENCH_WORKER_ID||`worker_${process.pid}`;
export const event=(s:Trial,now:number,type:string,details:unknown={})=>{const e={sequence:s.events.length+1,at:new Date(now).toISOString(),type,details};s.events.push(e);return e;};
export function newTrial(args:{id:string;packet:Packet;plan:any;method:Method;mode?:string;config_digest?:string;model_digest?:string|null}):Trial{
 const {id,packet,plan,method}=args;const roleNames=method==='split_review'?['tests','staging','synthesis']:[method==='solo_agent'?'solo':'baseline'];
 return {id,case_id:packet.case_id,snapshot_id:packet.snapshot_id,packet_digest:digest(packet),plan_digest:digest(plan),config_digest:args.config_digest||digest(plan),model_digest:args.model_digest||null,method,mode:args.mode||(method==='deterministic_baseline'?'deterministic_baseline':'actual_model'),status:'planned',budget:plan.budget,partitions:method==='split_review'?plan.partitions:{[roleNames[0]]:plan.budget},spent:zero(),roles:Object.fromEntries(roleNames.map(r=>[r,{status:'pending',spent:zero(),session_id:null}])),owner:null,generation:0,lease_until:0,deadline:null,activated_at:null,terminal_at:null,failure:null,reservations:[],attempts:[],tool_requests:[],receipts:[],children:{},join:null,assessment:null,assessment_receipt:null,events:[]};
}
export function stop(s:Trial,now:number,status:TrialStatus,reason:string){
 if(terminal(s.status))return;
 s.status=status;s.failure=reason;s.terminal_at=now;s.generation++;s.lease_until=0;
 for(const r of Object.values(s.roles))if(r.status!=='submitted')r.status=status;
 event(s,now,'terminal',{status,reason});
}
export function guard(s:Trial,now:number,lease:Lease,role?:Role){
 if(s.status!=='active')throw new Refusal('TRIAL_TERMINAL',409);
 if(s.deadline===null||now>=s.deadline){stop(s,now,'timed_out','TRIAL_DEADLINE');throw new Refusal('TRIAL_DEADLINE',409);}
 if(s.owner!==lease.owner||s.generation!==lease.generation||now>=s.lease_until)throw new Refusal('STALE_WORKER',409);
 if(role&&(!s.roles[role]||!['pending','active'].includes(s.roles[role].status)))throw new Refusal('ROLE_TERMINAL',409);
}
export function acquire(s:Trial,now:number,owner:string):Lease{
 if(terminal(s.status))throw new Refusal('TRIAL_TERMINAL',409);
 if(s.status==='planned'){s.status='active';s.activated_at=now;s.deadline=now+s.budget.trial_seconds*1000;event(s,now,'activated');}
 if(now>=(s.deadline||0)){stop(s,now,'timed_out','TRIAL_DEADLINE');throw new Refusal('TRIAL_DEADLINE',409);}
 if(s.owner&&s.owner!==owner&&now<s.lease_until)throw new Refusal('LEASE_HELD',409);
 if(s.owner!==owner){
  if(s.attempts.some(a=>a.status==='dispatch_intent')){for(const a of s.attempts)if(a.status==='dispatch_intent')a.status='indeterminate';stop(s,now,'indeterminate','UNCERTAIN_DISPATCH');throw new Refusal('UNCERTAIN_DISPATCH',409);}
  s.generation++;
 }
 s.owner=owner;s.lease_until=Math.min(now+45000,s.deadline!);event(s,now,'lease_acquired',{owner,generation:s.generation});return {owner,generation:s.generation};
}
export function charge(s:Trial,role:Role,cost:Partial<Counters>){
 for(const [key,value] of Object.entries(cost) as [keyof Counters,number][]){
  if(!Number.isSafeInteger(value)||value<0)throw new Refusal('INVALID_BUDGET_COST');
  if(s.spent[key]+value>s.budget[key]||s.roles[role].spent[key]+value>s.partitions[role][key])throw new Refusal('BUDGET_EXHAUSTED',409);
 }
 for(const [key,value] of Object.entries(cost) as [keyof Counters,number][]){s.spent[key]+=value;s.roles[role].spent[key]+=value;}
}
export function reserve(s:Trial,now:number,lease:Lease,role:Role,operation:string,inputBytes:number,outputCap:number,requestDigest:string,tools:string[]){
 guard(s,now,lease,role);
 if(s.reservations.some(r=>r.operation_id===operation))throw new Refusal('REQUEST_ALREADY_RESERVED',409);
 if(outputCap!==s.budget.output_per_request_tokens)throw new Refusal('OUTPUT_CAP_MISMATCH');
 charge(s,role,{model_requests:1,input_bytes:inputBytes,output_reserved_tokens:outputCap});
 s.roles[role].status='active';s.roles[role].session_id ||= `${s.id}_${role}`;
 const item={operation_id:operation,role,generation:lease.generation,input_bytes:inputBytes,output_reserved_tokens:outputCap,request_digest:requestDigest,offered_tools:tools,status:'reserved'};
 s.reservations.push(item);event(s,now,'reserved',item);return item;
}
export function dispatchIntent(s:Trial,now:number,lease:Lease,operation:string){
 const r=s.reservations.find(r=>r.operation_id===operation);if(!r)throw new Refusal('NO_RESERVATION');guard(s,now,lease,r.role);
 if(s.attempts.some(a=>a.operation_id===operation))throw new Refusal('DUPLICATE_DISPATCH',409);
 s.lease_until=Math.min(s.deadline!,Math.max(s.lease_until,now+s.budget.request_seconds*1000+5000));
 const a={operation_id:operation,role:r.role,status:'dispatch_intent',dispatch_at:new Date(now).toISOString(),request_digest:r.request_digest,input_tokens:null,output_tokens:null,usage_missing_reason:'Response not recorded',response_digest:null};
 s.attempts.push(a);event(s,now,'dispatch_intent',{operation_id:operation});return a;
}
export function recordResponse(s:Trial,now:number,lease:Lease,operation:string,response:any,usage:{input_tokens:number|null;output_tokens:number|null},elapsedMs:number){
 const a=s.attempts.find(a=>a.operation_id===operation);if(!a||a.status!=='dispatch_intent')throw new Refusal('REQUEST_NOT_IN_FLIGHT',409);
 const late=terminal(s.status)||now>=(s.deadline||0)||lease.generation!==s.generation||lease.owner!==s.owner;
 a.status=late?'late_excluded':'response_recorded';a.response_digest=digest(response);a.response=response;a.elapsed_ms=elapsedMs;a.arrived_at=new Date(now).toISOString();
 a.input_tokens=usage.input_tokens;a.output_tokens=usage.output_tokens;a.usage_missing_reason=usage.input_tokens===null||usage.output_tokens===null?'Provider did not report complete usage':null;
 event(s,now,late?'late_response_excluded':'response_recorded',{operation_id:operation,response_digest:a.response_digest});
 if(!terminal(s.status)&&now>=(s.deadline||0))stop(s,now,'timed_out','TRIAL_DEADLINE');
 if(usage.output_tokens!==null&&usage.output_tokens>s.reservations.find(r=>r.operation_id===operation).output_reserved_tokens){stop(s,now,'failed','PROVIDER_OUTPUT_CAP_VIOLATION');return false;}
 return !late;
}
export function makeJoin(s:Trial,now:number,lease:Lease){
 guard(s,now,lease);
 if(s.method!=='split_review')throw new Refusal('JOIN_METHOD');
 if(s.join)return s.join;
 if(!s.children.tests||!s.children.staging)throw new Refusal('MISSING_CHILDREN',409);
 const childReceipts=Object.values(s.children).map((c:any)=>c.receipt_id);
 const evidenceIds=new Set<string>();
 for(const c of Object.values(s.children) as any[])for(const r of c.packet.evidence_refs)evidenceIds.add(r.receipt_id);
 for(const r of s.receipts)if(['tests','staging'].includes(r.role)&&r.tool==='list_evidence')evidenceIds.add(r.id);
 const transferred=s.receipts.filter(r=>evidenceIds.has(r.id));
 s.join={trial_id:s.id,case_id:s.case_id,snapshot_id:s.snapshot_id,config_digest:s.config_digest,child_receipts:childReceipts,packets:{tests:s.children.tests.packet,staging:s.children.staging.packet},evidence_receipts:transferred};
 event(s,now,'join_committed',{digest:digest(s.join),children:childReceipts});return s.join;
}
