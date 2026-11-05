# Crewbench review results

Status: review candidate, not a completed release.

[Evidence site](https://mekala27-45.github.io/crewbench/) | [API](https://crewbench-api.vercel.app) | [Review PR](https://github.com/mekala27-45/crewbench/pull/1)

Verification source: 89495e8c99b7f5fb928da61a95e2fc64a8df9286. Imported evidence uses the exact commits in evaluation/review-request.json. No release tag or completed actual report is claimed. Execution and independent analysis were frozen before inference.

Baseline grading here applies the public evidence policy. Separate private answer-key verification remains pending.

deterministic_baseline: 48 of 48 planned cases passed strict grading. Source 70280d6e8c3587ae16e0349212254d32f655a48bb16cc7cd8e905534222c4f53. Window 2026-11-05T22:02:42.354Z to 2026-11-05T22:02:42.785Z.

runtime_invariants: 12 of 12 planned fault overlays passed independent verification. Source 19faca8afca392278b4dd7d3eae588a8b1961421eb2de64256658434bb3ef843. Window 2026-11-05T22:02:43.000Z to 2026-11-05T22:11:25.941Z.

Contract checks: 33 Node tests and 26 Python tests passed. Browser checks: 60 passed.

## Section 20

| Requirement | Status | Evidence and observed outcome |
| --- | --- | --- |
| Scaffold, dependency and host probes are recorded and reproducible. | done | artifacts/probes/remote.json; selected native model calibration run 42114717980; host packaging run 42116306332; lockfile and CI install probes retained. |
| Claim renderer refuses missing provenance and separates execution modes. | done | https://github.com/mekala27-45/crewbench/blob/a67e32fb03a40d3c598b1b64512257b213589a9f/artifacts/contracts/runtime.log; source b35b8908b8f11ebdf8c5b933a40c3bbcafc24c45; contract suite passed and this report was generated through the provenance renderer. |
| All forty-eight cases, isolated splits and the exact subset are validated. | done | https://github.com/mekala27-45/crewbench/blob/a67e32fb03a40d3c598b1b64512257b213589a9f/artifacts/contracts/runtime.log; source b35b8908b8f11ebdf8c5b933a40c3bbcafc24c45; corpus contract passed. |
| Baseline and independent grader agree on declared truth and edge cases. | not done | Fresh public-policy grading passed; the separately retained private latent key could not be rerun in the invalid Windows workspace configuration. |
| Trial receipts, uniqueness and session scope pass independent readback. | done | https://github.com/mekala27-45/crewbench/blob/dc6296b74b20da5159e8c302d76ad065792edbab/artifacts/api/check.json; source 7a8ad6d919ceb9dff2b9bd33ddb623d52939423c; persisted assessment, duplicate replay, conflict and cross-session isolation checks passed. |
| Actual solo tool use and every dispatched request have verified accounting. | done | https://github.com/mekala27-45/crewbench/blob/77f943782bf8af098430d77160716104dcec4e73/artifacts/development/trials.json; source 43789f67432efa7c0720270a6268eaaccd8c0873; artifacts/development/accounting-audit.json binds requests, native emissions, usage, receipts and fresh database readback. |
| Both specialists and synthesis have actual development invocation evidence. | done | https://github.com/mekala27-45/crewbench/blob/77f943782bf8af098430d77160716104dcec4e73/artifacts/development/trials.json; source 43789f67432efa7c0720270a6268eaaccd8c0873; completed native responses by role: {"solo":10,"tests":6,"staging":8,"synthesis":4}. Timed-out dispatches are retained separately. |
| Fencing, joins, expiry, cancellation and late output preserve invariants. | done | https://github.com/mekala27-45/crewbench/blob/a67e32fb03a40d3c598b1b64512257b213589a9f/artifacts/contracts/runtime.log and https://github.com/mekala27-45/crewbench/blob/12720bdec552e1e2529583ee577e160f73386ed5/artifacts/recovery/results.json; contract checks and independently graded fault evidence. |
| Live API completes a persisted baseline flow from browser and separate client. | not done | https://crewbench-api.vercel.app; public database binding/access are not configured. https://github.com/mekala27-45/crewbench/blob/dc6296b74b20da5159e8c302d76ad065792edbab/artifacts/api/check.json proves isolated CI behavior only. |
| All twelve scripted overlays have injection and fresh post-action evidence. | done | https://github.com/mekala27-45/crewbench/blob/12720bdec552e1e2529583ee577e160f73386ed5/artifacts/recovery/results.json; source b35b8908b8f11ebdf8c5b933a40c3bbcafc24c45; 12/12 passed schema-v2 verification. |
| Frozen paired evaluation attempts all twenty-four actual method-case trials. | not done | Registered run https://github.com/mekala27-45/crewbench/actions/runs/42118015947 at d3d3a2e5a81cf6a0cd46e80b92fbf403b0ae2c92 has status in_progress. Both execution and analysis are frozen; 93 causal files and dispatch control match. Completed raw inventory has not been inspected or verified. |
| Immutable grades, paired statistics and resource claims reconcile with evidence. | not done | Awaiting the unchanged raw bundle from registered run 42118015947. The pre-frozen independent grader, accounting, exact paired inventory and statistics gates must pass before utility claims. |
| Compare and Case work with exact evidence navigation and visible mode labels. | done | https://github.com/mekala27-45/crewbench/blob/dc6296b74b20da5159e8c302d76ad065792edbab/artifacts/browser/results.json; source 7a8ad6d919ceb9dff2b9bd33ddb623d52939423c; 60 browser checks passed, including committed-response recovery. |
| Recovery and Method pass responsive, keyboard and error-state browser checks. | done | https://github.com/mekala27-45/crewbench/blob/dc6296b74b20da5159e8c302d76ad065792edbab/artifacts/browser/results.json; source 7a8ad6d919ceb9dff2b9bd33ddb623d52939423c; all configured viewport/theme projects passed without skipped, unexpected or flaky tests. |
| Repository guidance, three skills, decisions, notices and operating notes exist. | done | AGENTS.md, CLAUDE.md, .agents/skills/, DECISIONS.md, DEAD-ENDS.md, docs/NOTICES.md, docs/OPERATIONS.md; all required files checked by this generator. |
| CI preserves failed runs, validates provenance and protects retained evidence. | done | https://github.com/mekala27-45/crewbench/blob/a67e32fb03a40d3c598b1b64512257b213589a9f/artifacts/contracts/retention.json; source b35b8908b8f11ebdf8c5b933a40c3bbcafc24c45; 5 immutable pins checked, automatic deletion disabled. Failed runs 42111622499, 42113530294 and 42113752057 remain in Actions. |
| Clean rederive and fresh final live verification pass for release inputs. | not done | Public-record rederive is provisional. Private-key verification, final production browser/client readback and release-input checks remain incomplete. |
| Authorized release commit and tag match the verified evidence manifest. | not done | Draft PR https://github.com/mekala27-45/crewbench/pull/1; no completed release tag. Merge and deployment configuration require explicit authorization after automatic review rejection. |

Utility outcome: unassessed. The registered frozen paired run is in_progress; no result-dependent claim is made before immutable import and grading.

Stretch work: not started.

Publication blockers: the review branch is ready for review; updating main and configuring the dedicated Neon connection and public bounded API require explicit authorization. Vercel deployment capacity and the Windows workspace configuration must also be available before final verification.

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
