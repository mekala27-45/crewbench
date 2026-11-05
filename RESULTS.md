# Crewbench review results

Status: review candidate, not a completed release.

[Evidence site](https://mekala27-45.github.io/crewbench/) | [API](https://crewbench-api.vercel.app) | [Review PR](https://github.com/mekala27-45/crewbench/pull/1)

Verification source: 91360ae7fd6e18c86ee3218fae3b2690a94c1a14. Imported evidence uses the exact commits in evaluation/review-request.json. No release tag or frozen actual report is claimed.

Baseline grading here applies the public evidence policy. Separate private answer-key verification remains pending.

deterministic_baseline: 48 of 48 planned cases passed strict grading. Source 81db78d4a0ca8af3aa05b33bd9523494df659904801ea5fb597386ad2914844b. Window 2026-11-05T21:14:06.791Z to 2026-11-05T21:14:07.296Z.

runtime_invariants: 12 of 12 planned fault overlays passed independent verification. Source ead0e4fb780a87fd1ac3a8611027678aef85bc296e15fdfb8c5ee21883411524. Window 2026-11-05T21:14:07.478Z to 2026-11-05T21:18:50.623Z.

Contract checks: 31 Node tests and 26 Python tests passed. Browser checks: 60 passed.

## Section 20

| Requirement | Status | Evidence and observed outcome |
| --- | --- | --- |
| Scaffold, dependency and host probes are recorded and reproducible. | done | artifacts/probes/remote.json; model calibration run 42109940072; lockfile and CI install probes retained. |
| Claim renderer refuses missing provenance and separates execution modes. | done | https://github.com/mekala27-45/crewbench/blob/56fc3966b600596eb2d533a86282fa9046b5204b/artifacts/contracts/runtime.log; source 53d7a6d684951f72c39dbe7cdda0f25ee2cbb0f4; contract suite passed and this report was generated through the provenance renderer. |
| All forty-eight cases, isolated splits and the exact subset are validated. | done | https://github.com/mekala27-45/crewbench/blob/56fc3966b600596eb2d533a86282fa9046b5204b/artifacts/contracts/runtime.log; source 53d7a6d684951f72c39dbe7cdda0f25ee2cbb0f4; corpus contract passed. |
| Baseline and independent grader agree on declared truth and edge cases. | not done | Fresh public-policy grading passed; the separately retained private latent key could not be rerun in the invalid Windows workspace configuration. |
| Trial receipts, uniqueness and session scope pass independent readback. | done | https://github.com/mekala27-45/crewbench/blob/0f5082b26dffc5400e9d7154e5df86f17bce07b2/artifacts/api/check.json; source 8981896982cc0c6b04efe28b40e3a9560b545c4e; persisted assessment, duplicate replay, conflict and cross-session isolation checks passed. |
| Actual solo tool use and every dispatched request have verified accounting. | done | https://github.com/mekala27-45/crewbench/blob/8fc65259b693b13a81f7fc80efe0aa298b2d44b2/artifacts/development/trials.json; source dafc20b58e897fa45fc02527997362e73a214107; artifacts/development/accounting-audit.json binds requests, native emissions, usage, receipts and fresh database readback. |
| Both specialists and synthesis have actual development invocation evidence. | not done | https://github.com/mekala27-45/crewbench/blob/8fc65259b693b13a81f7fc80efe0aa298b2d44b2/artifacts/development/trials.json; source dafc20b58e897fa45fc02527997362e73a214107; completed native responses by role: {"solo":10,"tests":6,"staging":7,"synthesis":0}. Timed-out dispatches are retained separately. |
| Fencing, joins, expiry, cancellation and late output preserve invariants. | done | https://github.com/mekala27-45/crewbench/blob/56fc3966b600596eb2d533a86282fa9046b5204b/artifacts/contracts/runtime.log and https://github.com/mekala27-45/crewbench/blob/79ce68038a343914d54226d74286ea7fe29e3fe6/artifacts/recovery/results.json; contract checks and independently graded fault evidence. |
| Live API completes a persisted baseline flow from browser and separate client. | not done | https://crewbench-api.vercel.app; public database binding/access are not configured. https://github.com/mekala27-45/crewbench/blob/0f5082b26dffc5400e9d7154e5df86f17bce07b2/artifacts/api/check.json proves isolated CI behavior only. |
| All twelve scripted overlays have injection and fresh post-action evidence. | done | https://github.com/mekala27-45/crewbench/blob/79ce68038a343914d54226d74286ea7fe29e3fe6/artifacts/recovery/results.json; source a0a058944e48a88734fc25da04c1d6942a0ad06f; 12/12 passed schema-v2 verification. |
| Frozen paired evaluation attempts all twenty-four actual method-case trials. | not done | No review-branch freeze or held-out actual result bundle exists. Development failures are not paired results. |
| Immutable grades, paired statistics and resource claims reconcile with evidence. | not done | No frozen paired result bundle. Provisional baseline grades and development accounting are retained; paired inference and utility remain unassessed. |
| Compare and Case work with exact evidence navigation and visible mode labels. | done | https://github.com/mekala27-45/crewbench/blob/0f5082b26dffc5400e9d7154e5df86f17bce07b2/artifacts/browser/results.json; source 8981896982cc0c6b04efe28b40e3a9560b545c4e; 60 browser checks passed, including committed-response recovery. |
| Recovery and Method pass responsive, keyboard and error-state browser checks. | done | https://github.com/mekala27-45/crewbench/blob/0f5082b26dffc5400e9d7154e5df86f17bce07b2/artifacts/browser/results.json; source 8981896982cc0c6b04efe28b40e3a9560b545c4e; all configured viewport/theme projects passed without skipped, unexpected or flaky tests. |
| Repository guidance, three skills, decisions, notices and operating notes exist. | done | AGENTS.md, CLAUDE.md, .agents/skills/, DECISIONS.md, DEAD-ENDS.md, docs/NOTICES.md, docs/OPERATIONS.md; all required files checked by this generator. |
| CI preserves failed runs, validates provenance and protects retained evidence. | done | https://github.com/mekala27-45/crewbench/blob/56fc3966b600596eb2d533a86282fa9046b5204b/artifacts/contracts/retention.json; source 53d7a6d684951f72c39dbe7cdda0f25ee2cbb0f4; 5 immutable pins checked, automatic deletion disabled. Failed runs 42111622499, 42113530294 and 42113752057 remain in Actions. |
| Clean rederive and fresh final live verification pass for release inputs. | not done | Public-record rederive is provisional. Private-key verification, final production browser/client readback and release-input checks remain incomplete. |
| Authorized release commit and tag match the verified evidence manifest. | not done | Draft PR https://github.com/mekala27-45/crewbench/pull/1; no completed release tag. Merge and deployment configuration require explicit authorization after automatic review rejection. |

Utility outcome: unassessed. No frozen actual paired comparison has run on this review candidate.

Stretch work: not started.

Publication blockers: the review branch is ready for review; updating main and configuring the dedicated Neon connection and public bounded API require explicit authorization. Vercel deployment capacity and the Windows workspace configuration must also be available before final verification.

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
