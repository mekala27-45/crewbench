---
name: inspect-trial-recovery
description: Verify Crewbench scripted failure recovery through injected faults and fresh independent PostgreSQL readback.
---

Read AGENTS.md and OPERATIONS.md. Require an isolated local PostgreSQL service, an allowlisted crewbench_test_ schema, recorded source and a known synthetic development fixture. Refuse production targets and ambiguous schema names.

Run node scripts/recovery.ts. The runner arms fault boundaries, kills the designated worker when required, exercises both cancellation orderings and starts independent readback after each action. Run python3 evaluation/recovery.py artifacts/recovery/results.json artifacts/recovery/grades.json.

Inspect all 12 inventory rows, injection PID or barrier proof, action_end, read_at, connection identity, state digest, counts and event sequence. Require grade schema_version 2 and inventory_valid true. A missing or stale observation, wrong digest, duplicate trial, absent process kill or missing cancellation ordering is a failed verification.

Keep raw and graded evidence together. Refuse automatic resend after uncertain dispatch. Keep accepted children unchanged across lease turnover. Do not call scripted outcomes model capability and do not delete referenced evidence.
