---
name: run-paired-evaluation
description: Run the frozen Crewbench paired evaluation and retain every planned outcome. Use when launching or reviewing the registered actual model schedule.
---

# run-paired-evaluation

Read evaluation/plan.json, the freeze manifest and AGENTS.md. Require a matching source tree, model artifact, template, case subset and budgets. Run the freeze verifier before startup. Probe the local provider and record every role invocation. Execute the counterbalanced 24-row schedule with one active request. Retain failures and unexecuted rows. Run the independent grader only after output is immutable. Expect request manifest, raw sanitized transport records, trial readback and grades. Stop on FREEZE_MISMATCH, MODEL_DIGEST_MISMATCH, missing actual-role provenance or absent planned rows. Never choose replacement cases or change thresholds after results.

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
