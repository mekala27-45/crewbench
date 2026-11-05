# Specification

## Task and boundaries

Sample Service has unit_tests, api_tests, artifact_match and staging_probe. Only check records for the current case, snapshot and target revision count. Notes are untrusted data. Repeated identical states are duplicates. Contradictory current states are conflicting_current; absence is missing_current. An uncontested failure requires hold even when another check conflicts. Otherwise any missing or conflicting check requires unknown. Four uncontested passes require ready. Every nonpass check appears once in reasons.

Schema acceptance establishes structure and exact references, not correctness. A structurally valid wrong verdict remains accepted and is graded independently. The Python grader checks the final accepted receipt, exact role scope, typed fields, latent truth and on-time submission.

## Dataset

The authored corpus has 48 isolated lineages, six families and four development plus four held-out lineages per family. evaluation/case-index.json carries split metadata outside runtime packets. evaluation/model-subset.json selects two held-out cases per family using the fixed seeded hash ordering. The core denominator is 12 cases times two actual methods. Do not tune on held-out outcomes.

## Methods and resources

The deterministic baseline uses runtime evidence without model calls. Solo uses one evaluated role. Split has tests and staging specialists followed by synthesis, with alternating specialist order. One native CPU request runs at a time. Both actual methods use the same model artifact, decoder and aggregate ceilings in evaluation/plan.json; split partitions are fixed before execution. This comparison changes both prompt decomposition and agent count, so it cannot isolate agent count alone.

Reserve complete wire input bytes and maximum output allowance before dispatch. Reservations are nonrefundable. Charge every emitted tool request, including rejected calls. Provider outcome, handler execution and accepted submission are distinct events. Unknown token usage is null, never zero.

## Persistence and recovery

PostgreSQL transactions bind session capabilities, trial identities, leases, budgets and receipts. Child slots and final assessments are unique. Generation fencing rejects stale work. A committed child survives worker replacement. Late responses remain excluded. An uncertain committed dispatch is terminally indeterminate after lease recovery and cannot be resent.

Each scripted fault requires recorded injection and fresh readback from another database connection or process after the action. Cancellation tests cover both terminal orderings. These tests make no model-quality claim.

## Claims

Claims include mode, scope, planned denominator, source commit, evidence digest and measurement window. Grades must bind to exact raw files and trial IDs. Paired inference requires all 24 actual attempts with verified accounting. The utility floor is at least 8/12 strict successes and zero accepted unsupported ready verdicts. It may legitimately fail. The static site displays recorded evidence; only its baseline control calls the live API. No production release is assessed or changed.
