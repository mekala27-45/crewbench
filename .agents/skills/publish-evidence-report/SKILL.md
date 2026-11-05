---
name: publish-evidence-report
description: Validate Crewbench raw evidence, independent grades and claim provenance before rendering a report or performing an authorized publication.
---

Read AGENTS.md, OPERATIONS.md and RESULTS.md. Require raw immutable traces, matching grades, frozen inputs for actual results and explicit authorization for any blocked publication action. Treat startup failure as an outcome, not an empty success.

Run node scripts/publish-evidence.ts on the registered actual bundle. It refuses wrong source, missing planned rows, unsafe paths and credentials. Independently rederive grades with the private truth key and paired summary with evaluation/statistics.py. Run node scripts/build-report.ts only after all required inputs are available.

Inspect report mode labels, scope, denominators, source hashes and measurement windows. Require missing measurements to remain null. Reject REPORT_GRADE_PROVENANCE, REPORT_ACTUAL_PROVENANCE, REPORT_GRADE_INVENTORY, PUBLICATION_SECRET and PUBLICATION_INVENTORY. Preserve failures and every report dependency.

Keep deterministic baseline, actual model and scripted recovery claims separate. Compare and Case must point to the exact retained receipts. Do not replace a blocked live API with static evidence. Publish only after the user has authorized that specific blocked action; this skill confers no publishing permission. Do not issue a completed release tag with any core checklist item not done.
