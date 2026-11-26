# Code Review Report

## Review Round Meta

- Review Entry Point: `API/E2E Failure-Origin Review`
- Requirements Doc Reviewed As Context: `requirements-doc.md` (REQ-003, AC-004, SCN-003, DEC-008, DEC-009, Scope Guardrail)
- Investigation Notes Reviewed As Context: `investigation-notes.md` (RT-007)
- Solution Revision Record Reviewed As Context: not needed for this bounded review
- Design Spec Reviewed As Context: `design-spec.md` (start sequence, check list)
- Supplemental Task Artifacts Reviewed As Context: `follow-ups.md` (FU-001, FU-002)
- Relevant Solution Revision IDs: as recorded in the design spec
- Design Review Report / Architecture Review Revision Record: `N/A — not applicable` (direct route, Small / Low)
- Implementation Handoff Reviewed As Context: `implementation-handoff.md` (IR-001; IMP-04 live runs on system Python 3.9)
- Implementation Revision Record Reviewed As Context: `implementation-revision-record.md`
- Relevant Implementation Revision IDs: IR-001
- Code Review Revision Record: `code-review-revision-record.md`
- Current Code Review Revision ID: `CRR-001`
- Current Review Round: 1
- Review Scope: `N/A` (failure-origin round)
- Trigger: API-REV-001, Fail on AC-004
- Prior Review Round Reviewed: N/A (no source review on this route)
- Latest Authoritative Round: 1
- Coverage Investigation Reviewed: `api-e2e-coverage-investigation.md`
- Execution Coverage Report Reviewed: `api-e2e-execution-coverage-report.md`
- API/E2E Revision Record Reviewed: `api-e2e-revision-record.md` (API-REV-001)
- Testing guideline applied: `TESTING.md` (new in `1ce4ab6`)
- Failing Scenario IDs: AC-004 / REQ-003 / SCN-003; cases API-05, API-05b
- Exact Failing Commands / Execution Mode: `env -i HOME=… PATH=/usr/bin:/bin <ext>/runtime/bin/voice-input-worker serve --backend mlx --model-path <missing>` (the bundle's launcher; venv on Python 3.11.15); `node probes/drive.mjs <extension root> <label> en.wav` through the desktop's real `VoiceInputRuntimeService`
- Failure Evidence Paths: `evidence/api-e2e/API-05b-launcher-stderr-lines.log`, `evidence/api-e2e/API-05-start-failures-caller.jsonl`

Code under test: repository `autobyteus-voice-runtime`, worktree `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-ready-after-model-load`, branch `codex/voice-runtime-ready-after-model-load`, commit `050cca1` (base v0.3.0 `251eab8`).

## Routing Classification Review

- Task size: `Small`
- Architectural risk: `Low`
- Selected route: `API/E2E Failure-Origin Review`
- Independent source review required by the classification: `Failure-origin exception`
- Classification evidence or correction required: None. The finding stays within the worker's start path.

## Upstream Behavior And Production-Path Basis Confirmation

- Approved requirements basis understood: REQ-003 and AC-004 require that a failed start writes no `ready`, writes **one** stderr line naming the backend and the cause, and exits non-zero. "Today's caller would show that text": the desktop shows all of stderr as the error.
- Behavior-basis status: `Confirmed`. The failing scenario still represents approved behavior, and the requirement is unambiguous.
- Supported scenario: SCN-003, Supported Explicit Edge Scenario. The trigger is independent: a broken or missing model, or MLX without `ffmpeg`, reached through the real `serve` start by the real desktop caller.

| Behavior ID | Current Status | Current Implementation Path And Lifecycle Evidence | Contradicting Evidence |
| --- | --- | --- | --- |
| BEH-003 | Contradicted on the launcher's preferred Python | `main()` → `start_backend` fails → one `start_failure_line` to stderr → exit 1 (`runtime/voice_input_worker.py`). The reason line is correct. But module import (`import audioop`, line 3) has already written a 2-line `DeprecationWarning` to stderr on Python 3.11/3.12. | API-05b: launcher venv on 3.11.15 gives 3 stderr lines; the same file on system 3.9.6 gives 1. API-05: in all three real start-failure cases, the desktop caller's error text holds all 3 lines. |

## Supported Product Scenario And Reachability Gate

| Scenario ID | Related IDs | Kind | Initiator | Goal / Event | Entry | Shape | Forward Path | Expected Outcome | Evidence | Validity | Use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCN-003 | REQ-003, AC-004 | System | Desktop caller | Learn why the worker cannot start | Launcher `serve` | Explicit Edge | The launcher picks Python by `find_python` (`AUTOBYTEUS_VOICE_INPUT_PYTHON`, then `python3.11`, `python3.10`, `python3.9`, `python3`, `python`; `runtime/voice-input-worker.sh:9-21`) → venv → `voice_input_worker.py` run as `__main__` → import → `main()` → start fails → stderr → exit 1 → the caller shows stderr | One stderr line | API-05, API-05b; launcher source | Supported Explicit Edge Scenario | Use |

Reachability of Python 3.11: `installRuntime` reinstalls the extension, so every 0.3.1 install bootstraps a new venv with the first Python `find_python` finds. Python 3.11 is the launcher's own first choice, so any machine with 3.11 (Homebrew, uv) runs the worker on it. This is the normal production path, not a contrived one.

### Candidate Finding And Mechanism Gate

| Candidate ID | Observation | Scenario / Contract | Independent Trigger | Forward Path / Consequence | Evidence | Disposition | Scope | Reason / Response |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-01 | `import audioop` at module level emits `DeprecationWarning` (Python 3.11 and 3.12) to stderr before `main()`. It is shown because the worker runs as `__main__`, and the warning is attributed to `__main__` code. | SCN-003, REQ-003 | Broken model or no `ffmpeg`, through the launcher on Python 3.11 | The caller's error text is 3 lines, 2 of them a library warning; AC-004 fails | API-05b, API-05 | Promote | This ticket: REQ-003 is this ticket's behavior. The import predates it, but the one-line contract is new here. | Design Impact (below) |
| C-02 | `audioop` was removed in Python 3.13, so on 3.13+ the worker cannot import at all | — | The launcher falling back to `python3` ≥ 3.13 | Pre-existing since v0.3.0 | FU-002 | Reject as a finding here | Follow-up (FU-002, already recorded) | Every Python the launcher names first (3.9–3.11) imports it. AC-004 fails because of the 3.11 warning, not because of 3.13 |
| C-03 | The unit tests run `main()` in-process, so import-time warnings never reach the captured stderr | AC-004 verification intent ("Unit + live") | — | The check that should have caught this cannot see it | `tests/test_voice_input_worker.py` `run_serve` | Promote, as a check to add | This ticket (the local check for a problem a later stage caught) | Add a subprocess-level check (below) |

## Failure Classification And Origin

- **Not an implementation defect against its design.** The implementation does what DEC-009 decides: it silences exactly the urllib3 `NotOpenSSLWarning` class ("other warnings stay"). It writes one correct reason line and exits 1.
- **Origin: a design decision with an incomplete premise.** DEC-009 and RT-007 were established only on system Python 3.9.6. On 3.9, `audioop` is not deprecated, so the only intruding warning was urllib3's. The shipped launcher prefers 3.11, where `audioop` warns on import. DEC-009's stated reason ("so a failure's stderr is the reason line") covers this warning. Its literal rule ("silences exactly that warning class … other warnings stay") forbids the fix. So the implementation cannot fix this without changing a recorded Solution Designer decision.
- **Detectability:** this would have been caught by running the start failure through the launcher on its first-choice Python. Investigation (RT-007) and implementation (IMP-04) both ran on 3.9 only. No source review was selected on this direct route, so there is no earlier code-review finding to correct. The unit tests could not see it (C-03).
- Classification: **`Design Impact`**, owned by the Solution Designer. It is not a `Requirement Gap`: REQ-003 is clear and the fix needs no new behavior. The decision on how to meet it must change.

## Proportionate Response (for the Solution Designer to decide)

1. **Widen DEC-009 (smallest; recommended for this ticket).** Silence the start-up library warnings known to precede the reason line on the launcher's Pythons: urllib3's `NotOpenSSLWarning` and `audioop`'s `DeprecationWarning`. For example, `warnings.filterwarnings("ignore", category=DeprecationWarning, message="'audioop' is deprecated")` placed before `import audioop`. It changes no behavior apart from stderr and leaves FU-002 as its own ticket.
2. **Stop importing `audioop`.** Compute the RMS for `is_probable_no_speech` without it. This also resolves FU-002 (Python 3.13+). It pulls a pre-existing follow-up into scope and touches the silence-detection path, so it is a scope decision.

Either way, add the local check that would have caught this (C-03). In the verify job's Python 3.11, run the worker as a subprocess (`python runtime/voice_input_worker.py serve --backend mlx --model-path <missing>`) and assert: no stdout, exactly one stderr line starting `Voice Input worker could not start the mlx backend:`, exit 1. The missing-folder case needs no model or library, so it runs on CI.

Retest: API-05 and API-05b through the launcher on its Python (3.11) and on 3.9, as API/E2E planned.

## Follow-ups

- Follow-ups this review added: None. FU-002 (audioop removed in 3.13; launcher fallback) stays a follow-up unless the Solution Designer takes option 2.

## Recommended Recipient

- Solution Designer (`Design Impact`), at the address `get_handoff_rules` returns.

## Residual Risks

- The other start-failure lines in API-05 already name the cause correctly; only the extra warning lines break AC-004.
- Other import-time warnings could appear on other Python or library versions. The subprocess check above guards the CI Python only.

## Latest Authoritative Result

- Review Decision: `Fail` (API/E2E failure confirmed)
- Review Entry Point: `API/E2E Failure-Origin Review`
- Supported Product Scenario Gate: `Pass`
- Material-Premise Gate: `Fail`. DEC-009's premise (only urllib3 warnings reach stderr) does not hold on the launcher's preferred Python 3.11.
- Score Summary: N/A (failure-origin round)
- Failure Origin: design decision DEC-009 (premise established on Python 3.9 only)
- Recommended Recipient: Solution Designer
- Notes: the implementation followed its design; a bounded fix is ready once DEC-009 is revised.
