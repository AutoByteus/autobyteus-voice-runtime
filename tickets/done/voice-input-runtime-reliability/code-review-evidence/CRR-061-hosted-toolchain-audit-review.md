# CRR-061 Hosted Toolchain And Early-Audit Review Evidence

## Reviewed subjects

- Maintained-main base: `a486c998481a4d6649d3245c24f0c8e954785594`
- IR-038 source: `b5d3c2fb8cd59c7fe40fa06546f3d6ae1b123636`
- Reviewed artifact: `c233e2c82300e798322964c2547af3d97f507488`
- Trigger: `DR-010`, standard-hosted run `31420271551`

The source range changes exactly seven release-pipeline paths: the single hosted
workflow, two release owners, two strict schemas, the existing release contract
test, and the release schema/check gate. The worktree was clean before reviewer
artifact edits.

## Production-path trace

The independently supported trigger is the approved manual
`Voice runtime host release` Actions dispatch on maintained main (`BEH-013`,
`R-023`, `AC-026`). The observed DR-010 run reached checkout, exact Node/Go,
source admission, and Admission 4 verification, then the prior workflow passed
ambient CMake/Xcode/SDK directly to Host Build Environment 2. That owner rejected
the mutable default versions before input hydration; its requested audit output
did not exist, so the always-run upload also failed.

IR-038 changes the forward path to:

```text
manual maintained-main dispatch
  -> checkout
  -> atomic core-only Hosted Release Audit 1 initialization
  -> exact Node/Go selection and source/admission verification
  -> Hosted Toolchain Selection 1
       (exact installed Xcode 26.1.1 build 17B100 + contained SDK 26.1
        + exact SDKSettings digest + official checksum-bound CMake 4.2.0)
  -> unchanged Host Build Environment 2 revalidation
  -> input hydration / host construction / nine-asset chain
  -> exact GitHub outcome finalization
  -> always-run audit upload
```

The selector exposes only the authenticated CMake executable path to the
existing environment owner. There is no ambient/default/latest/Homebrew/
alternate-runner fallback, and tool selection completes before host input
hydration begins.

## Independent source and contract evidence

- The current official `macos-26` arm64 runner manifest lists Node `24.18.0`
  (sufficient for the dependency-free pre-setup audit initializer), cached Node
  `22.23.1`, Go `1.26.5`, Xcode `26.1.1` build `17B100` at
  `/Applications/Xcode_26.1.1.app`, and macOS SDK `26.1` for that Xcode.
  Source: <https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md>
- Kitware's official `cmake-4.2.0-SHA-256.txt` reports
  `b8b040a06343b2b6bc090b03a9c2bb4e98037518846989fb7c40ebbf30655c5d`
  for `cmake-4.2.0-macos-universal.tar.gz`; it equals the source/schema lock.
- Retained API-REV-022 actual-host evidence independently binds the extracted
  executable SHA-256
  `d03ae0d5208459e5339a1ee62c0d0698132f9488e9c47216b0f2b8141f970fbb`,
  Xcode build, SDK version, and SDKSettings digest used by the new selector.
- Reviewer inspection confirmed that the CMake archive is authenticated before
  extraction, the resulting path must be an ordinary executable with exact
  bytes and version, SDK realpath must remain below the exact selected Xcode,
  and the downstream Host Build Environment 2 independently rehashes and
  revalidates the selected tools.
- Audit validation accepts only the exact ordered 11-phase set and maps GitHub
  `success|failure|cancelled|skipped` to
  `succeeded|failed|cancelled|unattempted`. The first incomplete primary phase
  determines the bounded failure category; a Pass requires all ten primary
  phases to succeed and quarantine to remain unattempted.

## Reviewer execution

Executed at reviewed artifact `c233e2c82300e798322964c2547af3d97f507488`
with Node `v22.23.1` and verified Go `go1.26.5 darwin/arm64`:

1. `VOICE_GO=/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go npm run check:release-pipeline`
   - Pass: `22/22`, no failure/skip.
2. `PATH=/tmp/autobyteus-go1.26.5-sr021-v2/go/bin:$PATH VOICE_GO=/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go npm run check`
   - Pass: source guards; Python `7/7` plus compileall; all Go and evidence
     checks; Node TAP `107/107`, no failure/skip.
3. Prettier check over all seven changed paths, `git diff --check`, and
   `git show --check b5d3c2f...`
   - Pass.
4. Independent Policy 3 classification of `a486c998...b5d3c2f`
   - exactly seven changed paths;
   - every row `release-pipeline-only`;
   - decision `reuse-permitted`;
   - Policy identity `3129` bytes /
     `c7cd2e5ede4a96f6990145a4719912e6dd7dc97fa85d157ea0f68ab37af1e676`.
5. `actionlint` with ShellCheck integration disabled
   - Pass: workflow YAML, Actions expressions, step references, and structure.
   - Default ShellCheck integration separately reports `SC2251` on the unchanged
     `! gh release view ...` line. A Bash probe confirms that the negated command
     does not itself trigger `errexit`. `MP-CRR-061-02` classifies the claimed
     consequence `Not Reachable`: every supported existing Release is created
     only after the immutable tag is pushed, quarantine preserves that tag, and
     the preceding fetched-tag check stops a later dispatch. It therefore drives
     no finding, score deduction, or corrective machinery.

## Source-size evidence

Effective non-empty lines for changed implementation source:

| Path                                                          | Lines |
| ------------------------------------------------------------- | ----: |
| `.github/workflows/release-voice-runtime.yml`                 |   205 |
| `contracts/release/hosted-release-audit-v1.schema.json`       |   123 |
| `contracts/release/hosted-toolchain-selection-v1.schema.json` |    71 |
| `release/hosted-release-audit.mjs`                            |   198 |
| `release/hosted-toolchain.mjs`                                |   180 |
| `tooling/check-release-pipeline.mjs`                          |    65 |

No changed implementation-source file exceeds 220 effective non-empty lines.
The changed test file is intentionally excluded from implementation-source
thresholds and remains one coherent release-boundary suite.

## Conclusion

`DR-010` is resolved in source. IR-038 preserves the exact tool lock and
release authority while making the observed hosted-toolchain failure class
executable and auditable on standard hosted capacity. Real standard-hosted
selection/environment/audit execution remains the bounded API/E2E gate; product,
profile, provider, model, inference, corpus, performance, tag, and publication
work is not authorized by this source result.
