# Requirements Document

## Document Status

- Status: `Approved`
- Current solution revision ID: `SR-001`
- Package identifier: `voice-runtime-ready-after-model-load`
- Request / ticket: Project Task `autobyteus-655` (prerequisite PRE-001 of autobyteus-516)
- Requested by: `/project_task_manager` (run `project_task_manager_7c8dce0c4a8b44f88e776a83809dee03`), on the autobyteus-516 Solution Designer's request
- Requirements owner: Solution Designer
- Date: 2026-11-26
- Approved by and reference: `Solution Designer within the direction (user informed)`. Direction: the Task (fix readiness in the runtime for both backends, protocol otherwise unchanged, 0.3.1 from the 0.3.0 line, release on the founder's word) and the founder's words relayed in it ("whatever is more reasonable architecture-wise … you will decide"). The founder is informed in the Solution Designer conversation of 2026-11-26.
- Exact approved requirements baseline / solution revision: this document at SR-001
- Behavior-defining supplements and their approved versions: None

## Problem And Desired Outcome

- Problem: the voice runtime's worker announces `ready` before it has loaded anything. Both speech backends load their model inside the first real transcription, so every first dictation pays the whole load: about 25–30 s with cold files (RT-001; 516 probes), 1.8–2.7 s with warm files (RT-002). Silence cannot warm it, because silence is answered before any model use. A caller therefore cannot show an honest "Getting ready" state or warm the worker in the background.
- Affected actors or systems: the desktop app's Voice Input service (today's caller); the autobyteus-516 Voice Input extension (next caller, pins 0.3.1); the person dictating.
- Desired outcome: `ready` means the worker can transcribe now. The model's load and first-run cost happen before `ready`, so the first transcription after `ready` costs what any later one does. A worker that cannot become able to transcribe says why and does not announce `ready`.
- Observable definition of success: with the real 0.3.1 runtime, `ready` arrives only after the model has loaded and a transcription has run; on Apple Silicon (MLX) the first transcription of a ~3 s spoken clip after `ready` takes well under a second.

## Relevant Current And Desired Behavior

| Behavior ID | Kind | Related Scenario IDs | Evidence-Backed Current Behavior | Desired Behavior | Intentionally Preserved Behavior | Investigation Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| BEH-001 | Contract | SCN-001, SCN-002 | `ready` ~0.1–0.5 s after start; the first non-silent transcription loads the model (cold ~25–30 s, warm 1.8–2.7 s on MLX) | `ready` only after the model is loaded and has transcribed once; the first transcription after `ready` has no first-time cost | `ready` message shape `{"type":"ready","backendKind":…}` | RT-001, RT-002, RT-003, RT-005 |
| BEH-002 | Contract | SCN-002 | Requests answered with `{requestId, ok, text, detectedLanguage, noSpeech, error}`; silence → `noSpeech:true` without the model; request errors → `ok:false` | Unchanged | All of it | worker `:180-232` |
| BEH-003 | Contract | SCN-003 | When the model cannot load or run, `ready` is still sent and each dictation fails with `ok:false` | The worker does not send `ready`; it writes one line saying why to stderr and exits non-zero | Today's caller turns a worker exit before `ready` into an error with the stderr text (`voiceInputRuntimeService.ts:134-143`) | Source Log |
| BEH-004 | Operational | SCN-004 | 0.3.0 is the latest 0.3.x release | 0.3.1 released from the 0.3.0 line through the existing workflow, on the founder's word | Release workflow, asset names, manifest schema | workflow |

## Stakeholders, Actors, And Outcomes

| Actor / Stakeholder | Goal Or Responsibility | Required Outcome | Important Constraint |
| --- | --- | --- | --- |
| Desktop Voice Input service | Start the worker, wait for `ready`, send requests | Keeps working unchanged | No timeout on `ready`; stderr is its failure text |
| 516 Voice Input extension | Warm the worker in the background, show "Getting ready" | `ready` it can trust | Pins 0.3.1 |
| Person dictating | Dictate | No long first wait once the worker is ready | — |

## Scope Guardrail (Mandatory)

### In-Scope Use Cases

| Use-Case ID | Use Case | Related Scenario IDs |
| --- | --- | --- |
| UC-001 | Start the worker and know when it can transcribe | SCN-001 |
| UC-002 | Dictate after `ready` | SCN-002 |
| UC-003 | Learn why a worker cannot start | SCN-003 |
| UC-004 | Release 0.3.1 | SCN-004 |

### Out Of Scope

- The desktop app and the superrepo (no change); the 516 extension package.
- The v1.0.0 work on `main`.
- The `prepare` command, the model download, the launcher's venv bootstrap.
- faster-whisper's per-transcription speed on CPU (3–5 s per ~3 s clip on Apple Silicon, RT-005), and the MLX backend's need for an external `ffmpeg` (FU-001).
- Unloading an idle model (the 516 extension stops the worker).

### Non-Goals

- Faster transcriptions in general: only the first-time cost moves before `ready`.
- New protocol messages (no "loading" or progress message).

### Preserved Behavior Boundary

BEH-002 and the `ready` message shape (BEH-001 preserved column); AC-005.

### Prerequisites

None.

### Review Authority

- Every blocking `Design Impact` or implementation-correction finding must cite an approved requirement, acceptance criterion, or preserved-behavior ID that it protects.
- A finding that would introduce new product behavior, policy, threat model, migration obligation, compatibility promise, or operational contract is a `Requirement Gap`; it requires explicit user approval before becoming authoritative.
- An adjacent concern outside the approved boundary may be recorded as a non-blocking risk, recommendation, or follow-up. It is not a required design correction, unless it is a prerequisite.
- A downstream reviewer comment does not amend this requirements basis. The Solution Designer must update the canonical requirements and obtain renewed user approval before a scope-changing proposal can govern design or implementation.

## Requirements

| Requirement ID | Requirement | Related Behavior IDs | Priority / Criticality | Rationale | Feasibility Evidence | Source / Decision Reference |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | On both backends, `serve` sends `ready` only after the speech model is loaded and one transcription of a short non-silent audio file has succeeded through the same path real requests use | BEH-001 | Must | `ready` must mean "can transcribe now"; a file proves decoding too (MLX needs `ffmpeg`) | RT-003 (MLX), RT-005 (faster-whisper) | Task; DEC-001, DEC-002 |
| REQ-002 | The first transcription after `ready` carries no load or first-run cost: on MLX (Apple Silicon) it takes well under a second for a ~3 s clip; on faster-whisper it takes no longer than later transcriptions of the same clip | BEH-001 | Must | The point of the fix | RT-003: 302–337 ms after warm-up; RT-005: first 3.9–4.1 s vs later 3.2–5.0 s | Task outcome; DEC-003 |
| REQ-003 | When the model cannot be loaded or the start-up transcription fails, the worker sends no `ready`, writes a one-line reason to stderr naming the backend and the cause, and exits with a non-zero code | BEH-003 | Must | Truthful readiness includes failure; today's caller already shows stderr as the error | Code read of the caller | DEC-004 |
| REQ-004 | Everything else in the protocol and the commands stays as in 0.3.0: arguments, the `ready` message shape, request and reply shapes, silence handling, request errors as `ok:false`, the `prepare` command | BEH-002 | Must | Existing callers | N/A | Task |
| REQ-005 | 0.3.1 is built from the 0.3.0 line, released through the repository's existing workflow (four bundles and `voice-input-runtime-manifest.json` on the `v0.3.1` GitHub release), only on the founder's word | BEH-004 | Must | 516 pins this artifact | N/A | Task; DEC-005 |

## Acceptance Criteria

| Acceptance-Criteria ID | Related Requirement IDs | Related Behavior / Scenario IDs | Preconditions / Trigger | Observable Expected Outcome | Important Alternate Or Failure Outcome | Verification Intent |
| --- | --- | --- | --- | --- | --- | --- |
| AC-001 | REQ-001 | BEH-001, SCN-001 | Unit: fake backends record calls | `ready` is written only after the backend's load and warm-up transcription returned; no `ready` before | — | Unit (CI) |
| AC-002 | REQ-001, REQ-002 | BEH-001, SCN-001/002 | Real 0.3.1 worker, MLX, APFS clone of a real install, ffmpeg on PATH | `ready` arrives after the load (seconds, not ~0.1 s); the first transcription of a ~3 s English clip after `ready` < 1,000 ms (target ~0.3 s), text correct | — | Live, `probes/drive_worker.py` |
| AC-003 | REQ-001, REQ-002 | BEH-001, SCN-001/002 | Real 0.3.1 worker, faster-whisper, isolated install | `ready` after the load; the first transcription after `ready` within the range of later ones; texts correct | — | Live (macOS arm64 CPU; DEC-006) |
| AC-004 | REQ-003 | BEH-003, SCN-003 | Model folder missing or corrupt; MLX with no `ffmpeg` on PATH | No `ready`; one stderr line naming backend and cause; exit code non-zero; today's caller would show that text | — | Unit + live |
| AC-005 | REQ-004 | BEH-002 | Existing and new unit tests; live requests | Same reply shapes; silence → `noSpeech:true`; unsupported request type → `ok:false`; `prepare` unchanged | — | Unit + live |
| AC-006 | REQ-005 | BEH-004, SCN-004 | Founder's word; tag `v0.3.1` on the 0.3.x line | Workflow green; release `v0.3.1` has the four bundles and the manifest naming 0.3.1; the AC-002 run repeated on the released darwin-arm64 bundle | Without the founder's word: nothing tagged | Delivery |

## Relevant Scenarios And Journeys

| Scenario ID | Kind | Actor / Initiator / Governing Contract | Coherent Goal Or Governing Event | Supported Trigger / Entry Surface | Starting Condition | Product-Level Steps Or Event Sequence | Expected Outcome | Supported Alternate / Error Behavior | Scenario Validity | Independent Evidence / Decision Reference | Related Requirement / AC IDs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCN-001 | System | Caller (desktop or 516 extension) | Know when the worker can transcribe | `serve` | Runtime and model installed | Start → load → warm-up → `ready` | Truthful `ready` | SCN-003 | Supported Normal Scenario | Task; 516 REQ-012 | REQ-001; AC-001…AC-003 |
| SCN-002 | User | Person dictating | Dictate | Voice Input | Worker ready | Request → reply | First reply fast (MLX) / no first-time cost | — | Supported Normal Scenario | 516 probes | REQ-002, REQ-004; AC-002, AC-003, AC-005 |
| SCN-003 | System | Caller | Learn why the worker cannot start | `serve` | Broken model, missing `ffmpeg` | Start → load or warm-up fails | No `ready`; stderr reason; non-zero exit | — | Supported Explicit Edge Scenario (broken installs happen; today's caller already handles worker exits) | Caller code | REQ-003; AC-004 |
| SCN-004 | Operational | Founder | Publish 0.3.1 | Tag `v0.3.1` | Fix merged on the 0.3.x line | Workflow builds, tests, publishes | Release artifacts | — | Supported Normal Scenario | Workflow | REQ-005; AC-006 |

## UI, Interaction, And Experience Requirements

- Applicable: `No`. N/A — not applicable for Product design fields.

## Quality And Non-Functional Requirements

| Quality ID | Related Requirement / AC IDs | Area | Measurable Requirement Or Constraint | Conditions / Scope | Verification Intent |
| --- | --- | --- | --- | --- | --- |
| QR-001 | REQ-002, AC-002 | Performance | First transcription after `ready` < 1,000 ms for a ~3 s clip | MLX on Apple Silicon, files warm or cold | Live |
| QR-002 | REQ-001 | Performance | The warm-up adds < 1 s before `ready` on MLX | Warm files | Live (RT-003: 435–621 ms) |

## Data Continuity And Acceptable Loss

- Persisted or external data affected: `No`.

## External Contracts And Dependencies

| Contract / Dependency | Required Behavior Or Constraint | Evidence / Authority | Uncertainty Or Risk |
| --- | --- | --- | --- |
| `mlx-whisper` 0.4.3 | `ModelHolder` reuse by path; ffmpeg for files | RT-003/004 | — |
| `faster-whisper` 1.2.1 | Model construction loads it | RT-005 | — |
| Desktop caller (`origin/personal`) | No `ready` timeout; stderr text on exit before `ready` | Source Log | — |

## Supplemental Artifacts

| Artifact Path | Purpose | Related Requirement / AC IDs | Status | Approval Applicability / State |
| --- | --- | --- | --- | --- |
| `probes/drive_worker.py` | Live timing of any worker build | AC-002, AC-003, AC-004 | Current | Evidence |

## Assumptions

| Assumption ID | Assumption | Why It Is Necessary | Validation Plan / Owner | Status |
| --- | --- | --- | --- | --- |
| ASM-001 | Callers wait for `ready` without a short timeout | Load moves before `ready` | True for the desktop (no timeout); the 516 extension is designed around it | Accepted |

## Decisions

| Decision ID | Question | Why It Matters | Options / Evidence | Reasoning And Recommendation | Decision Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
| DEC-001 | Load only, or load plus a warm-up transcription, before `ready`? | Truthfulness and first-dictation time | Load only: MLX first clip 564–598 ms; with warm-up: 302–337 ms, warm-up 435–621 ms (RT-003) | Warm-up: `ready` then means a transcription has really run, and the first dictation halves on MLX; the cost is under a second at start | Solution Designer | Decided |
| DEC-002 | Warm up on an in-memory signal or on a WAV file? | MLX decodes files with `ffmpeg` (RT-004) | Array skips decoding; a file goes through the request path | A short non-silent WAV file through the same transcription call: it proves decoding, so a missing `ffmpeg` fails at start with a clear reason instead of failing every dictation | Solution Designer | Decided |
| DEC-003 | The Task's outcome "well under a second" on faster-whisper? | Feasibility | faster-whisper on CPU: 3–5 s per clip, every time (RT-005) | The outcome is stated for Apple Silicon, which uses MLX; for faster-whisper the requirement is "no first-time cost" (REQ-002). Per-transcription CPU speed is out of scope | Solution Designer | Decided |
| DEC-004 | How does a start-up failure reach the caller? | No new message types (REQ-004) | A new error message; stderr + exit | Exit non-zero with a one-line stderr reason: today's caller already turns that into an error with the text, and no message type is added | Solution Designer | Decided |
| DEC-005 | Where does the fix live, and how is 0.3.1 cut? | `main` holds unreleased v1.0.0 work | Tag a commit off a ticket branch; a maintenance branch | A maintenance branch `release/0.3` from `v0.3.0`: the fix merges there and `v0.3.1` is tagged on it, so the 0.3.x line has a home for later fixes; created at delivery | Solution Designer | Decided |
| DEC-006 | How are faster-whisper bundles for Linux, Windows and Intel Mac proven? | No such machines here | Same Python code and pinned library on macOS arm64 CPU (live) plus the workflow's unit tests on ubuntu | Accept: the change is pure Python with the same library calls on every platform; risk low | Solution Designer | Decided |
| DEC-007 | Tag and publish 0.3.1 | A release is hard to undo | — | Ask the founder after validation, before tagging | Founder | Needs user (at release time) |
| DEC-008 | What does a missing model folder report? | REQ-003's reason must be clear | MLX turns a missing path into a Hugging Face repo id and reports `HFValidationError: Repo id must be…` (RT-007), and online it could try a download | The worker checks that the model folder exists before loading and reports "model folder not found: <path>": an explicit rule, not the library's guess | Solution Designer | Decided |
| DEC-009 | Library warnings in a start-up failure's stderr | Today's caller shows all of stderr as the error | MLX's import prints a 2-line `urllib3` `NotOpenSSLWarning` on the system Python (RT-007; also in 0.3.0) | The worker silences exactly that warning class, so a failure's stderr is the reason line; other warnings stay | Solution Designer | Decided |

## Traceability

| Requirement ID | Use-Case IDs | Behavior IDs | Acceptance-Criteria IDs | Scenario IDs | Supplemental / Product Design Evidence |
| --- | --- | --- | --- | --- | --- |
| REQ-001 | UC-001 | BEH-001 | AC-001…AC-003 | SCN-001 | RT-003, RT-005 |
| REQ-002 | UC-002 | BEH-001 | AC-002, AC-003 | SCN-002 | RT-003, RT-005 |
| REQ-003 | UC-003 | BEH-003 | AC-004 | SCN-003 | — |
| REQ-004 | UC-002 | BEH-002 | AC-005 | SCN-002 | — |
| REQ-005 | UC-004 | BEH-004 | AC-006 | SCN-004 | — |

## Architecture Phase Input

- Scenario IDs SCN-001…SCN-004.
- Constraints: message shapes unchanged; one worker file; tests runnable without the speech libraries.
- Deferred to design: where the load and warm-up live; the warm-up clip; the failure line's wording.
- Technical facts to verify: `ModelHolder` reuse (done, RT-003); faster-whisper generator must be consumed for the warm-up to run.
- Risks: RSK-001, RSK-002.

## Readiness Check

### Content Ready For Approval

- Relevant current behavior is evidence-backed: `Yes`
- Desired and preserved behavior are explicit: `Yes`
- Scope and non-goals are clear: `Yes`
- Requirements and acceptance criteria are testable and traceable: `Yes`
- Applicable scenarios are covered with validity and evidence: `Yes`
- Product design and supplemental evidence is integrated consistently: `N/A`
- Applicable UI/UX approval and final visual-reference basis are recorded: `N/A`
- Material assumptions and decisions are visible, each decision with reasoning and recommendation: `Yes`
- Content ready for approval: `Yes`
- Remaining content blocker: None

### Approved Basis Ready For Design

- Approval recorded: `Yes`
- Exact requirements and supplement approval basis recorded: `Yes`
- Approved requirements package ready for architecture design: `Yes`
- Remaining blocker: None
