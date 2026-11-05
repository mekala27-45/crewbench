---
name: inspect-trial-recovery
description: Inject and independently inspect Crewbench lifecycle recovery in an isolated test database. Use when verifying worker death, duplicate delivery or budget races.
---

# inspect-trial-recovery

Read docs/OPERATIONS.md. Require a disposable loopback PostgreSQL database and no production credentials. Run node scripts/recovery.ts, then python3 evaluation/recovery.py artifacts/recovery/results.json artifacts/recovery/grades.json. Expect 12 overlays, injection proofs and a fresh readback process for every action. Check original deadlines, worker fencing, child slots, joined receipts, terminal uniqueness and nonrefundable reservations. Stop on RECOVERY_REQUIRES_ISOLATED_LOOPBACK_DATABASE, missing injection proof, stale observation, duplicate acceptance or an over-budget counter. A failure message is not recovery evidence.

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
