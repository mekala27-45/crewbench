# Development observations

Local dependency probes could not resolve npm from the restricted shell. Dependency installation moved to the standard public Actions runner, where the exact package set and Eve imports succeeded.

The first full development worker installed Ollama but failed to locate the executable in the same shell step. GITHUB_PATH applies to later steps. The fix explicitly prepends the verified binary directory in the startup shell. Run 42099350547 preserves the successful PostgreSQL baseline and the failed startup.

The next worker reached Eve but the default production channel correctly refused unauthenticated sessions. An ephemeral worker-only bearer verifier now protects the loopback channel. Run 42099764606 retains four failed development rows with zero provider dispatches. They are not actual performance measurements.

The first browser job failed before checkout because single quotes in Docker health options were parsed as arguments. The health command now uses PGUSER and a pinned PostgreSQL image. Run 42101405822 is an infrastructure failure, not a browser pass.

Automatic review refused public answer-key publication. Latent answers and their authoring script remain local; the public runtime and published reports do not contain the private canary records.


Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
