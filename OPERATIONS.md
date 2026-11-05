# Operating Crewbench

Current public endpoints are https://mekala27-45.github.io/crewbench/ and https://crewbench-api.vercel.app. The production persisted flow is not verified. The Neon-to-Vercel credential transfer and public API access are blocked by approval review. Isolated CI checks do not establish production availability.

## Local setup

Use Node 24.19.0 and the exact package-lock.json. Install with npm ci. Set DATABASE_URL privately for the dedicated Crewbench database; never print it. The evaluator answer key must be supplied separately at fixtures/truth/answers.json and must not be committed.

On PowerShell, the validated Python executable for this workstation is C:\Users\mekal\AppData\Roaming\uv\python\cpython-3.14-windows-x86_64-none\python.exe. The WindowsApps python alias did not start. Use python3 on Linux. The current Work session later rejected local commands because its permission profile contained file:///workspace on Windows; this is an environment configuration failure, not a project test failure.

Run npm test and the Python unittest suite. Run node scripts/migrate.ts only against the dedicated database. Run node scripts/baseline.ts --postgres, then independently grade the resulting baseline file with evaluation/grade.py and the private truth key. Inspect the script's recorded output path before grading.

## Recovery and inspection

Run node scripts/recovery.ts with an isolated local PostgreSQL service, then python3 evaluation/recovery.py artifacts/recovery/results.json artifacts/recovery/grades.json. The runner creates a random allowlisted crewbench_test_ schema. Keep the raw traces and grade hashes together. Do not use production data or claim recovery from a pre-action read.

Use node scripts/fresh-readback.ts with the runner's recorded environment and trial identifier when investigating an overlay. Recover committed receipts through the runner's fenced lease path. An indeterminate provider dispatch is not eligible for automatic resend.

The browser's baseline controls use a fresh scoped session. Cancel only an owned active trial through its API capability; restarting an expired session does not grant access to another session's trials. Preserve request IDs when retrying the same operation. A network error does not prove the operation failed to commit.

## Evaluation and reports

The three operator skills give bounded sequences. Do not create evaluation/requests/core.json until node scripts/freeze.ts --verify passes and the request identifies the committed frozen source. The request commit must change only that request file. CI preserves all 24 planned rows even if dependency or model startup fails.

The local provider binds 127.0.0.1:11434. scripts/install-ollama.py checks the pinned binary digest. scripts/probe-model.mjs records provider version, model digest, template, placement and an actual native tool call. Probe success is not a completed agent review.

For a retained primary run, grade its original bytes with the private key, run evaluation/statistics.py, then node scripts/build-report.ts. Do not rerun inference while rederiving a report. Import into a new directory and reject source, plan, freeze or digest mismatches. Keep prior bundles untouched.

## Cleanup and release

Keep production, prior daily projects, all frozen evidence, and all primary failures. Inspect the exact schema named in a recovery artifact. A cleanup query is permitted only after confirming a dedicated crewbench_test_ hexadecimal schema and that it is no longer referenced by ongoing work. There is deliberately no broad DROP DATABASE or wildcard filesystem cleanup command.

Merge, deployment configuration and release tagging remain separate authorized actions. After approval, configure only crewbench-api, rerun the browser and independent-client persisted flow against the canonical API, and record a fresh release manifest before tagging. Never call a protected health probe a completed demonstration.
