# Draft project post

Draft only. Not sent or published to a social account.

The hard part of this build was accounting for work after a failure. Crewbench gives each model request a reservation, each child result a receipt and each recovery check a fresh database read. The scripted failure suite verified 12 of 12 overlays. Model quality is reported separately.

The held-out actual comparison is pending. Development traces establish model invocation only; no held-out model success rate is claimed.

Private-key baseline checks do not establish a completed actual comparison. The public site presents recorded evidence; final live API acceptance remains pending.

Demo: https://mekala27-45.github.io/crewbench/
Evidence: https://github.com/mekala27-45/crewbench/blob/main/RESULTS.md
