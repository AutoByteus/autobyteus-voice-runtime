# CRR-023 / IR-017 Resolution Evidence

## Scope

- Reviewed source commit: `e133c4a7a73a5531c726ecb04461acb641461667`
- Implementation artifact commit: `4329950747d376578e502095c321e6d44817627e`
- Trigger: `CRR-022`, `CR-F-025`, `CR-F-026`, `API-F-005`, `API-F-006`
- Authority: `SR-010`, `SR-011`, `ARCH-REV-012 Pass`

## CR-F-025 Resolution

Production trace:

1. `validatePrivatePaths()` still resolves the private interpreter and worker through `containedRegular()`, which rejects invalid, linked, escaped, non-regular, or missing paths and returns canonical absolute paths.
2. The public launcher still owns the private invocation and still supplies only its closed environment.
3. For `python-worker`, the launcher retains `-I -B -X utf8` and uses a constant bootstrap supplied with two argv values: the canonical parent of the validated worker and the validated worker itself.
4. The bootstrap inserts only that package-owned directory at `sys.path[0]` and runs the worker as `__main__`. Paths are argv data, not interpolated into code.
5. No inherited `PYTHONPATH`, current working directory, system-runtime choice, fallback, alternate public launcher, or request-provided worker path is introduced.

Durable coverage compiles the real Go launcher into a relocated package path containing spaces and non-ASCII, uses an unrelated CWD, poisons ambient Python home/path, and executes through the real plan/config/manifest/control validation. It confirms `sys.flags.isolated == 1`, the canonical worker parent at `sys.path[0]`, successful `autobyteus_voice_provider` import, and the first `hello` frame.

Reviewer execution:

- `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go node --test tests/contracts/python-launcher-composition.test.mjs tests/release/qualification-failure-evidence.test.mjs tests/release/functional-gate-retention.test.mjs` -> `4/4` passed, zero skipped.
- Launcher Go tests passed.
- Full `npm run check` -> `72/72` top-level Node cases, `79/79` TAP tests, `7/7` Python, all Go/source/schema/evidence checks, zero skipped.

Decision: `CR-F-025 Resolved` in source. Actual packaged MLX preparation/inference remains the required API/E2E proof.

## CR-F-026 Resolution

Production trace:

1. `writeProfileQualificationEvidence()` retains the existing decision-first attempt finalization established by `CR-F-021`.
2. Summary construction now explicitly projects `fileName`, `sha256`, `compressedSizeBytes`, `extractedSizeBytes`, and `entryCount`.
3. The wider build report retains its owning `archive.schemaVersion: 1`; Summary 2 remains strict with `additionalProperties: false`.
4. The production-shaped process-loss fixture includes the producer `schemaVersion`, retains matching ledger/Summary `fail/process-loss`, writes Assessment 1 with the Summary digest and attempt counts, independently verifies it, then proves the passing-only boundary rejects the non-pass result.
5. The existing post-attempt functional-gate fixture also uses the real producer archive shape.

Decision: `CR-F-026 Resolved` in source. The strict acyclic Summary -> Assessment -> Qualification Set chain is preserved.

## Structural And Change-Boundary Result

- Changed implementation source is confined to `launcher/internal/run.go` and `benchmark/profile-qualification-evidence.mjs`.
- `launcher/internal/run.go`: 61 effective non-empty lines; `+6/-5` in the bounded diff.
- `benchmark/profile-qualification-evidence.mjs`: 304 effective non-empty lines; `+7/-1`; below the 500-line hard limit and not a >220-line delta. It remains the reviewed single owner of Summary/Assessment composition.
- Tests are coherent by boundary and excluded from implementation-source size thresholds.
- Source/test SHA-256 values:
  - launcher: `23686496c1687c613b14c777864b797a4275cf2f9cc1b480f19df3add733b378`
  - evidence writer: `7ec81e20dddfecf695fcb86fd0fc2b77a420be4a30f8ab32199afdfacbe5c059`
  - launcher composition test: `924cdb3dc0dc427cb4fc436e63bd75fd23098eddc0f9c3fd5b893c1a2a4f52a6`
  - process-loss test: `f0574724fef57f279c7f135fa87a657ddc736b1e7a5fb92a9bdee5318030bd74`
  - post-attempt fixture: `2b06ca1e02fec25c570731e9ed05d756c81ff5dde1493e906aa4921c1036afd0`
- Prettier and `git diff --check` passed. Only reviewer-owned report/revision/evidence files remain uncommitted.

## Review Result

- `CR-F-025`: Resolved.
- `CR-F-026`: Resolved.
- No new findings.
- Result: `Pass -> api_e2e_engineer`.
- API/E2E resume point: exact current English qualification using the already-reviewed package path, first confirming actual MLX startup/inference and terminal evidence behavior before continuing the remaining matrix.
