import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonical,bytesDigest} from '../src/contracts/core.ts';
import {newTrial,acquire,reserve,dispatchIntent,recordResponse} from '../src/runtime/state.ts';
import {verifyAccounting} from '../src/report/accounting.ts';
import {toolsFor} from '../src/runtime/tools.ts';
const packet=JSON.parse(readFileSync('fixtures/runtime/c070de96e3f.json','utf8'));
const plan=JSON.parse(readFileSync('evaluation/plan.json','utf8'));
function fixture(){const s=newTrial({id:'accounting_probe',packet,plan,method:'solo_agent'});const lease=acquire(s,100,'w');const body={model:'qwen3:1.7b',messages:[{role:'user',content:'Read evidence'}],tools:toolsFor('solo').map(name=>({type:'function',function:{name}})),options:{num_predict:s.budget.output_per_request_tokens}};const wire=canonical(body);reserve(s,101,lease,'solo','op',Buffer.byteLength(wire),s.budget.output_per_request_tokens,bytesDigest(wire),toolsFor('solo'));const a=dispatchIntent(s,102,lease,'op');Object.assign(a,{request_body:body});recordResponse(s,103,lease,'op',{message:{content:'test'},prompt_eval_count:10,eval_count:3},{input_tokens:10,output_tokens:3},1);return s;}
test('accounting clean pass, corrupted transport and empty refusal',()=>{assert.equal(verifyAccounting(fixture()).confirmed_attempts,1);const s=fixture();s.attempts[0].request_body.messages[0].content='changed';assert.throws(()=>verifyAccounting(s),/TRANSPORT_BYTES_MISMATCH/);assert.throws(()=>verifyAccounting(null),/ACCOUNTING_EMPTY/);});
test('usage, role and response mutations cannot manufacture comparable results',()=>{for(const mutate of [(s:any)=>s.attempts[0].output_tokens=2,(s:any)=>s.attempts[0].role='synthesis',(s:any)=>s.attempts[0].response.message.content='changed',(s:any)=>s.spent.input_bytes=-1]){const s=fixture();mutate(s);assert.throws(()=>verifyAccounting(s));}});
test('a dispatch intent without outcome is uncertain, never a confirmed execution',()=>{const s=fixture();const a=s.attempts[0];a.status='indeterminate';delete a.response;a.response_digest=null;a.input_tokens=null;a.output_tokens=null;const result=verifyAccounting(s);assert.equal(result.confirmed_attempts,0);assert.equal(result.usage_missing,1);});
test('an unoffered tool is refused even with updated request bytes and digest',()=>{const s=fixture(),a=s.attempts[0],r=s.reservations[0];a.request_body.tools[0].function.name='shell';const wire=canonical(a.request_body);r.input_bytes=Buffer.byteLength(wire);r.request_digest=a.request_digest=bytesDigest(wire);s.spent.input_bytes=s.roles.solo.spent.input_bytes=r.input_bytes;assert.throws(()=>verifyAccounting(s),/TOOL_EXPOSURE_MISMATCH/);});

test('a handler ledger cannot invent a model tool call',()=>{const s=fixture();s.tool_requests.push({operation_id:'t_fake_0',role:'solo',name:'list_evidence',request_digest:'fake',deliveries:1,status:'executed',error:null});s.spent.tool_requests=s.roles.solo.spent.tool_requests=1;assert.throws(()=>verifyAccounting(s),/TOOL_EMISSION_PROVENANCE/);});
