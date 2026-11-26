# API/E2E Revision Record

The latest coverage investigation and execution coverage report remain authoritative.

## Revision Index

| Revision ID | Triggering Role / Report / Round | Related Upstream Revision IDs | Prior Result / Confidence | Current Result / Confidence |
| --- | --- | --- | --- | --- |
| API-REV-001 | Implementation engineer, `implementation-handoff.md` IR-001 (direct route, round 1) | SR-001, IR-001 | N/A | Fail / 84% |

## Revision Entries

### API-REV-001 — Real bundles through the desktop caller: ready and dictation pass; the start-failure text is not one line on the launcher's Python

- Triggering role, report path, and round: implementation engineer, `implementation-handoff.md` (IR-001), round 1.
- Triggering finding or case IDs: N/A (baseline).
- Related revision IDs: SR-001, IR-001.
- Why recorded: first completed result.
- Coverage decisions or durable test paths changed: none; `TESTING.md` created; caller probe kept in `probes/`.
- Cases: API-01…API-06 (+ API-03b, API-04b, API-05b).
- Commands, environment, fixture, or broader-validation delta: real bundles from a clean clone, launcher bootstrap on
  Python 3.11, the desktop's `VoiceInputRuntimeService` bundled with a login-PATH stub.

#### Prior Failure Resolution

None.

- Canonical artifacts updated: coverage investigation, execution report, this record, progress log, `follow-ups.md` (FU-002), `TESTING.md`.
- Prior result and confidence: N/A
- Current result and confidence: Fail, 84%
- New or remaining failure IDs: AC-004 (API-05, API-05b).
- Recommended owner: implementation engineer (`Local Fix`, preliminary), through the code reviewer's failure-origin review.
- Remaining risks: RSK-001 (faster-whisper on other platforms); FU-002; the VAD first-request load (~30 ms, observation).
