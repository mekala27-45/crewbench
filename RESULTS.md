# Results and release status

This is a development checkpoint, not a completed release. The [public evidence site](https://mekala27-45.github.io/crewbench/) is usable and the recorded deterministic baseline is 48/48. The twelve scripted recovery overlays passed independent post-action verification. Held-out actual model performance has not been published.

The explicit qwen3:4b-instruct-2507-q4_K_M candidate produced two accepted solo assessments and one accepted full split flow in [development run 42115848494](https://github.com/mekala27-45/crewbench/actions/runs/42115848494). Its other split trial failed to submit. All 28 model requests reconciled with native responses, reservations and tool emissions. Freeze run 42117814226 sealed 101 inputs. The primary 24-trial evaluation is running at source d3d3a2e5a81cf6a0cd46e80b92fbf403b0ae2c92. Utility is pending.

The newest completed runtime contract run has 25 passing tests, and the independent Python suite has 15. API verification has 21 checks and the responsive browser suite has 42. A workflow publisher succeeding does not override a failed test or trial: inspect the retained status and logs.

The API host originally built the container, then reached its container image limit through unnecessary evidence-branch deployments. The replacement native Node package now compiles with TypeScript 6.0.3; host run 42116306332 passed the compiled package inspection and all 21 database/API checks, including independent SQL readback. Automatic API deployment is disabled after Vercel imposed a 24-hour rate limit. No paid plan change was made.

Automatic review rejected transfer of the dedicated Neon credential to the Vercel API and removal of deployment protection. Those actions remain untouched. The private answer key remains private. The local Windows runner and browser controller currently reject Linux paths in their permission configuration, so fresh private-key grading and local final verification cannot run.

## Section 20 checklist

| Status | Requirement | Evidence |
| --- | --- | --- |
| done | Scaffold, dependency and host probes are recorded and reproducible. | Bootstrap 42114258088 retains the exact package lock; host run 42116306332 verifies the compiled native package and its 21 API/database checks. |
| done | Claim renderer refuses missing provenance and separates execution modes. | tests/claims.test.ts and contract run 42115848469; public report keeps baseline, actual and scripted sections separate. |
| done | All forty-eight cases, isolated splits and the exact subset are validated. | Corpus contract checks in run 42115848469; evaluation/case-index.json and model-subset.json. |
| done | Baseline and independent grader agree on declared truth and edge cases. | Prior private-key baseline verification was 48/48; current independent-policy and negative provenance tests pass in run 42115848469. |
| done | Trial receipts, uniqueness and session scope pass independent readback. | API run 42113424255: 21 checks, one accepted assessment, replay and cross-session refusal with separate SQL readback. |
| done | Actual solo tool use and every dispatched request have verified accounting. | Development 42115848494 and freeze 42117814226 independently reconcile all 28 requests across four development trials. The primary evaluation audit remains pending its completion. |
| done | Both specialists and synthesis have actual development invocation evidence. | Development 42115848494 records accepted tests, staging and synthesis submissions in the same split trial. |
| done | Fencing, joins, expiry, cancellation and late output preserve invariants. | Current runtime contracts pass; scripted recovery run 42103168989 verifies takeover, cancellation and uncertainty. |
| not done | Live API completes a persisted baseline flow from browser and separate client. | Isolated API/browser checks pass. Public database binding and access are not authorized; Vercel has also imposed a deployment cooldown. |
| done | All twelve scripted overlays have injection and fresh post-action evidence. | Run 42103168989: 12/12, including SIGKILL and fresh-process SQL observations; canonical digest 38b5dac999e7199baf35e52eacb38f61f1e3ad458d039d4b42e11bda26db2804. |
| not done | Frozen paired evaluation attempts all twenty-four actual method-case trials. | Freeze 42117814226 passed. Primary run 42118015947 is in progress; its 24 actual dispatches have not yet been verified. |
| not done | Immutable grades, paired statistics and resource claims reconcile with evidence. | Frozen grading and paired-statistics code is tested. No held-out result is claimed; private-key regrading is also blocked by the local runner configuration. |
| done | Compare and Case work with exact evidence navigation and visible mode labels. | Run 42114717646 passed 42 browser checks with current data and both themes. |
| done | Recovery and Method pass responsive, keyboard and error-state browser checks. | Run 42114717646 covers 360, 768 and 1440 pixels, keyboard access, doubled zoom, denied/offline service and failed-model presentation. |
| done | Repository guidance, three skills, decisions, notices and operating notes exist. | AGENTS.md, CLAUDE.md, .agents/skills, DECISIONS.md, DEAD-ENDS.md and docs/NOTICES.md. |
| done | CI preserves failed runs, validates provenance and protects retained evidence. | Results branches preserve failures; sealed manifests validate hashes. Contract run 42111404369 verified five pinned evidence branches; retention never deletes automatically. |
| not done | Clean rederive and fresh final live verification pass for release inputs. | Local execution and browser control are blocked by invalid Linux permission paths in the Windows session. Public live verification remains pending. |
| not done | Authorized release commit and tag match the verified evidence manifest. | No completed-release tag has been created. Required model and live-service gates remain open. |

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
