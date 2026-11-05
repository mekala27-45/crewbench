# Keep the public API and recorded site distinct

Status: accepted for the current development plan; held-out freeze pending.

The static interface displays recorded evidence and calls a scoped live baseline API. PostgreSQL is the durable authority. Vercel and Neon setup exists, but credential transfer and deployment-protection changes are approval-blocked. CI loopback success cannot be labeled production success.

Evidence: API and browser run 42106593184; OPERATIONS.md.
