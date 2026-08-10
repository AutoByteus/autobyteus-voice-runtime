# CRR-048 On-Demand Runtime Source Review Evidence

## Reviewed State

- Worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery`
- Branch: `codex/voice-runtime-qualified-recovery`
- Approved solution/design authority: `SR-021` / `ARCH-REV-021 Pass`
- Implementation revision: `IR-031`
- Reviewed source commit: `6dc1aac500a84f50a8808ba9eca2bb15d808779d`
- Reviewed artifact commit: `044b6a4efb023e92462e8ff586e5ee74baee03e5`
- Source parent used for the implementation diff: `a0866c00ab431ff2a176a68f9d0247e4df407f7e`
- Source diff: `236 files changed, 13,872 insertions, 21,248 deletions`

## Reviewer-Executed Checks

The reviewer used the implementation's verified pinned Go executable and ran:

```text
VOICE_GO=/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go npm run check:release-pipeline
VOICE_GO=/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go npm run check
git diff --check a0866c00ab431ff2a176a68f9d0247e4df407f7e..6dc1aac500a84f50a8808ba9eca2bb15d808779d
```

Results:

- Release-pipeline coverage: `9/9 Pass`.
- Full gate: `7/7` Python plus compileall, all Go/source/evidence checks, and `91/91` Node TAP tests Pass.
- Diff whitespace check: Pass.
- Final worktree state before review artifacts were written: clean.

The reviewer also searched the changed runtime/release source for removed Catalog 3, Config 1, bundled-model, managed-recovery, and qualified-candidate paths. Remaining occurrences are negative source guards, historical contract references, or generic local variable names rather than an active compatibility path.

## Production-Path Source Traces

### Catalog 4 validation divergence (`CR-F-039`)

`modelmanager/internal/catalog.go:33-84` strictly decodes unknown JSON fields but validates only:

- top-level schema version, catalog ID, and entry count;
- uniqueness of the requested profile;
- a subset of the selected row against embedded host/admission subjects;
- the selected sibling manifest/notice and compatibility-pair digest.

It does not validate exact entry order or the non-selected row, and it does not bind several selected-row contract fields such as language/target/model/capability/support and locator metadata. `modelmanager/internal/service.go:51-55` then copies `LanguageMode` and `CapabilityDigest` from that incompletely validated row into the activation record. `launcher/internal/session.go:30` requires the capability digest to equal the host admission authority, so an arbitrary syntactically valid catalog digest can be committed but cannot produce a valid provider session. A wrong language is rejected only during activation-record writing, after download/model commit, instead of before store/network access.

### Descendant symlink escape (`CR-F-040`)

`modelstore/paths.go:13-66` validates the caller's root lineage and the six top-level owned directories. Descendant operations later use ordinary pathname resolution:

- `modelstore/activation.go:56-64` creates/writes an activation beneath `activations/<id>`;
- `modelstore/activation.go:81-100` creates/writes a pointer beneath `profiles/<profile>/darwin-arm64`;
- `modelstore/store.go:62-116` stages/renames model content beneath `models/<asset>/<manifest>`.

`O_NOFOLLOW` is applied only to the final file descriptor, not its ancestor components.

A production-owner probe created a valid store, replaced `profiles/english` with a symlink to an external directory, and invoked `Store.PreparePointer` with a valid English pointer. The observed result was:

```text
prepareErr=<nil>
outsideEntry=active-v1.json.tmp-00000000-0000-4000-8000-000000000002
```

The temporary probe lived under `modelmanager/cmd` only long enough to satisfy Go's `internal` import rule, was removed immediately, and left the repository clean. The result confirms that a supported store operation can write beyond the caller-selected root when an owned descendant lineage contains a symlink.

### Cancellation signal-publication race (`CR-F-041`)

`modelmanager/internal/lifecycle.go:29-35` publishes `stateCancelled` before publishing the signal identity:

```go
if !l.state.CompareAndSwap(stateCancellable, stateCancelled) { ... }
l.signal.Store(int32(signal))
```

`Cancelled()` independently loads the state and then the signal. A production-owner concurrency probe racing `AcceptSignal(15)` with `Cancelled()` observed:

```text
observed cancelled with signal=0 at iteration=7527
```

`modelmanager/internal/events.go:168-174` maps signal `15` to exit `143` and any other cancelled signal value to `130`; the observed publication window can therefore misreport a supported SIGTERM cancellation as SIGINT-style exit `130`. The temporary probe was removed and the worktree was clean afterwards.

### Missing later-writer orphan pruning (`CR-F-042`)

`modelmanager/internal/install.go:85-125` commits a verified model and immutable activation before the cancellation/commit cutoff. A signal accepted or a pre-cutoff failure can therefore leave verified unactivated content, which the approved contract permits temporarily. The only production call to `modelstore.Store.CleanupSubject` is `modelmanager/internal/status_remove.go:88`, after successful explicit removal. No later install writer scans and proves reachability/lease status before pruning crash/precommit or replaced activation/content. Thus the temporary state has no bounded reclamation path.

### Resume capacity overstatement (`CR-F-043`)

`modelmanager/internal/install.go:48-51` requires free space for the complete manifest total plus metadata and the 64 MiB reserve before `PartialPaths` or `validPartial` can inspect identity-valid retained prefixes. `modelmanager/internal/downloader.go:60` performs partial validation only later. A supported interrupted transfer with a large valid prefix is rejected when capacity is enough for the remaining admitted bytes plus reserve but not enough for a second complete model, contradicting the explicit Store 1 resume-capacity contract.

## Changed Implementation-Source Size Audit

No changed implementation source file exceeds 500 effective non-empty lines. Files above the 220-line review threshold are:

| File                                          | Effective Non-Empty Lines | Review Result                                                                                                            |
| --------------------------------------------- | ------------------------: | ------------------------------------------------------------------------------------------------------------------------ |
| `benchmark/darwin-arm64-runner-preflight.mjs` |                       327 | Coherent preflight owner; no finding.                                                                                    |
| `build/host-package-assembler.mjs`            |                       227 | Coherent host-package owner; no finding.                                                                                 |
| `build/locked-inputs.mjs`                     |                       386 | Coherent locked-input owner; no finding.                                                                                 |
| `build/materialize-release-inputs.mjs`        |                       307 | Coherent materialization owner; no finding.                                                                              |
| `modelmanager/internal/downloader.go`         |                       342 | Coherent download-session owner; resume-capacity sequencing defect is in the service caller (`CR-F-043`).                |
| `modelstore/activation.go`                    |                       258 | Coherent activation owner; descendant-lineage safety and later-writer lifecycle are incomplete (`CR-F-040`, `CR-F-042`). |
| `modelstore/store.go`                         |                       266 | Coherent store owner; descendant-lineage safety and orphan cleanup are incomplete (`CR-F-040`, `CR-F-042`).              |
| `packaging/archive/safeextract.go`            |                       230 | Coherent safe-extraction owner; no finding.                                                                              |
| `release/source-closure.mjs`                  |                       247 | Coherent source-closure owner; no finding.                                                                               |

## Review Conclusion

The clean-cut architecture, host/provider split, focused evidence chain, and nine-asset hosted release chain are materially strong, and the full implementation gate passes. The five findings are nevertheless reachable violations of explicit public install/store/lifecycle contracts. They are bounded to existing implementation owners and classify as `Local Fix -> implementation_engineer`; API/E2E must remain paused until a new source review passes.
