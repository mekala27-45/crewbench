# Serialize native CPU requests

Status: accepted for the current development plan; held-out freeze pending.

Use one active qwen3:1.7b native Ollama request. Pin provider binary, model artifact and template. Both actual methods share decoding and aggregate caps. CPU time and tool-schema errors observed in development make finite deadlines necessary.

Evidence: evaluation/model-lock.json; results/model-probe-42096240270; results/development-42105724261.
