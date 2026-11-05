import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
const path=new URL('../artifacts/probes/model-native.json',import.meta.url);
await mkdir(new URL('.',path),{recursive:true});
const report={schema_version:1,execution_mode:'development_native_probe',source_commit:process.env.SOURCE_COMMIT||process.env.GITHUB_SHA||null,started_at:new Date().toISOString(),status:'startup_failed',actual_dispatch:false,worker:{os:os.platform(),cpu:os.cpus()[0]?.model,memory_bytes:os.totalmem(),node:process.version},provider:null,model:null,requests:[],error:null};
const hash=s=>createHash('sha256').update(typeof s==='string'?s:JSON.stringify(s)).digest('hex');
async function request(route,body,timeout=30000){const options={signal:AbortSignal.timeout(timeout)};if(body){options.method='POST';options.body=JSON.stringify(body);options.headers={'content-type':'application/json'};}const r=await fetch('http://127.0.0.1:11434'+route,options);if(!r.ok)throw new Error(`HTTP_${r.status}`);return r.json();}
try{
  report.provider=await request('/api/version');
  const tags=await request('/api/tags');
  const model=tags.models.find(m=>m.name==='qwen3:1.7b');
  if(!model)throw new Error('MODEL_NOT_INSTALLED');
  const show=await request('/api/show',{model:'qwen3:1.7b'});
  report.model={name:model.name,digest:model.digest,size_bytes:model.size,details:model.details,template_digest:hash(show.template),capabilities:show.capabilities,thinking:show.thinking||null,license:show.license};
  const body={model:'qwen3:1.7b',messages:[{role:'user',content:'Call list_evidence with group all. Do not answer in prose.'}],tools:[{type:'function',function:{name:'list_evidence',description:'List authored evidence.',parameters:{type:'object',properties:{group:{type:'string',enum:['all']}},required:['group'],additionalProperties:false}}}],stream:false,think:false,options:{temperature:0,seed:25,num_ctx:8192,num_predict:256,num_gpu:0}};
  const sent=JSON.stringify(body);report.actual_dispatch=true;await writeFile(path,JSON.stringify(report,null,2)+'\n');
  const start=performance.now();const response=await request('/api/chat',body,120000);
  delete response.message?.thinking;
  report.requests.push({request_body:body,request_digest:hash(sent),input_bytes:Buffer.byteLength(sent),response,elapsed_ms:performance.now()-start,handler_executed:false});
  report.status=response.message?.tool_calls?.some(t=>t.function.name==='list_evidence')?'provider_tool_call_observed':'provider_response_without_requested_tool';
  report.placement=await request('/api/ps');
}catch(e){report.error=e.cause?.code||e.message;}
report.ended_at=new Date().toISOString();await writeFile(path,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,actual_dispatch:report.actual_dispatch,error:report.error}));
