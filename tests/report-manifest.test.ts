import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEvidenceReport} from '../src/report/manifest.ts';
import {digest} from '../src/contracts/core.ts';
const source='a'.repeat(40),window={start:'2026-11-05T10:00:00Z',end:'2026-11-05T10:01:00Z'};
function fixture(){const baseline={mode:'deterministic_baseline',source_commit:source,window,trials:[{case_id:'c1',trial_id:'t1'}]};return {index:[{case_id:'c1',split:'held_out'}],subset:['c1'],plan:{},source_commit:source,baseline,grades:{source_digest:digest(baseline),grades:[{trial_id:'t1',strict_success:true}]}};}
test('report binds exact grades and renders deterministic provenance',()=>{const x=fixture();assert.deepEqual(buildEvidenceReport(x),buildEvidenceReport(x));assert.equal(buildEvidenceReport(x).baseline.all.successes,1);x.grades.source_digest='b'.repeat(64);assert.throws(()=>buildEvidenceReport(x),/REPORT_GRADE_PROVENANCE/);});
test('duplicate grades cannot increase counts',()=>{const x=fixture();x.grades.grades.push(x.grades.grades[0]);assert.throws(()=>buildEvidenceReport(x),/REPORT_GRADE_INVENTORY/);});
test('absent evidence never creates claims or measurements',()=>{const r=buildEvidenceReport({index:[],subset:[],plan:{},source_commit:source});assert.equal(r.actual,null);assert.deepEqual(r.rendered_claims,[]);assert.equal(r.generated_at,null);});
