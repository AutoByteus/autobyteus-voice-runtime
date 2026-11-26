# API/E2E Revision Record

The latest coverage investigation and execution coverage report remain authoritative.

## Revision Index

| Revision ID | Triggering Role / Report / Round | Related Upstream Revision IDs | Prior Result / Confidence | Current Result / Confidence |
| --- | --- | --- | --- | --- |
| API-REV-001 | Implementation engineer, `implementation-handoff.md` IR-001 (direct route, round 1) | SR-001, IR-001 | N/A | Fail / 84% |
| API-REV-002 | Implementation engineer, `implementation-handoff.md` IR-002 (round 2) | SR-002, IR-002, CRR-001 | Fail / 84% | Pass / 95.5% |
| API-REV-003 | Implementation engineer, `implementation-handoff.md` IR-003 (round 3, after delivery DR-002) | SR-003, IR-003, DR-002 | Pass / 95.5% | Pass / 95.5% |

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

### API-REV-002 — `audioop` removed: one stderr line on every Python the launcher can pick

- Triggering role, report path, and round: implementation engineer, `implementation-handoff.md` (IR-002), round 2.
- Triggering finding or case IDs: AC-004 (API-05, API-05b) from API-REV-001; CRR-001.
- Related revision IDs: SR-002 (DEC-009 revised, DEC-010, AC-007), IR-002, CRR-001.
- Why recorded: the rework's result.
- Coverage decisions or durable test paths changed: none by API/E2E; `TESTING.md` updated (no `audioop`; three Pythons).
- Cases rechecked: API-05, API-05b first (the prior failure), then API-01, API-02, API-03 and API-04 normal starts, API-06.
  Still valid: API-03/04 run A (first install), API-03b, API-04b (plan in the coverage investigation).
- Commands, environment, fixture, or broader-validation delta: bundles rebuilt from `18f9e12`, extracted over the
  round-1 roots keeping their bootstrapped `.venv`; a quiet-noise clip added; Python 3.14 added to API-01/02/05b.

#### Prior Failure Resolution

| Prior Case / Failure Reference | Previous Classification | Current Resolution | Case IDs Now Proving It |
| --- | --- | --- | --- |
| AC-004 on the launcher's Python 3.11 (three stderr lines) | My preliminary `Local Fix`; CRR-001 classified it `Design Impact` (DEC-009, premise checked on Python 3.9 only), resolved by SR-002 | `audioop` no longer imported; one line on 3.9, 3.11 and 3.14, through the launcher and through the caller | API-05, API-05b, API-01 (AC-007 test) |

- Canonical artifacts updated: coverage investigation (round 2 plan), execution report, this record, progress log, `TESTING.md`.
- Prior result and confidence: Fail, 84%
- Current result and confidence: Pass, 95.5%
- New or remaining failure IDs: none.
- Recommended owner: delivery engineer.
- Remaining risks: RSK-001 (faster-whisper on other platforms); FU-001 open; the VAD first-request load (~30 ms, observation); AC-006 for delivery.

### API-REV-003 — The release workflow proven on GitHub before a tag (AC-008)

- Triggering role, report path, and round: implementation engineer, `implementation-handoff.md` (IR-003), round 3, after delivery DR-002 (the v0.3.1 tag run cancelled both darwin builds: `macos-14` retired).
- Triggering finding or case IDs: AC-008 (new in SR-003).
- Related revision IDs: SR-003 (DEC-011…DEC-013, REQ-006, AC-008), IR-003, DR-002.
- Why recorded: the new criterion's result.
- Coverage decisions or durable test paths changed: none in the tests; `TESTING.md` gains the build-only release run as a layer and the rule that a workflow change needs it before merge.
- Cases: API-07 reused (IMP-12); API-08 (build-only dispatch from the pushed ticket branch, run 45825122803); API-09 (its artifacts vs the v0.3.0 bundles). API-01…API-06 still valid: `runtime/` and `tests/` unchanged since `18f9e12`.
- Commands, environment, fixture, or broader-validation delta: GitHub Actions; the ticket branch pushed (no tag, no release, nothing on `release/0.3`).

#### Prior Failure Resolution

None in this round (DR-002's blocked release is delivery's; the fix it needed is proven by API-08/API-09).

- Canonical artifacts updated: coverage investigation (round 3 plan), execution report, this record, progress log, `TESTING.md`.
- Prior result and confidence: Pass, 95.5%
- Current result and confidence: Pass, 95.5%
- New or remaining failure IDs: none.
- Recommended owner: delivery engineer.
- Remaining risks: RSK-003 (`-latest` images change; the push to `release/**` now runs the workflow on every merge); the resolve step still interpolates `${{ inputs.runtime_version }}` into bash (pre-existing, outside SR-003; only repository writers can dispatch); RSK-001; FU-001.
