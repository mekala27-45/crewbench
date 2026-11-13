# Crewbench review results

Status: review candidate, not a completed release.

[Evidence site](https://mekala27-45.github.io/crewbench/) | [API](https://crewbench-api.vercel.app) | [Review PR](https://github.com/mekala27-45/crewbench/pull/1)

Verification source: ca0b9f3f12b482e91b12423b338a194296b86148. Imported evidence uses the exact commits in evaluation/review-request.json. No completed release is claimed. Execution and independent analysis were frozen before inference.

Baseline grading here applies the public evidence policy. Separate private answer-key verification remains pending.

deterministic_baseline: 48 of 48 planned cases passed strict grading. Source 70280d6e8c3587ae16e0349212254d32f655a48bb16cc7cd8e905534222c4f53. Window 2026-11-05T22:02:42.354Z to 2026-11-05T22:02:42.785Z.

solo_agent: 3 of 12 planned cases passed strict grading. Source b9d4f7550fe1bc0afe0cbc680d78031ca232ee73c67808d1aedba0ca02bb9757. Window 2026-11-05T22:04:48.293Z to 2026-11-05T22:55:07.629Z.

split_review: 1 of 12 planned cases passed strict grading. Source b9d4f7550fe1bc0afe0cbc680d78031ca232ee73c67808d1aedba0ca02bb9757. Window 2026-11-05T22:04:48.293Z to 2026-11-05T22:55:07.629Z.

runtime_invariants: 12 of 12 planned fault overlays passed independent verification. Source 19faca8afca392278b4dd7d3eae588a8b1961421eb2de64256658434bb3ef843. Window 2026-11-05T22:02:43.000Z to 2026-11-05T22:11:25.941Z.

Contract checks: 33 Node tests and 26 Python tests passed. Browser checks: 60 passed.

## Section 20

| Requirement | Status | Evidence and observed outcome |
| --- | --- | --- |
| Scaffold, dependency and host probes are recorded and reproducible. | done | artifacts/probes/remote.json; selected native model calibration run 42114717980; host packaging run 42116306332; lockfile and CI install probes retained. |
| Claim renderer refuses missing provenance and separates execution modes. | done | https://github.com/mekala27-45/crewbench/blob/a67e32fb03a40d3c598b1b64512257b213589a9f/artifacts/contracts/runtime.log; source b35b8908b8f11ebdf8c5b933a40c3bbcafc24c45; contract suite passed and this report was generated through the provenance renderer. |
| All forty-eight cases, isolated splits and the exact subset are validated. | done | https://github.com/mekala27-45/crewbench/blob/a67e32fb03a40d3c598b1b64512257b213589a9f/artifacts/contracts/runtime.log; source b35b8908b8f11ebdf8c5b933a40c3bbcafc24c45; corpus contract passed. |
| Baseline and independent grader agree on declared truth and edge cases. | not done | Fresh public-policy grading passed; the separately retained private latent answer key has not been verified in this review. |
| Trial receipts, uniqueness and session scope pass independent readback. | done | https://github.com/mekala27-45/crewbench/blob/dc6296b74b20da5159e8c302d76ad065792edbab/artifacts/api/check.json; source 7a8ad6d919ceb9dff2b9bd33ddb623d52939423c; persisted assessment, duplicate replay, conflict and cross-session isolation checks passed. |
| Actual solo tool use and every dispatched request have verified accounting. | done | https://github.com/mekala27-45/crewbench/blob/77f943782bf8af098430d77160716104dcec4e73/artifacts/development/trials.json; source 43789f67432efa7c0720270a6268eaaccd8c0873; artifacts/development/accounting-audit.json binds requests, native emissions, usage, receipts and fresh database readback. |
| Both specialists and synthesis have actual development invocation evidence. | done | https://github.com/mekala27-45/crewbench/blob/77f943782bf8af098430d77160716104dcec4e73/artifacts/development/trials.json; source 43789f67432efa7c0720270a6268eaaccd8c0873; completed native responses by role: {"solo":10,"tests":6,"staging":8,"synthesis":4}. Timed-out dispatches are retained separately. |
| Fencing, joins, expiry, cancellation and late output preserve invariants. | done | https://github.com/mekala27-45/crewbench/blob/a67e32fb03a40d3c598b1b64512257b213589a9f/artifacts/contracts/runtime.log and https://github.com/mekala27-45/crewbench/blob/12720bdec552e1e2529583ee577e160f73386ed5/artifacts/recovery/results.json; contract checks and independently graded fault evidence. |
| Live API completes a persisted baseline flow from browser and separate client. | not done | https://crewbench-api.vercel.app; public database binding/access are not configured. https://github.com/mekala27-45/crewbench/blob/dc6296b74b20da5159e8c302d76ad065792edbab/artifacts/api/check.json proves isolated CI behavior only. |
| All twelve scripted overlays have injection and fresh post-action evidence. | done | https://github.com/mekala27-45/crewbench/blob/12720bdec552e1e2529583ee577e160f73386ed5/artifacts/recovery/results.json; source b35b8908b8f11ebdf8c5b933a40c3bbcafc24c45; 12/12 passed schema-v2 verification. |
| Frozen paired evaluation attempts all twenty-four actual method-case trials. | done | https://github.com/mekala27-45/crewbench/blob/ec4724809b080120f00c35bbe1e5a602c16b9f43/artifacts/actual/results.json; all 24 registered trials have independently verified dispatch and accounting. The 93 causal files and dispatch control match the pre-inference analysis freeze. |
| Immutable grades, paired statistics and resource claims reconcile with evidence. | done | artifacts/actual/independent-accounting.json, grades.json and summary.json bind unchanged raw results to the pre-frozen independent public-record grader. All 24 planned trials remain in the denominator; private answer-key verification remains pending. |
| Compare and Case work with exact evidence navigation and visible mode labels. | done | https://github.com/mekala27-45/crewbench/blob/dc6296b74b20da5159e8c302d76ad065792edbab/artifacts/browser/results.json; source 7a8ad6d919ceb9dff2b9bd33ddb623d52939423c; 60 browser checks passed, including committed-response recovery. |
| Recovery and Method pass responsive, keyboard and error-state browser checks. | done | https://github.com/mekala27-45/crewbench/blob/dc6296b74b20da5159e8c302d76ad065792edbab/artifacts/browser/results.json; source 7a8ad6d919ceb9dff2b9bd33ddb623d52939423c; all configured viewport/theme projects passed without skipped, unexpected or flaky tests. |
| Repository guidance, three skills, decisions, notices and operating notes exist. | done | AGENTS.md, CLAUDE.md, .agents/skills/, DECISIONS.md, DEAD-ENDS.md, docs/NOTICES.md, docs/OPERATIONS.md; all required files checked by this generator. |
| CI preserves failed runs, validates provenance and protects retained evidence. | done | https://github.com/mekala27-45/crewbench/blob/a67e32fb03a40d3c598b1b64512257b213589a9f/artifacts/contracts/retention.json; source b35b8908b8f11ebdf8c5b933a40c3bbcafc24c45; 5 immutable pins checked, automatic deletion disabled. Failed runs 42111622499, 42113530294 and 42113752057 remain in Actions. |
| Clean rederive and fresh final live verification pass for release inputs. | not done | Public-record rederive is provisional. Private-key verification, final production browser/client readback and release-input checks remain incomplete. |
| Authorized release commit and tag match the verified evidence manifest. | not done | Draft PR https://github.com/mekala27-45/crewbench/pull/1; no completed release tag. Merge and deployment configuration require explicit authorization after automatic review rejection. |

Utility outcome: No demonstrated useful model behavior under the registered utility floor. Solo strict success 3/12; split review 1/12. These are provisional public-record grades. Separate private answer-key verification is pending.

Stretch work: not started.

Publication blockers: updating main, configuring the dedicated Neon connection and changing public API access require explicit authorization after the earlier automatic approval rejection. Final live browser/client verification and private-key grading remain incomplete.

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
