---
name: run-paired-evaluation
description: Run the registered Crewbench paired model evaluation after a verified freeze and preserve every planned trial, including startup failures.
---

Read AGENTS.md, OPERATIONS.md and evaluation/plan.json. Require the exact source commit, evaluation/freeze.json, approved local CPU model identity, a dedicated PostgreSQL service and prior actual three-role development evidence.

Run node scripts/freeze.ts --verify. Run node scripts/probe-model.mjs and match model-lock.json. Initialize all 24 rows with scripts/initialize-evaluation.ts before dependency-dependent work. Use the bounded evaluation/requests/core.json and .github/workflows/evaluation.yml, or the same recorded commands in an isolated checkout. Run scripts/run-evaluation.ts --finalize after failure. Preserve artifacts/actual/results.json, model-probe.json, workflow.json and validated bundle.json.

Refuse FREEZE_MISMATCH, MODEL_IDENTITY_MISMATCH, REQUEST_SOURCE_CHANGED, incomplete subset, changed budgets or missing development roles. Never overwrite a freeze or primary run. Preserve unexecuted rows and null usage. Do not claim actual execution from a scripted fixture, provider intent alone or a native probe. Do not repair submissions.

Grade the original retained trace using evaluation/grade.py with private latent truth. Run evaluation/statistics.py on exactly that result and grade pair. Stop publication if source or denominator checks fail. This skill does not authorize publishing or changing deployment access.
