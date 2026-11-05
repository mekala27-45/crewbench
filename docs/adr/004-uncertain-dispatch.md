# Stop uncertain dispatch instead of guessing

Status: accepted for development.

A transaction can reserve resources and write intent but cannot atomically commit a remote inference. On recovery without a durable response, mark indeterminate and retain the reservation. Do not refund or redispatch. Evidence: src/runtime/state.ts and the uncertain_dispatch overlay.

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
