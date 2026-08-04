# CRR-035 Cold Preparation Resolution Evidence

## Review Identity

- Entry point: `Implementation Review`
- Solution authority: `SR-013`, `SR-014`
- Architecture authority: `ARCH-REV-015 Pass`
- Implementation revision: `IR-023`
- Reviewed source: `32829080938911f0f46390a3fd2af823e105bd32`
- Reviewed repository HEAD: `acdff904a64be4d9aa63d2a63588ecda045e4ed8`
- Trigger: `CR-F-033` / `API-F-013` and resolved architecture finding `AR-F-014`

## Supported Production Path

The initiating surface is the checked-in `workflow_dispatch` `prequalify` operation. Its normal forward path is Functional Preflight 2 -> exact package construction and verification -> thirty pinned-purge filesystem-cold public-package sessions plus thirty warm-preparation sessions -> public launcher under Seatbelt -> `hello` -> full package integrity and model preparation -> `inference-ready` -> attempts/raw evidence -> Qualification Summary 2 -> Performance Assessment 1 -> Qualification Set 2 -> release evidence. This operational path and the 30-second readiness contract independently establish reachability; the API failure does not establish its own reachability.

## Source Resolution

### `CR-F-033` / `API-F-013`

- `providers/chinese-funasr/src/package_integrity.cpp` replaces model-sized whole-file allocation with a checked fixed 1 MiB buffer.
- `providers/chinese-funasr/src/package_integrity_apple.cpp` is the sole Apple CommonCrypto SHA-256 owner. Initialization, update, finalization, read errors, premature EOF, and empty-progress conditions fail closed.
- Full manifest order, path, mode, size, digest, containment, uniqueness, and closure validation remain mandatory in the normal session path.
- The former `sha256.cpp` / `sha256.h` implementation is deleted, removed from CMake and the exact input recipe, and no fallback remains.
- A reviewer-built proof hashed the retained exact 469,331,008-byte encoder and 804,753,280-byte language model to the approved digests `f92f91d01a24fbed6c863495b2ee8c6a6788144a02858b75743f0946668de8a2` and `819f385dc0e035dccc3d9e7edaf6b7b044b8ba7ace63cbcbf84c7e397eecbf27`.

### Preparation Diagnostics and `AR-F-014`

- The worker emits the exact ten-record private Preparation Diagnostics 1 sequence on stderr with direct JSON-plus-LF writes; public Protocol 1 stdout is unchanged.
- `benchmark/preparation-diagnostics.mjs` owns raw-byte line framing, strict grammar/sequence validation, receipt timestamps, privacy-safe unrelated-stderr accounting, and Stage Evidence 1 derivation.
- `ProviderProcessSession` establishes one monotonic qualification origin before spawn and attaches the observer before process start.
- `rss-sampler.mjs` records single-flight process-tree scan windows on the same attempt clock. Periodic and diagnostic-boundary scans are retained.
- Stage evidence uses inclusive interval intersection and distinguishes contained, boundary-overlap, and unavailable evidence. A successful preparation with unavailable stage coverage fails validation.
- Stage maxima are observational and nonexclusive. Complete-session process-tree maximum RSS remains the only hard resource-policy input.
- Attempt identity and raw-stage-evidence digest/contract bindings propagate forward through Summary 2, independently verified Assessment 1, Qualification Set 2, and Release Qualification Evidence 2 without a reverse dependency.

## Structural Audit

- Data flow remains spine-first: workflow/package -> public session -> bounded integrity/preparation -> readiness -> evidence chain -> release eligibility.
- Runtime integrity, private diagnostic parsing, process-tree sampling, qualification assembly, and release verification each have one authoritative owner.
- `benchmark/preparation-diagnostics.mjs` is a new 433-effective-line owner and exceeds the 220-line delta trigger. Its responsibilities are one cohesive private-diagnostic and stage-evidence concern; no mixed provider, release, or resource-policy authority was found. It remains below the 500-line hard limit. Future unrelated expansion should split parsing from evidence derivation rather than grow this owner.
- `benchmark/run-profile-qualification.mjs` shrank from 499 to 443 effective lines through owned extraction.
- No changed implementation source exceeds 500 effective non-empty lines.
- No dual hash path, compatibility branch, old diagnostic schema, reverse evidence edge, or request-time legacy fallback remains.

## Reviewer Validation

- Cold-preparation evidence checksum set: `6/6` pass.
- Focused current-source tests: `28/28` pass.
- Full pinned-Go repository check: `109/109` Node TAP, `7/7` Python plus compileall, and all Go/source/schema/evidence checks pass.
- Current native Chinese worker compiles from the exact retained locked llama.cpp/utf8proc inputs with warnings as errors; artifact: `/private/tmp/crr035-native-build-3282908/voice-provider-worker`.
- Current CommonCrypto source matches both retained exact model digests.
- Production-shaped child-process split/coalesced stderr/stdout ordering probe: `100/100` sessions retain the exact diagnostic sequence and reach ready.
- Changed JSON contracts/schemas parse; solution evidence checksums pass; `git diff --check` passes.

## Conclusion

`CR-F-033` is resolved in source and `AR-F-014` is resolved in the executable qualification/evidence chain. No new implementation finding is open. The full canonical actual-M1 package and qualification workflow is still required to prove 30/30 cold and warm-preparation completion, complete Chinese and English qualification, Qualification Set 2, and Branch Catalog Projection 2 against this exact source.
