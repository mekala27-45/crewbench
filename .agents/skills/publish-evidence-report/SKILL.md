---
name: publish-evidence-report
description: Validate and render Crewbench evidence for an authorized publication. Use when updating comparison data, project results or a release manifest.
---

# publish-evidence-report

Read AGENTS.md and docs/SPEC.md. Validate source commit, plan, artifact digests, exact trial keys, all planned denominators and separate execution modes. Refuse traversal, duplicate identities, empty measurement evidence and stale grades. Run node scripts/build-report.ts only after those inputs are present. Run browser checks, a fresh deployed baseline and clean rederive before a completed release tag. Expect sanitized report JSON, four static views, rendered status checklist and an immutable release manifest. Stop on BASELINE_GRADE_PROVENANCE, BASELINE_DENOMINATOR, FREEZE_MISMATCH or missing live verification. This procedure grants no additional publication or credential-transfer permission.

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
