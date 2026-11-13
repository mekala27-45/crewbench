type Evidence = Record<string, any>;

export function completedActualReview(report: Evidence, audit: Evidence | null, execution: Evidence, shared: Evidence) {
  const actual = report.actual;
  if (!actual && !audit) return { complete: false, summary: null };
  const require = (condition: unknown, code: string) => { if (!condition) throw Error(code); };
  require(actual && audit, 'ACTUAL_REVIEW_INCOMPLETE');
  require(execution.status === 'completed' && execution.conclusion === 'success', 'ACTUAL_EXECUTION_INCOMPLETE');
  require(String(execution.run_id) === String(shared.execution_run) &&
    execution.source_commit === shared.execution_source &&
    actual.source_commit === shared.execution_source, 'ACTUAL_EXECUTION_IDENTITY');
  require(audit!.raw_results_unchanged === true &&
    audit!.source_digest === actual.source_digest &&
    audit!.analysis_freeze_digest === shared.analysis_freeze_digest &&
    audit!.shared_execution?.execution_source === shared.execution_source &&
    String(audit!.shared_execution?.execution_run) === String(shared.execution_run) &&
    audit!.shared_execution?.identical_causal_inputs === true &&
    audit!.shared_execution?.raw_result_rewriting === false, 'ACTUAL_REVIEW_PROVENANCE');
  require(actual.complete_provenance === true &&
    actual.grading_basis === 'independent_public_record_policy' &&
    actual.private_truth_verified === false, 'ACTUAL_REVIEW_GRADING');
  const subset = report.subset;
  require(Array.isArray(subset) && subset.length === 12 && new Set(subset).size === 12 &&
    actual.planned_pairs === 12 && Array.isArray(actual.rows) && actual.rows.length === 12 &&
    new Set(actual.rows.map((row: Evidence) => row.case_id)).size === 12 &&
    actual.rows.every((row: Evidence) => subset.includes(row.case_id)), 'ACTUAL_REVIEW_DENOMINATOR');
  require(Array.isArray(audit!.audits) && audit!.audits.length === 24 &&
    new Set(audit!.audits.map((row: Evidence) => row.trial_id)).size === 24, 'ACTUAL_REVIEW_ACCOUNTING');
  for (const method of ['solo_agent', 'split_review']) {
    const totals = actual[method];
    require(totals?.planned === 12 && totals.attempted === 12 && totals.unexecuted === 0 &&
      totals.unexecuted_or_unverified === 0 && totals.graded === 12, 'ACTUAL_REVIEW_DENOMINATOR');
    let requests = 0, successes = 0;
    for (const row of actual.rows) {
      const receipt = audit!.audits.find((item: Evidence) =>
        item.trial_id === 'eval_' + shared.execution_run + '_' + row.case_id + '_' + method);
      require(row[method]?.actual_dispatch === true && receipt?.verified === true &&
        Number.isInteger(receipt.confirmed_attempts) && receipt.confirmed_attempts > 0 &&
        receipt.confirmed_attempts === row[method].requests, 'ACTUAL_REVIEW_ACCOUNTING');
      requests += receipt.confirmed_attempts;
      successes += row[method].strict_success === true ? 1 : 0;
    }
    require(requests === totals.model_requests && successes === totals.successes, 'ACTUAL_REVIEW_TOTALS');
  }
  return { complete: true, summary: actual };
}
