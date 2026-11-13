import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyFreeze} from '../src/report/freeze.ts';
const files=Object.fromEntries(Array.from({length:51},(_,i)=>['file'+i,'a'.repeat(64)]));
const manifest=()=>({schema_version:1,files:structuredClone(files),plan_digest:'a'.repeat(64),development_provenance:{source_commit:'b'.repeat(40),digest:'c'.repeat(64)},model:{model_digest:'d'.repeat(64),provider_version:'0.40.14'}});
test('freeze accepts exact input digests and refuses changed or absent evidence',()=>{assert.equal(verifyFreeze(manifest(),files),true);assert.throws(()=>verifyFreeze(manifest(),{...files,file0:'b'.repeat(64)}),/FREEZE_MISMATCH/);assert.throws(()=>verifyFreeze(null,{}),/FREEZE_EMPTY/);});
test('freeze rejects traversal and unbound development evidence',()=>{const m=manifest();m.files['../escape']='a'.repeat(64);assert.throws(()=>verifyFreeze(m,m.files),/FREEZE_PATH/);const bad=manifest();bad.development_provenance.source_commit='missing';assert.throws(()=>verifyFreeze(bad,files),/FREEZE_PROVENANCE/);});
