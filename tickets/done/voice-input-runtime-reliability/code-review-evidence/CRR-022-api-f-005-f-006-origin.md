# CRR-022 / API-F-005 and API-F-006 Failure-Origin Evidence

## Scope

- Reviewed source: `1d712683c70c338d8bf5074f27c8b0c9da47a8cb` (`IR-016`)
- Trigger: `API-REV-009`, `API-F-005`, `API-F-006`, `API-VOICE-003`
- Affected criteria: `AC-002`, `AC-003`, `AC-006`, `AC-007`, `AC-011`, `AC-013`, `AC-017`, `AC-023`
- Reviewed boundaries:
  1. extracted current English package public launcher -> contained Python worker -> first protocol frame
  2. supported process loss -> attempt finalization -> Qualification Summary 2 -> Performance Assessment 1 -> terminal CLI failure

## Supported Production Reachability

### MP-CR-019 — Current English public launcher reaches the contained Python worker

The independent initiating action is the repository-supported maintainer `workflow_dispatch` operation `prequalify`. For the current `english/darwin-arm64` matrix row, the workflow builds and verifies the exact archive, extracts it, and invokes `benchmark/run-profile-qualification.mjs`. The runner creates `ProviderProcessSession` with the extracted public `bin/voice-provider`; the session invokes that launcher under the approved Seatbelt prefix; the Go launcher validates the package/session and replaces itself with the plan-bound `host/python/bin/python3 -I -B -X utf8 worker/worker.py ...`. This is the approved `BEH-002` / `BEH-004` / `BEH-009` / `BEH-010` path. The release contract independently exposes the same public launcher for later catalog consumers.

### MP-CR-020 — A supported qualification failure must retain the Summary/Assessment chain

The initiating basis is the governing functional-qualification contract, especially `AC-003`, `AC-011`, `AC-017`, and `AC-023`: every started attempt and failure must remain visible, and final raw/preflight evidence must produce immutable Qualification Summary 2 followed by Performance Assessment 1 before the passing-only boundary exits nonzero. The normal prequalification path starts a cold attempt; `API-F-005` causes a supported `process-loss`; `run-profile-qualification.mjs` finalizes the recorder and calls `writeProfileQualificationEvidence()` with `fail/process-loss`. This is the approved `BEH-007` / `BEH-008` failure path, not a synthetic-only edge.

## Evidence Checked

- Functional Preflight 2 passed on the actual M1 Max on AC. Exact inputs and 49/200 corpora passed.
- The current English archive built twice inside the pinned deny-network Seatbelt and both archives are byte-identical at SHA-256 `057c011a6371e40fdfdc7bcc67fe99709ea39024ed2dcf47f97d84b84dc2b15f`.
- Archive verification, reproducibility, compliance, extracted-size, and entry-count checks passed. This directly resolves `API-F-004` / `CR-F-024` at the full package boundary.
- The first cold purge completed. Attempt `0` then retained `fail/process-loss` after `3,988.390125 ms`.
- Exact extracted-launcher execution under the same Seatbelt exited `1` after `792.1125 ms`, emitted no stdout, and failed before `hello` with `ModuleNotFoundError: No module named 'autobyteus_voice_provider'`.
- The archive contains both `worker/worker.py` and `worker/autobyteus_voice_provider`.
- Source SHA-256 values independently match the API finding:
  - `launcher/internal/run.go`: `812fbccdc8acfc64360533270f7db0c20a18d31df1465edd83c12467e507e7f0`
  - `providers/english-mlx/worker.py`: `3be3380fc089f8fad6c03e71cf5aad82a7ebd20dc733eb7947e344c1b5ff5ae4`
  - `benchmark/profile-qualification-evidence.mjs`: `eae23f57e1b2edc7a2f12bddb8061b147ec3e41cce9baa58810d558b8ecc9336`
  - Summary 2 schema: `c59c8f7219c6bdcc3d61ae67bde5b6d293325536a208b858a691510c90d26f82`
- A reviewer-local minimal reproduction confirmed the relevant Python rule: a sibling import succeeds for `python3 script.py` and fails for `python3 -I script.py` because isolated mode omits the script directory from `sys.path`.
- The exact build report's archive object is `{schemaVersion, sha256, compressedSizeBytes, extractedSizeBytes, entryCount}`. Summary construction spreads all of it and adds `fileName`; Summary 2 permits only the latter five identity/size/count properties with `additionalProperties: false`.
- The runner log fails exactly at Summary validation with `/archive additionalProperty schemaVersion`; the finalized attempt ledger remains, but no Summary or Assessment exists and the schema error masks the initiating launcher failure.

## Source Trace

### API-F-005

1. `benchmark/run-profile-qualification.mjs::createSession()` supplies the exact extracted public launcher to `ProviderProcessSession`.
2. `ProviderProcessSession.start()` invokes it under the approved qualification Seatbelt with only `--session-config` exposed publicly.
3. `launcher/internal/run.go` derives/validates the package root and plan, then invokes the bundled Python host with `-I -B -X utf8` and the contained `worker/worker.py` path.
4. `providers/english-mlx/worker.py` immediately imports `autobyteus_voice_provider.bootstrap` and `recognizer` as siblings.
5. `-I` intentionally excludes ambient/user paths, but it also excludes the script's adjacent directory; no package-owned bootstrap establishes that directory. The interpreter therefore exits before any protocol frame.

### API-F-006

1. `run-profile-qualification.mjs` catches the process loss, classifies it, and calls `writeProfileQualificationEvidence()` with the correct non-pass outcome.
2. `profile-qualification-evidence.mjs` snapshots/finalizes the recorder consistently, preserving the original `CR-F-021` decision-alignment fix.
3. Summary construction uses `archive: { ...build.archive, fileName: ... }`.
4. The production build report written by `build/package-assembler.mjs` correctly carries `archive.schemaVersion: 1`.
5. The strict Summary 2 archive schema intentionally rejects that producer-specific field, so validation occurs before Summary/Assessment writes and replaces the primary CLI error.
6. Existing failure-retention fixtures omit `archive.schemaVersion`; they prove decision sequencing but do not represent the production build-report boundary.

## Origin Decision

### CR-F-025 / API-F-005

- Origin: bounded implementation defect in the current public-launcher-to-contained-Python-worker composition.
- Classification: `Local Fix`.
- Owner: `implementation_engineer`.
- Design/requirement impact: none. The public host-neutral launcher, bundled interpreter, isolated environment, contained private worker, no fallback, and exact protocol lifecycle remain correct requirements.
- Prior source-review gap: yes. The exact `-I <worker script>` invocation and immediate sibling imports have coexisted since source commit `ce9d4b45`; launcher tests exercised plan/environment validation but never executed the private Python composition. The invariant that should have been caught was: the plan-bound Python worker must be importable under the exact isolated invocation and relocated package layout before `hello`.

### CR-F-026 / API-F-006

- Origin: bounded implementation defect in Summary 2 archive projection and terminal failure-evidence completion.
- Classification: `Local Fix`.
- Owner: `implementation_engineer`.
- Design/requirement impact: none. The strict Summary schema and the Summary-first Assessment chain are correct and must not be weakened.
- Prior source-review gap: yes, bounded to production-shape test readiness. `CR-F-021` remains resolved for decision sequencing, but its resolution fixtures used a narrowed archive object and did not exercise the real build-report archive shape. The invariant that should have been caught was: every strict evidence boundary must explicitly project its allowed fields from the real producer shape, including on non-pass paths; it must not spread a wider producer object.

## Proportionate Correction Boundary

### CR-F-025

- Preserve `-I`, the closed launcher environment, the exact public invocation, containment/integrity checks, and the absence of fallback/system paths.
- Establish one explicit package-owned import/bootstrap root derived from the already-validated contained worker location before application imports. Do not use inherited `PYTHONPATH`, current-directory dependence, the system interpreter, or removal of isolated mode.
- Add durable coverage that executes the real launcher/private-Python composition from a relocated package path (including spaces/non-ASCII) and proves the packaged application module loads and the first protocol lifecycle frame is emitted. API/E2E must still repeat the actual MLX package run.

### CR-F-026

- Project exactly `fileName`, `sha256`, `compressedSizeBytes`, `extractedSizeBytes`, and `entryCount` into Summary 2 from the real build archive; do not relax `additionalProperties: false` or remove `schemaVersion` from its owning build-report contract.
- Exercise a real production-shaped build archive containing `schemaVersion: 1` on a `process-loss` path. Assert the ledger, Summary, and Assessment are all retained with matching `fail/process-loss`, and that the CLI exits nonzero for the initiating provider failure only after evidence is durable.
- Preserve the existing acyclic Summary -> Assessment -> Qualification Set ordering and the resolved `CR-F-021` decision authority.

After source re-review, API/E2E must restart at the exact current English profile qualification boundary. It may reuse the already-proven archive bytes only under its documented evidence-reuse rules; no reviewer claim substitutes for the resumed executable proof.
