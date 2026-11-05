import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderClaim,renderDocument,validateBundle} from '../src/report/claims.ts';
import {digest} from '../src/contracts/core.ts';
const valid={method:'solo_agent',mode:'actual_model' as const,scope:'held_out_model_subset',numerator:1,denominator:12,missing_reason:null,source_commit:'a'.repeat(40),evidence_digest:'b'.repeat(64),window:{start:'2026-11-05T00:00:00Z',end:'2026-11-05T00:01:00Z'}};
test('claim gate accepts provenance, refuses mixed modes and empty evidence',()=>{assert.match(renderClaim(valid),/1 of 12/);assert.throws(()=>renderClaim({...valid,mode:'scripted_runtime'}));assert.throws(()=>renderClaim({...valid,evidence_digest:''}));assert.match(renderDocument('Results',[]),/No measured result available/);});
test('missing measurement remains missing',()=>{assert.match(renderClaim({...valid,numerator:null,missing_reason:'No actual dispatch.'}),/no measured result/);assert.throws(()=>renderClaim({...valid,numerator:null}));assert.throws(()=>renderClaim({...valid,numerator:13}));});
test('bundle gate accepts startup failure and refuses traversal and nothing',()=>{const b={mode:'startup_failure',source_commit:'a'.repeat(40),plan_digest:'b'.repeat(64),files:[{path:'reports/failure.json',content:{status:'unexecuted'},digest:digest({status:'unexecuted'})}]};assert.equal(validateBundle(b),true);assert.throws(()=>validateBundle({...b,files:[{...b.files[0],path:'../failure.json'}]}));assert.throws(()=>validateBundle({...b,files:[]}));});
