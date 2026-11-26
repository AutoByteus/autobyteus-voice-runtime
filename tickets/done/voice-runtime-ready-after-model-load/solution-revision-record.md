# Solution Revision Record

## Revision Index

| Revision ID | Phase | Trigger / Report / Round | Finding IDs | Prior Status | Current Status | Affected Behavior / Requirement IDs | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SR-001 | Mixed (Requirements + Design) | Project Task autobyteus-655 (PRE-001 of autobyteus-516) | N/A | N/A | Approved / Ready | BEH-001…BEH-004, REQ-001…REQ-005 | Requirements approved within the direction; contract validated with the real libraries; design Small / Low; direct implementation route |
| SR-002 | Design | Code review CRR-001 (AC-004 failed on Python 3.11) | CRR-001 | Ready (SR-001) | Ready | REQ-003, REQ-004, AC-004, AC-007, DEC-009, DEC-010 | `audioop` removed (identical loudness values); subprocess start-failure test; DESIGN.md DC-001; FU-002 resolved here |
| SR-003 | Mixed (Requirements + Design) | Delivery DR-002: `v0.3.1` run published nothing (retired `macos-14` image) | DR-002 | Approved / Ready (SR-002) | Approved / Ready | REQ-005, REQ-006, AC-006, AC-008, DEC-007, DEC-011…DEC-013, BEH-004 | Release as `v0.3.2`; workflow on `-latest` runners, darwin built without a Mac; build-only runs before a tag; DESIGN.md DC-002 |

## Revision Entries

### SR-001 — Truthful readiness for the 0.3.x worker

- Phase and classification: `Initial Baseline`
- Trigger: Task autobyteus-655; the founder's direction relayed in it ("whatever is more reasonable architecture-wise … you will decide").
- Triggering finding IDs: N/A (PRE-001 of autobyteus-516).
- Prior status: N/A.
- Current status: requirements `Approved`; design `Ready`.
- IDs affected: BEH-001…BEH-004, REQ-001…REQ-005, AC-001…AC-006, SCN-001…SCN-004, DEC-001…DEC-009.
- Scenario-basis changes: N/A.
- Why recorded: first baseline.
- Canonical sections: all (new); `DESIGN.md` created at the repository root on the ticket branch.
- Supplemental artifacts: `probes/`, `evidence/`, `follow-ups.md` (FU-001).
- Product design: None.
- Intended behavior changed: `No` (first baseline). The Task's outcome "well under a second" is kept for MLX on Apple Silicon; for faster-whisper the measurable promise is "no first-time cost" (DEC-003, RT-005).
- Approval impact: approved by the Solution Designer within the direction, founder informed. DEC-007 (tag and publish 0.3.1) needs the founder's word at release time.
- Behavior-defining supplements: None.
- Affected design/review basis: N/A.
- Post-design classification: `Small` / `Low` (design spec).
- Applied handoff-rule outcome: `handoff-architecture-design-complete.md`; route `/implementation_engineer` (Small/Medium and Low).
- Downstream impact: direct implementation; API/E2E with the real runtime; delivery asks the founder before tagging.
- Remaining gaps: RSK-001 (Linux/Windows live), RSK-002 (memory from start).
- Next action: implementation.

### SR-002 — Remove `audioop` instead of filtering its warning (code review CRR-001)

- Phase and classification: `Design Impact`
- Triggering report: code review CRR-001 (failure origin of API/E2E API-REV-001: AC-004 failed); API/E2E evidence `evidence/api-e2e/API-05-start-failures-caller.jsonl`, `API-05b-launcher-stderr-lines.log`; FU-002 (API/E2E).
- Triggering finding IDs: CRR-001.
- Prior status: requirements Approved (SR-001); design Ready (SR-001), failed AC-004 on Python 3.11.
- Current status: requirements Approved (intent unchanged); design `Ready`.
- IDs affected: REQ-003, REQ-004; AC-004; AC-007 (new); DEC-009 (revised), DEC-010 (new); BEH-002 (silence answers preserved), BEH-003.
- Scenario-basis changes: None.
- Why: DEC-009's premise was checked on Python 3.9 only (RT-007); on the launcher's Python 3.11 the worker's own `import audioop` warns (RT-011). The reviewer's option 2, removing `audioop`, fixes the cause and FU-002 together; the founder asked for the clean design ("do the design which makes it architecturally easy, you know, clean", 2026-11-26).
- Canonical sections changed: requirements Decisions (DEC-009 revised, DEC-010), Acceptance Criteria (AC-007), status line; investigation notes RT-010, RT-011; design spec Current-State Read, Change Scope, Removal Plan, Concrete Examples, Change Sequence step 4a; `DESIGN.md` design case DC-001; `follow-ups.md` FU-002 marked resolved here.
- Supplemental artifacts: `probes/rms_equivalence.py`, `evidence/P5-rms-equivalence.txt` (0 of 17 differ).
- Intended behavior changed: `No` (REQ-003 already required one line; silence answers identical, RT-010).
- Approval impact: none; within the direction, founder informed.
- Affected design/review basis: SR-001 design superseded; CRR-001 and API-REV-001 apply to code `050cca1`.
- Post-design classification: unchanged, `Small` / `Low`.
- Applied handoff-rule outcome: `handoff-architecture-design-complete.md` (SR-002 section); route `/implementation_engineer`.
- Downstream impact: implementation applies 4a; API/E2E reruns API-05/05b on Python 3.11 and 3.9 and the silence checks; the subprocess test (AC-007) is the local check, and API/E2E records its rule in `TESTING.md` (its document).
- Remaining gaps: RSK-001, RSK-002.
- Next action: implementation.

### SR-003 — Release the fix as `v0.3.2` through a workflow that cannot fail first at the tag (delivery DR-002)

- Phase and classification: `Requirement Gap` within the direction (the release target and a new release-workflow requirement) and `Design Impact` (the workflow).
- Triggering report: delivery engineer `Blocked` DR-002 (2026-11-26): tag `v0.3.1` (`0699d62` → `b1e14ab`) pushed on the founder's word; run 45823708736 cancelled both darwin builds (`macos-14` retired); publish skipped; no release.
- Triggering finding IDs: DR-002.
- Prior status: requirements Approved, design Ready (SR-002); delivered DR-001 (`release/0.3` at `b1e14ab`).
- Current status: requirements Approved (SR-003, Solution Designer within the direction; founder informed); design `Ready`.
- IDs affected: BEH-004, UC-004, SCN-004; REQ-005 (revised), REQ-006 (new); AC-006 (revised), AC-008 (new); DEC-007 (decided by the founder), DEC-011…DEC-013 (new).
- Scenario-basis changes: SCN-004: a push to the release line builds and tests first; the tag is `v0.3.2`.
- Why: a pushed tag is never moved and a release is built from the commit its tag names, so the fix is cut as `v0.3.2` (DEC-011). The darwin bundles need no Mac (RT-013), so the workflow stops depending on a pinned macOS image (DEC-012), and build-only runs prove the same jobs before any tag (DEC-013). The founder's direction: "whatever is more reasonable architecture-wise … you will decide", "do the design which makes it architecturally easy, you know, clean", and his release word "Of course publish without any doubts".
- Canonical sections changed: requirements Document Status, BEH-004, UC-004, Out Of Scope, REQ-005/006, AC-006/008, SCN-004, DEC-007, DEC-011…013, Traceability; investigation notes RT-012, RT-013; design spec basis, size/risk note, Change Scope, file mapping, "Release workflow (SR-003)" examples, Change Sequence step 6, RSK-003; `DESIGN.md` Release section and DC-002. The ticket folder returns from `tickets/done/` to `tickets/in-progress/` on the new ticket branch.
- Supplemental artifacts: none new (RT-013 used the published `v0.3.0` assets).
- Intended behavior changed: `Yes`, operational only (release version and workflow behavior); the worker is unchanged.
- Approval impact: approved by the Solution Designer within the direction; the founder is informed in the Solution Designer conversation, 2026-11-26.
- Affected design/review basis: worker code unchanged and its validation (API-REV-002, DR-001) still applies; the workflow change is new.
- Post-design classification: `Small` / `Low`.
- Applied handoff-rule outcome: `handoff-architecture-design-complete.md` (SR-003 section); route `/implementation_engineer`.
- Downstream impact: implementation step 6; API/E2E proves AC-008 by a build-only dispatch from the ticket branch; delivery merges to `release/0.3`, waits for its green push run, tags `v0.3.2`, records the RELEASE.md pre-tag step, and runs AC-006. The PM learns that 516 pins 0.3.2.
- Remaining gaps: RSK-001, RSK-002, RSK-003.
- Next action: implementation.
