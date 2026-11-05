# crewbench

Does a fixed split review improve on a solo tool-using agent under the same aggregate resource limits?

[Open the evidence site](https://mekala27-45.github.io/crewbench/) · [Recorded report](https://mekala27-45.github.io/crewbench/data/report.json) · [API deployment](https://crewbench-api.vercel.app)

The evidence site is published. Actual model development is still in progress, and no frozen held-out model success rate is claimed. The public API container built successfully, but its database binding and public access remain blocked. The site reports live-service failure explicitly.

The deterministic PostgreSQL baseline passed independent grading on all 48 authored cases, including 24 held-out cases and the exact 12-case paired subset. Run 42103168989 verified 12 of 12 scripted recovery overlays with post-action reads from a separate process. API and browser run 42106567251 passed 20 API checks and 42 browser checks across 360, 768 and 1440 pixels, both themes and enlarged text.

## Architecture

```mermaid
flowchart TD
  V["Visitor"] --> P["Pages evidence workbench"]
  P --> A["Bounded baseline API"]
  A --> D["PostgreSQL receipts"]
  W["Private Eve workflow"] --> S["Solo agent"]
  W --> T["Test specialist"]
  W --> G["Staging specialist"]
  T --> J["Verified join"]
  G --> J
  J --> Y["Synthesis agent"]
  S --> D
  Y --> D
  D --> R["Independent grading and reports"]
  R --> P
```

The public API accepts fixed synthetic baseline cases only. The private worker uses a local CPU model, one active provider request and a fixed graph. Actual role tools can list evidence, read up to four canonical records and submit structured findings or assessments. They have no shell, arbitrary files, HTTP, deployment or model-directed delegation tools.

## Reproduce

Use Node 24.19.0 and Python 3. Run `npm ci`, `npm test` and `python3 -m unittest discover -s tests -p 'test_*.py'`. The lockfile pins every installed dependency.

For PostgreSQL checks, set `DATABASE_URL` to an isolated development database, then run `node scripts/migrate.ts`, `node scripts/baseline.ts --postgres` and `node scripts/recovery.ts`. Recovery refuses remote database hosts and creates its own test schema. `node src/api/server.ts`, `node scripts/check-api.ts` and `npx playwright test` exercise the live baseline flow and browser states.

The private latent answer key remains local. Public runtime evidence and prior independent baseline grades are available, but complete latent-truth regeneration requires those retained local files or explicit publication authorization.

Development and model-probe result branches retain failed runs. The freeze workflow verifies actual role provenance and the calibration artifact before preparing a reviewable request. The evaluation runner must match the exact freeze digest and registers all 24 planned method-case rows before inference. Failed and unexecuted rows remain in the denominator.

## Evidence and limits

- [Baseline and first actual runtime evidence](https://github.com/mekala27-45/crewbench/tree/results/development-42099764606/artifacts)
- [Verified scripted recovery](https://github.com/mekala27-45/crewbench/tree/results/development-42103168989/artifacts/recovery)
- [Responsive browser and API evidence](https://github.com/mekala27-45/crewbench/tree/results/web-42106567251/artifacts)
- [Native provider and submission-size calibration](https://github.com/mekala27-45/crewbench/tree/results/model-probe-42109940072/artifacts/probes)
- [Decisions](DECISIONS.md), [retained failures](DEAD-ENDS.md), [operating notes](docs/OPERATIONS.md) and [limitations](docs/LIMITATIONS.md)

The 1.7B candidate produced invalid references and omitted fields. The explicit 4B instruction-only candidate is now pinned by native artifact and template hashes. Run 42109940250 produced bare JSON instead of native submission tool calls, so all four trials failed. Tool-format clarification is being verified on development cases. Those are actual failures, not successful model assessments. The calibration probe found the largest representative development submissions fit within the 512-token output ceiling: 191 tokens for solo and synthesis, 102 for the test specialist and 106 for the staging specialist.

Fixed partitions, context construction and role prompts differ as well as agent count. The experiment cannot isolate agent count alone, establish general superiority or measure production release quality. Inference is serialized, so no parallel speedup is claimed. The registered utility floor is 8 of 12 strict successes per method with no accepted unsupported ready verdict. It is not forced to pass.

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
