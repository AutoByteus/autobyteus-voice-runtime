# CRR-020 / API-F-004 Failure-Origin Evidence

## Scope

- Reviewed source: `24a994a51256f0eef5840ecdc977febec71ea491` (`IR-015`)
- Trigger: `API-REV-008`, `API-F-004`, `API-VOICE-003`
- Affected criteria: `AC-006`, `AC-017`
- Reviewed boundary: exact English darwin-arm64 Python runtime materialization -> package staging -> Package File Manifest -> canonical Provider Archive 1 validation

## Supported Production Reachability

The independent initiating action is the repository-supported maintainer `workflow_dispatch` operation `prequalify` in `.github/workflows/release-voice-runtime.yml`. For the current `english/darwin-arm64` matrix row, the workflow creates the trusted native environment, enters the checked-in deny-network Seatbelt profile, and invokes `build/package-assembler.mjs`. The assembler invokes the MLX builder; `copyPythonProvider()` materializes and copies the locked Python runtime to `host/python`; the assembler lists the complete stage in `provider/package-files-v1.json`; the Go Provider Archive owner reads that manifest and applies the approved ASCII path grammar. This is the normal `BEH-004` / `BEH-010` package path, not a test-created edge.

## Evidence Checked

- Functional Preflight 2 passed on the actual M1 Max on AC. Exact source, inputs, and 49/200 corpora passed their preceding checks.
- The canonical first English build ran under the pinned deny-network Seatbelt and reached final Go archive validation.
- Production failed with `manifest paths invalid or unsorted`; no archive was created.
- The restored observer captured the exact 19,003-record production manifest. Its source file was restored to the original SHA-256 and the isolated checkout was clean.
- Independent recomputation over the captured manifest found:
  - records: `19,003`
  - lexicographically sorted: `true`
  - exact unique: `true`
  - ASCII-case-fold unique: `true`
  - paths outside `^[A-Za-z0-9._/-]+$`: exactly two
    - `host/python/lib/python3.12/site-packages/scipy/io/tests/data/Transparent Busy.ani`
    - `host/python/lib/python3.12/site-packages/torch/include/c10/util/C++17.h`
- Evidence SHA-256 values independently matched the structured finding:
  - manifest: `f386c37cea8a8e639affc306279bebf44d1a259ee086cce1ed3129f7e76c3905`
  - analysis: `15660edd642d27c01dcb7e3c457f68c69ce4e06d1a9863232d960eaad5e3ca26`
  - build log: `b5f8b3a723dde3d59fdc534be621e87f5f9b6b8d477f0e9edb25ace5982349ba`

## Source Trace

1. `build/python/materialize-runtime.mjs` verifies the locked Python archive and wheelhouse, installs the exact wheels, and prunes a bounded set of root build artifacts.
2. Its current pruning removes root `include`, root `lib/pkgconfig`, root `libs`, console wrappers, build-only distributions, `RECORD`, bytecode, and static `libpython`, but it leaves installed distribution test payload and package-local development headers.
3. `build/profile-builders/common.mjs::copyPythonProvider()` copies the complete returned runtime beneath `host/python`.
4. `build/package-assembler.mjs` records every staged regular file without a pre-archive runtime-closure correction.
5. `packaging/archive/pathpolicy.go::ValidateRelativePath()` correctly enforces the approved Provider Archive 1 ASCII grammar. `packaging/archive/json.go::ReadManifest()` correctly rejects the generated manifest.

## Origin Decision

- Origin: bounded implementation/package-closure defect.
- Classification: `Local Fix`.
- Owner: `implementation_engineer`.
- Design/requirement impact: none. The reviewed archive grammar, fail-closed validator, exact provider/model/input authority, and Seatbelt boundary remain correct and must not be weakened.
- Prior source-review gap: yes, bounded to the API/E2E-readiness conclusion in `CRR-019`. That review materialized the exact 18,978-file Python tree but did not compare every retained path with the already-reviewed downstream Provider Archive grammar. The invariant that should have been caught was: every materializer output copied under `host/python` must either satisfy Provider Archive 1 path policy or be excluded by an explicit runtime-closure owner before manifest creation.

## Proportionate Correction Boundary

- Preserve the canonical Go archive path policy unchanged.
- Do not rename the two input files ad hoc, mutate locked inputs, add a fallback, switch provider/model, weaken Seatbelt, or alter thresholds.
- Make the Python runtime closure explicitly exclude non-runtime dependency test/development payload that cannot enter the public package, using a coherent owned policy rather than two literal filename exceptions.
- Add focused durable coverage for the two observed classes and prove that the resulting complete staged manifest is accepted by the canonical Go path validator while the relocated MLX worker/runtime remains usable.
- After source re-review, API/E2E must restart at canonical English construction and continue the unexecuted matrix only after the first archive passes.
