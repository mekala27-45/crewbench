# Operating notes

The API image needs DATABASE_URL for the dedicated Crewbench database. The variable is not configured in Vercel because automatic approval review rejected transferring the database credential. Vercel deployment protection remains enabled because removing it was also rejected. Do not retry either action until the user specifically authorizes the destination and public access change.

The worker uses an ephemeral test PostgreSQL service, local Ollama, one CPU model and an ephemeral loopback token. Keep that token and all database values out of artifacts. The native artifact digest is recorded by the provider probe. A failed run is not successful merely because the workflow publisher exits zero.

Apply migrations before readiness. Use a new API session for final verification. Check a completed baseline, identical retry, conflicting retry, bad capability, another-session access and fresh SQL counts. Check the canonical deployed commit against health. A health response alone does not pass live acceptance.

Session creation returns its random capability once. A retry of the same creation key returns the same session identity but cannot reconstruct the capability. If the initial response was lost, create a new bounded session. Later mutation receipts are replayable within their session. The browser keeps the capability in memory only.

Evidence retention takes priority over demo availability. Expired capabilities cannot authorize requests. At the persistent admission ceiling, refuse new sessions. Do not delete referenced evidence to recover capacity. Automated reclamation of expired demo records is not yet implemented.

Use an isolated loopback database for recovery tests. The script refuses remote hosts, creates a dedicated test schema, kills only its own child PID and obtains post-action observations from another process. Never inject faults into the hosted demo database.


Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
