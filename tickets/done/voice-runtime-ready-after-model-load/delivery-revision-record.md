# Delivery Revision Record

## Revision Index

| Revision ID | Entry Point / Trigger | Prior Result | Current Result | Affected Canonical Artifacts |
| --- | --- | --- | --- | --- |
| DR-001 | API/E2E handoff after API-REV-002 (direct route) | N/A | Delivery Completed (finalized into `release/0.3`; not tagged) | `docs-sync-report.md`, `handoff-summary.md`, `release-deployment-report.md`, `RELEASE.md` (created) |
| DR-002 | Release Requested: `v0.3.1` (founder's word) | Delivery Completed (not tagged) | Blocked: darwin builds refused the retired `macos-14` runner; nothing published | `release-deployment-report.md` (Release Round DR-002) |
| DR-003 | API/E2E handoff after API-REV-003 (workflow fix, AC-008) | Blocked | Delivery Completed: `v0.3.2` released (5 assets); AC-002 Pass on the released bundle | `docs-sync-report.md`, `handoff-summary.md`, `release-deployment-report.md` (Round DR-003), `RELEASE.md` |

## Revision Entries

### DR-001 — Verified from the evidence; finalized into the new `release/0.3`; `v0.3.1` awaits the founder

- Delivery round and trigger: round 1, the API/E2E handoff (API-REV-002 Pass, 95.5%; direct route).
- Triggering upstream report, verification, or evidence: `api-e2e-execution-coverage-report.md` (API-REV-002)
- Prior authoritative result: N/A
- Current authoritative result: `Delivery Completed` (no release)
- Docs sync report: `docs-sync-report.md` (Updated: `RELEASE.md` created)
- Handoff summary: `handoff-summary.md`
- Release/publication/deployment report: `release-deployment-report.md`
- Integration and post-integration verification: base `v0.3.0` (a tag), already current; no rerun.
- Verification and finalization state: every critical AC proven except AC-006 (the release, the founder's decision). Accepted risk DEC-006. Merged into `release/0.3` (the report's Finalization Record).
- Terminal return to the Solution Designer: `Sent` after the delivery record is pushed.
- Why this baseline was recorded: first delivery round.
- Next recipient/action: Solution Designer (terminal receipt). On the founder's word, a release round: tag `v0.3.1` on `release/0.3`, watch the workflow, and repeat AC-002 on the released bundle.
- Remaining blockers, rollback concerns, or untested scope: AC-006 pending the founder; DEC-006; FU-001 open.

### DR-002 — Release `v0.3.1`: tag pushed, darwin builds refused (`macos-14` retired), nothing published

- Delivery round and trigger: release request (founder's word, 2026-11-26, via the Solution Designer).
- Prior authoritative result: `Delivery Completed` (DR-001, not tagged)
- Current authoritative result: `Blocked`
- What was done: tag `v0.3.1` → `b1e14ab` pushed; run 45823708736. Linux, Windows and verify succeeded. Both darwin builds were cancelled (`The configuration 'macos-14-arm64-us-default' is not supported`), so publish was skipped: no release, no assets.
- Classification: ours (workflow pins a retired runner image). For a release request, a new change for the Solution Designer.
- Decision needed: `v0.3.2` after the fix, or a `workflow_dispatch` of 0.3.1 from the fixed `release/0.3`. The autobyteus-516 extension pins 0.3.1.
- Release/publication/deployment report: `release-deployment-report.md`, "Release Round DR-002"
- Terminal return to the Solution Designer: `Blocked` (sent)
- Next recipient/action: Solution Designer (new change: the workflow's macOS runner; build-only option proposed)

### DR-003 — Workflow fix merged; `v0.3.2` released; AC-002 on the released bundle

- Delivery round and trigger: API/E2E handoff after API-REV-003 (AC-008 Pass, 95.5%; direct route). Release on the founder's word (DEC-007), cut as `v0.3.2` (DEC-011).
- Prior authoritative result: `Blocked` (DR-002)
- Current authoritative result: `Delivery Completed` (stable release `v0.3.2`)
- Docs sync report: `docs-sync-report.md`, Round 3 (`RELEASE.md` rewritten as standing rules)
- Handoff summary: `handoff-summary.md` (Round 3 and Release)
- Release/publication/deployment report: `release-deployment-report.md`, "Round DR-003" and "Release Record DR-003"
- Integration: already current with `origin/release/0.3` `8d154d9`.
- Verification: AC-008 (dispatch run 45825122803, merge-push run 45826109140), AC-006 (release run 45826223605; 5 assets; manifest 0.3.2; sha256 match), AC-002 on the released bundle (first dictation 191–205 ms). Accepted risk DEC-006.
- Finalization: `release/0.3` `6ceebcd` (merge), tag `v0.3.2` → `6ceebcd`; this record follows on `release/0.3`. `v0.3.1` is unmoved, with no release.
- Terminal return to the Solution Designer: `Sent` after this record is pushed and cleanup is done.
- Remaining: DEC-006; FU-001 open. 0.3.2 reaches users when a caller pins it (the autobyteus-516 pin moves to 0.3.2).
