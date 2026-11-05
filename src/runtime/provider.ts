import {randomUUID} from 'node:crypto';
import {canonical,bytesDigest,digest,Refusal} from '../contracts/core.ts';
import type {Role} from '../contracts/core.ts';
import {PgStore} from './store.ts';
import {acquire,reserve,dispatchIntent,recordResponse,stop,event,workerId,guard} from './state.ts';
import {toolsFor,recordToolEmission,rejectUnfundedToolBatch} from './tools.ts';

let queue=Promise.resolve();
export function serializeRequest(body:any){return canonical(body);}
export async function measuredFetch(role:Role,sessionId:string,_url:any,init:any):Promise<Response>{
 const input=JSON.parse(String(init.body));
 const first=input.messages.find((m:any)=>m.role==='user');
 const text=typeof first?.content==='string'?first.content:JSON.stringify(first?.content);
 const match=text?.match(/CB_TRIAL:([a-zA-Z0-9_-]{1,96})/);
 if(!match)throw new Refusal('TRIAL_CONTEXT_MISSING');
 const trialId=match[1];const store=await PgStore.open();
 let unlock!:()=>void;const preceding=queue;queue=new Promise(r=>unlock=r);
 await preceding;
 try{
  const state=await store.read(trialId);
  // Framework continuation after an accepted submission is control flow only.
  // It never adds an assessment, provider dispatch or measured usage.
  if(state.roles[role]?.status==='submitted'){
   await store.change(trialId,(s,now)=>event(s,now,'framework_terminal_ack',{role,session_id:sessionId,inference:false}));
   return openaiResponse(input,{message:{content:'Submission receipt committed.'},prompt_eval_count:0,eval_count:0},true);
  }
  const lease=await store.change(trialId,(s,now)=>{
   const lease=acquire(s,now,workerId());
   if(s.roles[role].session_id&&s.roles[role].session_id!==sessionId&&s.roles[role].session_id!==`${s.id}_${role}`)throw new Refusal('ROLE_SESSION_CONFLICT',409);
   const r:any=s.roles[role];if(r.session_generation!==undefined&&r.session_generation!==lease.generation)throw new Refusal('STALE_ROLE_SESSION');
   r.session_id=sessionId;r.session_generation=lease.generation;r.session_owner=lease.owner;
   for(const t of s.tool_requests)if(t.role===role&&t.status==='emitted'){t.status='schema_rejected';t.error='FRAMEWORK_DID_NOT_EXECUTE';event(s,now,'framework_tool_rejected',{operation_id:t.operation_id});}
   if(s.tool_requests.filter(t=>t.role===role&&t.name.startsWith('submit_')&&['schema_rejected','refused'].includes(t.status)).length>=2){stop(s,now,'failed','SUBMISSION_CORRECTION_EXHAUSTED');throw new Refusal('SUBMISSION_CORRECTION_EXHAUSTED');}
   return lease;
  });
  const offered=(input.tools||[]).map((t:any)=>t.function?.name).sort();
  const allowed=toolsFor(role).sort();
  if(canonical(offered)!==canonical(allowed))throw new Refusal('UNEXPECTED_PROVIDER_TOOLS');
  const messages=input.messages.map((m:any)=>{
   const r:any={role:m.role,content:typeof m.content==='string'?m.content:(m.content||[]).map((p:any)=>p.text||'').join('\n')};
   if(m.tool_calls)r.tool_calls=m.tool_calls.map((t:any)=>({function:{name:t.function.name,arguments:typeof t.function.arguments==='string'?JSON.parse(t.function.arguments):t.function.arguments}}));
   if(m.role==='tool'){const call=input.messages.flatMap((x:any)=>x.tool_calls||[]).find((t:any)=>t.id===m.tool_call_id);if(call)r.tool_name=call.function.name;}
   return r;
  });
  const body={model:'qwen3:4b-instruct-2507-q4_K_M',messages,tools:input.tools,stream:false,think:false,options:{temperature:0,seed:25,num_ctx:8192,num_predict:state.budget.output_per_request_tokens,num_gpu:0}};
  const serialized=serializeRequest(body);const op='m_'+randomUUID().replaceAll('-','');
  if(serialized.includes('PRIVATE_TRUTH_'))throw new Refusal('TRUTH_CANARY');
  await store.change(trialId,(s,now)=>reserve(s,now,lease,role,op,Buffer.byteLength(serialized),s.budget.output_per_request_tokens,bytesDigest(serialized),offered));
  await store.change(trialId,(s,now)=>{dispatchIntent(s,now,lease,op);const a=s.attempts.at(-1);a.request_body=body;a.serialization='canonical-json-v1';a.session_id=sessionId;a.adapter_input_digest=digest(input);});
  const live=await store.read(trialId);const start=performance.now();const remaining=Math.min(live.budget.request_seconds*1000,live.deadline!-Date.now());
  let response:any;
  try{
   const r=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:serialized,signal:AbortSignal.timeout(Math.max(1,Math.floor(remaining)))});
   if(!r.ok)throw new Error('PROVIDER_HTTP_'+r.status);response=await r.json();
   if(response.message)delete response.message.thinking;
  }catch(error:any){
   await store.change(trialId,(s,now)=>{const a=s.attempts.find(a=>a.operation_id===op);a.status=error.name==='TimeoutError'?'timed_out':'provider_failed';a.failure=error.cause?.code||error.message;a.elapsed_ms=performance.now()-start;event(s,now,'provider_failed',{operation_id:op,code:a.failure});stop(s,now,a.status==='timed_out'?'timed_out':'failed',a.failure);});
   return new Response(JSON.stringify({error:{message:'PROVIDER_REQUEST_FAILED',type:'invalid_request_error'}}),{status:400,headers:{'content-type':'application/json'}});
  }
  const calls=(response.message?.tool_calls||[]).map((call:any,i:number)=>({...call,id:`t_${op.slice(2)}_${i}`}));
  const accepted=await store.change(trialId,(s,now)=>{
   if(!recordResponse(s,now,lease,op,response,{input_tokens:Number.isSafeInteger(response.prompt_eval_count)?response.prompt_eval_count:null,output_tokens:Number.isSafeInteger(response.eval_count)?response.eval_count:null},performance.now()-start))return false;
   for(const call of calls)recordToolEmission(s,now,lease,role,call.id,call.function.name,call.function.arguments);
   return !rejectUnfundedToolBatch(s,now,calls.map((c:any)=>c.id));
  });
  if(!accepted)throw new Refusal('RESPONSE_NOT_ELIGIBLE_FOR_EXECUTION');
  return openaiResponse(input,{...response,message:{...response.message,tool_calls:calls}},false);
 }catch(error:any){return new Response(JSON.stringify({error:{message:error.code||'PROVIDER_GATE_REFUSAL',type:'invalid_request_error'}}),{status:400,headers:{'content-type':'application/json'}});}
 finally{unlock();await store.close();}
}
function openaiResponse(input:any,response:any,control:boolean){
 const calls=(response.message?.tool_calls||[]).map((t:any,i:number)=>({id:t.id||'call_'+i,type:'function',function:{name:t.function.name,arguments:JSON.stringify(t.function.arguments)}}));
 const common={id:'cb_'+randomUUID(),created:Math.floor(Date.now()/1000),model:control?'crewbench-control-ack':'qwen3:4b-instruct-2507-q4_K_M'};
 const usage={prompt_tokens:response.prompt_eval_count??0,completion_tokens:response.eval_count??0,total_tokens:(response.prompt_eval_count??0)+(response.eval_count??0)};
 if(!input.stream)return Response.json({...common,object:'chat.completion',choices:[{index:0,message:{role:'assistant',content:response.message?.content||'',...(calls.length?{tool_calls:calls}:{})},finish_reason:calls.length?'tool_calls':'stop'}],usage});
 const chunk=(value:any)=>'data: '+JSON.stringify({...common,object:'chat.completion.chunk',...value})+'\n\n';
 const delta:any={role:'assistant',content:response.message?.content||''};if(calls.length)delta.tool_calls=calls.map((c:any,i:number)=>({index:i,...c}));
 return new Response(chunk({choices:[{index:0,delta,finish_reason:null}]})+chunk({choices:[{index:0,delta:{},finish_reason:calls.length?'tool_calls':'stop'}],usage})+'data: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
}
