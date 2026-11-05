# Development timing adjustment

The retained CPU development traces show synthesis requests timing out at the provider boundary after accepted specialist submissions. The trial itself still had time remaining. This is a development instrumentation limit, not a held-out result.

Both methods receive the same revised request and trial deadlines in evaluation/plan.json. All other resource ceilings, role partitions, model settings, task cases and grading rules remain fixed. The previous request failures remain in their results branches. New calibration and actual development evidence must match the revised plan before freezing.

Evidence: results/development-42111083922 and results/development-42112609212, artifacts/development/trials.json. Inspect the synthesis attempt elapsed_ms and terminal failure. No held-out inference informed this change.

The framework session watchdog is longer than the registered trial deadline. The database deadline remains authoritative; increasing the framework watchdog cannot accept late assessments. The CI job also allows the declared worst-case development schedule plus the scripted recovery checks.
