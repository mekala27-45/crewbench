import test from 'node:test';
import assert from 'node:assert/strict';
import {pairedSchedule,startupInventory,trialRow} from '../src/report/evaluation-inventory.ts';
const cases=Array.from({length:12},(_,i)=>'c'+String(i).padStart(2,'0'));
test('paired inventory preserves all cases and counterbalances method order',()=>{const rows=pairedSchedule([...cases].reverse(),'test');assert.equal(rows.length,24);assert.deepEqual(rows.slice(0,4).map(r=>r.method),['solo_agent','split_review','split_review','solo_agent']);assert.equal(new Set(rows.map(r=>r.trial_id)).size,24);});
test('startup failure preserves twenty-four unexecuted rows with null measurements',()=>{const report=startupInventory(pairedSchedule(cases,'test'),'a'.repeat(40),'b'.repeat(64),'c'.repeat(64),'DEPENDENCY_UNAVAILABLE');assert.equal(report.trials.length,24);assert.ok(report.trials.every(r=>!r.actual_dispatch&&r.elapsed_ms===null&&r.status==='unexecuted'));});
test('empty, duplicate and unsafe inventory cannot start evaluation',()=>{assert.throws(()=>pairedSchedule([],'test'));assert.throws(()=>pairedSchedule(Array(12).fill('same'),'test'));assert.throws(()=>pairedSchedule(cases,'../test'));});
