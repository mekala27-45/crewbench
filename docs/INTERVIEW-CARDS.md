# Interview cards

Project evidence only. These statements describe this repository, not employment experience. Generated from public report digest e33f67734d0f14e7befbafe6a91190fdae6c6c9c62de206daea804048b55d7f3.

## Problem

I built Crewbench to test whether delegation improved a small evidence-review task when one agent and a fixed team had the same total resource limits.

## Design

One method uses a single tool-using agent. The other uses two specialists and a synthesis agent. Code enforces shared budgets, fenced ownership and durable receipts. Actual model runs, deterministic decisions and scripted recovery tests are separate.

## Evidence

The frozen comparison covered 12 paired cases. Solo produced 3 of 12 strict successes; split review produced 1 of 12. The observed split-minus-solo difference was -16.7 percentage points. No demonstrated useful model behavior under the registered utility floor.

These results are provisional: independent public-record grading is complete, but comparison with the private authored answer key is pending. The deterministic baseline has 48 of 48 strict successes. Scripted recovery has 12 of 12 independently verified overlays. Requests, tokens, elapsed time and source digests are in [report data](https://mekala27-45.github.io/crewbench/data/report.json).

## Tradeoff

This is one small CPU model with fixed role partitions and authored typed evidence. It does not isolate agent count alone or measure production release quality. Missing provider usage remains unknown.

## Failure

The first explicit 4B instruct candidate printed bare JSON instead of calling the submission tool. The runtime correctly refused those outputs. I clarified the native tool-call contract without adding a text-to-tool repair. Development run 42111083922 then recorded accepted solo and specialist submissions, while synthesis still timed out at the earlier deadline. Both the failure and the revised run remain inspectable.

## Current boundary

The recorded evidence site is public. Final hosted database acceptance and completed-release checks remain pending; the site must not be presented as a completed live service.

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
