import test from 'node:test';
import assert from 'node:assert/strict';
import {completedActualReview} from '../scripts/review-actual-state.ts';

function fixture() {
  const shared = {execution_run:'42', execution_source:'a'.repeat(40), analysis_freeze_digest:'b'.repeat(64)};
  const execution = {run_id:'42', source_commit:shared.execution_source, status:'completed', conclusion:'success'};
  const subset = Array.from({length:12}, (_, i) => 'c' + i);
  const rows = subset.map(case_id => ({case_id,
    solo_agent:{actual_dispatch:true,requests:1,strict_success:false},
    split_review:{actual_dispatch:true,requests:1,strict_success:false}}));
  const totals = () => ({planned:12,attempted:12,unexecuted:0,unexecuted_or_unverified:0,graded:12,
    model_requests:12,successes:0,utility_floor_met:false});
  const report = {subset,actual:{source_commit:shared.execution_source,source_digest:'c'.repeat(64),
    complete_provenance:true,grading_basis:'independent_public_record_policy',private_truth_verified:false,
    planned_pairs:12,rows,solo_agent:totals(),split_review:totals()}};
  const audit = {raw_results_unchanged:true,source_digest:report.actual.source_digest,
    analysis_freeze_digest:shared.analysis_freeze_digest,
    shared_execution:{...shared,identical_causal_inputs:true,raw_result_rewriting:false},
    audits:subset.flatMap(case_id => ['solo_agent','split_review'].map(method => ({
      trial_id:'eval_42_'+case_id+'_'+method,verified:true,confirmed_attempts:1})))};
  return {report,audit,execution,shared};
}
const check = (f: ReturnType<typeof fixture>) => completedActualReview(f.report,f.audit,f.execution,f.shared);

test('completed evidence does not require a favorable model result', () => {
  const f=fixture(); assert.equal(check(f).complete,true);
  assert.equal(check(f).summary.solo_agent.utility_floor_met,false);
});
test('absent held-out evidence remains pending', () => {
  const f=fixture(); assert.equal(completedActualReview({actual:null},null,f.execution,f.shared).complete,false);
});
test('an incomplete execution cannot produce completed checklist lines', () => {
  const f=fixture(); f.execution.status='in_progress';
  assert.throws(()=>check(f),/ACTUAL_EXECUTION_INCOMPLETE/);
});
test('results must match the registered execution and analysis identities', () => {
  const f=fixture(); f.audit.analysis_freeze_digest='d'.repeat(64);
  assert.throws(()=>check(f),/ACTUAL_REVIEW_PROVENANCE/);
  const g=fixture(); g.report.actual.source_commit='e'.repeat(40);
  assert.throws(()=>check(g),/ACTUAL_EXECUTION_IDENTITY/);
});
test('omitted or duplicate case and accounting rows fail closed', () => {
  const f=fixture(); f.report.actual.rows.pop(); assert.throws(()=>check(f),/ACTUAL_REVIEW_DENOMINATOR/);
  const g=fixture(); g.audit.audits[23]=g.audit.audits[0]; assert.throws(()=>check(g),/ACTUAL_REVIEW_ACCOUNTING/);
});
test('every actual request and success must reconcile with the reported totals', () => {
  const f=fixture(); f.report.actual.solo_agent.model_requests=13;
  assert.throws(()=>check(f),/ACTUAL_REVIEW_TOTALS/);
  const g=fixture(); g.report.actual.rows[0].solo_agent.requests=2;
  assert.throws(()=>check(g),/ACTUAL_REVIEW_ACCOUNTING/);
});
test('public-record grades cannot claim private truth verification', () => {
  const f=fixture(); f.report.actual.private_truth_verified=true;
  assert.throws(()=>check(f),/ACTUAL_REVIEW_GRADING/);
});
