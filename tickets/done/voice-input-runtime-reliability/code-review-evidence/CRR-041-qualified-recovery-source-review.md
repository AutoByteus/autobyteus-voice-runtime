# CRR-041 Qualified Recovery Source Review Evidence

## Reviewed state

- Worktree: `/Users/normy/autobyteus_org/autobyteus-worktrees/voice-runtime-qualified-recovery`
- Base: `fd83e8681dfd4e98afdfa46cb691d31400565d70`
- Source commits: `74d0c9f6ea6f5806d1baafe949b5c500e2123c70`, `b238f967cfee8be445808ac9499a91533bb7d58e`
- Implementation artifact / reviewed HEAD before reviewer artifacts: `2a5cdeaccfc0017ebdd79f72a8a9e88536ec0a75`
- Review basis: `SR-015`–`SR-017`, `ARCH-REV-018`, `IR-026`, `R-022`–`R-024`, `AC-025`–`AC-027`.

## Focused execution

### Release-pipeline gate

Command:

```bash
npm run check:release-pipeline
```

Result: **Fail**. The runner reports `20/21` tests passed and one failed. `tests/release/relevant-source-closure.test.mjs:22-35` asserts that current `HEAD` has the frozen Qualification Authority closure. The current observed tree digest is `d1272eeae982173114c7dc67b62ff4876d8a2e101d2fa0ffd2fdc5c57526d1b5`; the frozen authority is `448c69d6216b9b35e09fa4622bf9f279bd250a7bf88d07ebb3f456ef172a31a1`.

The exact log is retained outside the repository at `/tmp/crr-041-check-release-pipeline.log` for this review session.

### Full repository gate

Command:

```bash
PATH=/tmp/autobyteus-go1.26.5-v1/go/bin:$PATH \
VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go \
npm run check
```

Result: **Fail** after the JS/source, `7/7` Python plus compileall, Go, and English/Chinese evidence checks pass. The Node suite reports `130/131` passed and the same frozen/current closure assertion failed. The exact log is retained at `/tmp/crr-041-npm-check.log` for this review session.

### Current closure decision

The canonical source-closure owner reports:

- frozen Profile closure: unchanged;
- current Qualification Authority tree digest: `d1272eea...1b5` rather than frozen `448c69d...31a1`;
- decision from accepted Qualification Authority base `b19f51f8e2ee2ca7ae659edf2c451a02b9a3ac4e` to current source: `aggregate-api-renewal-required`.

The material aggregate paths include the removal/update of workflow-coupled assertions under `tests/build/trusted-native-environment.test.mjs` and `tests/release/qualification-gates.test.mjs`. This agrees with IR-026's written caveat but contradicts its claimed passing focused/full checks.

### Unknown-path closure-only probe

A disposable local Git clone was created from source `b238f967...`, its current Profile and Qualification Authority closures were frozen in an in-memory copy of the production policy, and one unknown path was committed. The disposable clone was removed after the probe.

Observed result:

```json
{
  "base": "b238f967cfee8be445808ac9499a91533bb7d58e",
  "closureOnlyEquality": true,
  "changedPaths": [
    {
      "status": "A",
      "path": "unexpected/new-authority.bin",
      "category": "api-impact-review-required"
    }
  ],
  "fullDecision": "api-impact-review-required"
}
```

This proves the implementation distinction relevant to `CR-F-035`: comparing only the two included closure digests cannot replace complete changed-path classification. An unknown path is excluded from both closure inventories and therefore leaves closure-only equality true even though the authoritative path decision blocks.

## Production-path trace

### Missing preliminary source-closure decision

- The approved operational sequence requires preliminary Relevant Source Closure 1 before exact archive recovery, and again before Delivery finalization.
- `.github/workflows/recover-qualified-voice-archives.yml:61-67` invokes the recovery controller directly; no source-closure decision precedes the two expensive package builds.
- `.github/workflows/promote-qualified-voice-candidate.yml:63-84` writes only the frozen closure identities and invokes candidate assembly.
- `release/qualified-release-candidate.mjs:278-292` recomputes only Profile and Qualification Authority closure digests at the API approval commit. It does not classify the complete diff, record all changed paths, or prove the preliminary ancestry/decision.
- `release/assess-qualified-candidate.mjs:57-62` classifies only `approvalCommit -> finalMainCommit`. It cannot detect an unknown path already present in the approval commit.

### Untruthful blocked recovery evidence

- `release/recovery-build.mjs:51-62` builds profiles sequentially, so a first-profile failure occurs before the second profile is attempted.
- `release/recover-qualified-voice-archives.mjs:224-250` nevertheless fabricates fallback rows for both profiles with `buildCount: 1`.
- The generic writer at `release/recover-qualified-voice-archives.mjs:206-219` writes each fallback profile record with `decision: "pass"` even though `exactMatch` is false.
- `buildRecoveryResult()` and `zeroExecution()` record `packageBuildsPerProfile: 1` for the blocked Result as well.
- The outer Result is changed to `decision: "blocked"`, but the immutable manifest then closes raw profile records that claim Pass and one build for a profile that may not have run.

The supported trigger is the approved API/E2E recovery dispatch; `AC-025` explicitly includes missing/mismatched checkout, input, toolchain, runner, source, archive, or evidence conditions as fail-closed outcomes. No hypothetical or test-only caller is required.

## Other review evidence

- `git diff --check fd83e868...b238f967`: Pass.
- Changed implementation-source effective non-empty lines: `qualified-release-candidate.mjs` 458; `recover-qualified-voice-archives.mjs` 407; `recovery-build.mjs` 302; all other changed implementation files at or below 215. No changed implementation file exceeds the 500-line hard limit.
- The exact-source/no-provider/no-qualification recovery boundary, acyclic eight-raw -> manifest -> Result -> 19-member candidate direction, hosted-only `pretag|publish`, exact five-file publication, downloaded-byte verification, tag-preserving quarantine, and executable mode corrections are otherwise preserved by the reviewed source and passing focused assertions.
