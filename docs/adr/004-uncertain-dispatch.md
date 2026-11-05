# Do not resend an uncertain dispatch

Status: accepted for the current development plan; held-out freeze pending.

A committed intent followed by worker death cannot prove the provider did no work. After lease turnover, mark it indeterminate and retain the reservation. The strengthened fault test kills a real child process after intent and verifies no second dispatch through fresh readback.

Evidence: scripts/fault-worker.ts; scripts/recovery.ts; recovery run 42105724261.
