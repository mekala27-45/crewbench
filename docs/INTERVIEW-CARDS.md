# Interview cards

Project evidence only. These statements describe this repository, not employment experience. Generated from public report digest 6469c8b7efe014f6c8075727242843a17a5bd828e49a61c9ab7401b215771988.

## Problem

I built Crewbench to test whether delegation improved a small evidence-review task when one agent and a fixed team had the same total resource limits.

## Design

One method uses a single tool-using agent. The other uses two specialists and a synthesis agent. Code enforces shared budgets, fenced ownership and durable receipts. Actual model runs, deterministic decisions and scripted recovery tests are separate.

## Evidence

The held-out actual comparison is pending. Development traces establish model invocation only; no held-out model success rate is claimed.

Private-key baseline checks do not establish a completed actual comparison. The deterministic baseline has 48 of 48 strict successes. Scripted recovery has 12 of 12 independently verified overlays. Requests, tokens, elapsed time and source digests are in [report data](https://mekala27-45.github.io/crewbench/data/report.json).

## Tradeoff

This is one small CPU model with fixed role partitions and authored typed evidence. It does not isolate agent count alone or measure production release quality. Missing provider usage remains unknown.

## Failure

The first explicit 4B instruct candidate printed bare JSON instead of calling the submission tool. The runtime correctly refused those outputs. I clarified the native tool-call contract without adding a text-to-tool repair. Development run 42111083922 then recorded accepted solo and specialist submissions, while synthesis still timed out at the earlier deadline. Both the failure and the revised run remain inspectable.

## Current boundary

The recorded evidence site is public. Final hosted database acceptance and completed-release checks remain pending; the site must not be presented as a completed live service.

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
