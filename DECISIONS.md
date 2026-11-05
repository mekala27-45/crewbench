# Decisions grounded in observed runs

The strong deterministic baseline is deliberate. The task has four typed checks and an explicit policy. It is the reference against which added model cost must be judged, not a weak opponent selected to make agents look useful. PostgreSQL baseline run 42099764606 supplied 48 accepted assessments, independently graded 48 of 48.

The first actual workflow failed before inference because the Eve production endpoint required authentication. Run 42099764606 preserved four zero-dispatch failures. An ephemeral bearer credential now binds the loopback channel to the test worker. The public API image does not contain the Eve agent.

The Eve child runtime continued after an accepted tool submission. The adapter now returns a clearly labeled control acknowledgement after the durable submission. This acknowledgement creates no provider attempt, model usage or assessment. Real role responses remain separately recorded.

Development run 42100346254 showed a 30-second synthesis timeout and schema failures. Runs 42102826720 and 42103168989 showed that three requests per specialist could be spent on catalog and individual reads before submission. Revision 3 declares five requests per specialist and two for synthesis, within the same 12-request aggregate limit available to solo. It also declares 360-second trials and 120-second individual requests before held-out inference.

The CPU provider permits one active request. The workflow is serialized, including split review. This design measures correctness and coordination costs without claiming parallel speedup. Unknown provider usage and unobserved teardown are reported as unknown.

An uncertain dispatch is terminal and indeterminate after lease takeover. Recovery does not guess whether a model request happened and does not resend it. Scripted run 42103168989 verified this alongside duplicate delivery, response loss, a real SIGKILL, cancellation races and contested reservations.

The static evidence report is public on GitHub Pages. The API container built on Vercel, but database credential transfer and removal of deployment protection were rejected by automatic approval review. The browser shows an explicit unavailable state. This is an unresolved live API requirement, not a successful end-to-end deployment.

The 360-pixel browser test exposed an unbroken source hash in the Method view. The published page reproduced that overflow. Evidence identifiers now wrap, and the suite covers 360, 768 and 1440 pixels in both themes, plus doubled text scale.

Revision 4 changes the CPU model to qwen3:4b-instruct-2507-q4_K_M with digest 0edcdef34593eac1aa2be9c7d06c432dcf81945adca5eca2f27662c18f168ba0. It retains the same budgets, fixed partitions, held-out subset and utility floor. The model-native probe and submission-size calibration are retained in run 42109940072. Before freeze, the gate requires matching plan/model identities, zero GPU placement and one actual three-role development flow.

An explicit --public-records grading mode computes expected states from the public evidence using the independent Python policy. It never reads or publishes the private answer key and sets private_truth_verified=false. Such reports are provisional and cannot satisfy the completed release gate. Default grading still fails closed if the private key is unavailable.

The matched timing revision is documented in [the development timeout decision](docs/adr/008-development-timeouts.md). The transport and independent readback audit must qualify the retained development bundle before the freeze gate can accept it.

Portfolio experiment on authored synthetic release evidence. No production release is assessed or changed. Actual model runs, deterministic decisions and scripted runtime tests are reported separately. Results apply only to the declared cases, model, budgets and execution environment.
