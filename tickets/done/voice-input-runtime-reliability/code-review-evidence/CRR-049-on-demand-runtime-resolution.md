# CRR-049 On-Demand Runtime Resolution Evidence

## Reviewed State

- Worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery`
- Branch: `codex/voice-runtime-qualified-recovery`
- Approved solution/design authority: `SR-021` / `ARCH-REV-021 Pass`
- Implementation revision: `IR-032`
- Prior source: `6dc1aac500a84f50a8808ba9eca2bb15d808779d`
- Reviewed source commit: `ad7c402d224690584e2da98ec71a73e8b6d4ca36`
- Reviewed artifact commit: `93c9a6e579d253cfc1e9b5b8f69f22e4f688df9c`
- Source-to-artifact delta: implementation handoff and revision-record updates only
- IR-032 source diff: `30 files changed, 2,314 insertions, 669 deletions`

## Reviewer-Executed Checks

The reviewer used the implementation's verified pinned Go executable at `/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go` and ran:

```text
go test -race ./modelmanager/... ./modelstore/... ./launcher/...
go test -race -count=10 ./modelmanager/internal ./modelstore
go vet ./...
VOICE_GO=/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go npm run check
npm run check:release-pipeline
git diff --check 6dc1aac500a84f50a8808ba9eca2bb15d808779d..ad7c402d224690584e2da98ec71a73e8b6d4ca36
```

Results:

- Focused race coverage: Pass.
- Ten repeated race-enabled manager/store runs: Pass.
- Go vet: Pass.
- Full gate: `7/7` Python plus compileall, all Go/source/evidence checks, and `91/91` Node TAP tests Pass.
- Release pipeline: `9/9` Pass.
- Diff whitespace: Pass.
- Worktree contains only the preserved reviewer-owned CRR-048/049 report, revision, and evidence artifacts outside committed implementation state.

## Prior Finding Resolution

### `CR-F-039` — Resolved

`modelmanager/internal/install.go` still verifies the extracted host before accepting caller Catalog bytes. `ResolveProfile` now calls the singular `validateCurrentCatalog` owner before sibling manifest/notice access and before `modelstore.Open` or network creation. The owner requires release `1.0.0`, exact two-entry `english -> chinese` order, current matrix/admission/model/compatibility/locator/support identities for both rows, one asset base, exact pair digests, and complete selected-row equality to the verified host authority. The selected host-contained admission remains the install authorization; embedded current rows are comparison authority and cannot authorize a different profile.

`TestCurrentCatalogValidatesCompleteOrderedSubject` passes exact English and Chinese subjects and rejects order, non-selected provider, selected language/target/model/capability/support/host locator/model locator/release, and selected host-authority drift.

### `CR-F-040` — Resolved

`modelstore.Open`/`OpenReadOnly` retain an `os.Root`. `openOwnedDirectory` walks each component descriptor-relatively, rejects unsafe mode/type/symlink state, opens the next directory, and checks `os.SameFile` before proceeding. `openOwnedRegular` uses no-follow file opens and rejects hard-link aliases. Rooted read/write/rename/remove/tree-sync/tree-remove/model-verification operations are reused for models, activations, profiles, partials, locks, and leases. Pointer preparation holds the authenticated parent descriptor through commit/abort.

Focused tests reject symlink, non-directory, special-entry, hard-link, nested-prune escape, and pointer-lineage drift cases without external mutation. The prior path-based descendant mutation route is absent.

### `CR-F-041` — Resolved

`OperationLifecycle` now packs state in the low 32 bits and the accepted signal in the high 32 bits of one `atomic.Uint64`. `AcceptSignal` publishes the complete cancelled subject with one compare-and-swap; `Cancelled` observes it with one load. Only signals 2 and 15 are accepted. Race and terminal regressions repeatedly preserve exact exits 130 and 143.

### `CR-F-042` — Resolved

Install and remove invoke bounded `PruneOrphans` while holding the singular writer lease; a successful pointer replacement also performs best-effort pruning. The owner snapshots both active profiles, retains current installation IDs, requires an exclusive installation lease before deleting an orphan activation, retains busy provider subjects for a later writer, recomputes model references from all retained activation records, and removes only unreferenced model/staging subjects up to the bound. Explicit removal retains its exclusive selected-installation lease through pointer unlink and cleanup.

Focused coverage proves crash/precommit reclamation, pointer replacement cleanup, current subject retention, busy provider retention followed by later cleanup, and hostile-ancestor fail-closed behavior.

### `CR-F-043` — Resolved

Install now creates and authenticates each exact partial before the free-space decision. `ResumableBytes` accepts a complete file only after exact size/hash, or a prefix only after record authority, path/size/hash/URL/validator/bytes identity. Invalid partial state is deleted/restarted fail closed. The service subtracts authenticated retained bytes from the exact manifest total and admits only `remaining + bounded metadata + 64 MiB reserve`.

Focused coverage distinguishes remaining-byte from full-size admission, retains an exact completed file plus exact prefix, and proves invalid retained state returns the capacity calculation to the full download.

## Changed Implementation-Source Size Audit

No IR-032 implementation source exceeds 500 effective non-empty lines. The only current files requiring the >220 audit are:

| File                                  | Effective Non-Empty Lines | Review Result                                                  |
| ------------------------------------- | ------------------------: | -------------------------------------------------------------- |
| `modelmanager/internal/downloader.go` |                       358 | Coherent DownloadSession transfer/resume owner.                |
| `modelstore/activation.go`            |                       255 | Coherent activation record/pointer/snapshot owner.             |
| `modelstore/safefs.go`                |   215 (`228` added lines) | Coherent descriptor-relative Store filesystem primitive owner. |

## Review Conclusion

IR-032 resolves all five CRR-048 source findings within the existing SR-021 owners, preserves the clean-cut architecture and public commands, and introduces no fallback or parallel authority. Full, release, vet, race, repeated-race, and diff checks pass. Source review is `Pass`; realistic host construction, production model acquisition, macOS interleavings, relocated offline inference, focused authority derivation, and release equality now belong to API/E2E.
