# Crewbench contributor contract

Crewbench is a portfolio experiment on authored synthetic release evidence. Read docs/SPEC.md and evaluation/plan.json before changing behavior. The user brief requires three repository operator skills under .agents/skills; these are project documents, not globally installed personal skills.

Use exact mode labels: deterministic_baseline, actual_model, and scripted_runtime. Development traces do not count as held-out evaluation. A green workflow means the job completed, not that a model assessment passed. Preserve failed and unexecuted trials.

Run npm test and python3 -m unittest discover -s tests -p 'test_*.py'. Run node scripts/generate-agents.mjs and verify that agent files match authored instruction inputs. Database and browser checks run in isolated PostgreSQL on the review branch.

Runtime roles may only list_evidence, read_evidence and submit_findings or submit_assessment. Synthesis cannot list. Do not expose shell, network, filesystem, arbitrary SQL, deployment, recursive delegation, or latent truth tools to roles. Root mockModel is deterministic workflow dispatch and is never reported as evaluated inference. Receipt reference options contain identities only. Never repair a model answer in code.

Keep fixtures/truth/answers.json and scripts/generate-corpus.py private. Do not commit credentials, environment files, raw authorization headers, or database URLs. Never place operator skills or evaluator truth in role prompts.

Freeze before any held-out inference. Require one actual development split flow with responses from both specialists and synthesis. Changed prompts, model artifacts, budgets or subset invalidate a freeze. Do not overwrite a primary run or substitute a later configuration into its denominator. Missing usage stays null with a reason.

Use fresh independent database readback after each injected action. A terminal result cannot be revived. Uncertain dispatch ends indeterminate; do not resend automatically. Do not delete retained evidence referenced by a report, freeze or release.

Recorded approval blocks remain: moving main, transferring the Neon credential into Vercel, removing deployment protection, and publicly publishing private truth. Prepare reviewable work on codex/crewbench-completion. Do not retry a rejected action through another tool. Specific user approval is required to proceed with those blocked actions.

A final release requires all eighteen lines in RESULTS.md backed by observed artifacts, current production verification and an authorized tag. Keep unmet checks not done. See OPERATIONS.md for commands and current blockers.
