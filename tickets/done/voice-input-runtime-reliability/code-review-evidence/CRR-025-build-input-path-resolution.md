# CRR-025 Build Input Path Resolution Evidence

## Result

- Review entry: implementation re-review of `IR-018`.
- Trigger: `CRR-024` / `CR-F-027` / `API-F-007`.
- Reviewed source commit: `8680c6a9693f3b55021c9317e0163281c946ca96`.
- Result: `Pass`.

## Source Resolution

`build/build-input-path-policy.mjs` is now the single owner for materialized Build Input record paths. It enforces canonical relative ASCII POSIX form, a 240-byte bound, an explicit segment character set including the current authenticated `()`, `[]`, and `+` routing syntax, no empty/dot/dot-dot/`.git` segment, no backslash/trailing dot/Windows reserved name, and no exact or ASCII-case-fold collision.

Producer and consumer use the same owner:

- `build/materialize-release-inputs.mjs` validates each authenticated Git path before copying and validates the complete final file set before provenance/manifest generation.
- `build/locked-inputs.mjs` validates the complete manifest path set through the same owner before its byte/size/mode/immutability/tree-closure checks.
- The obsolete verifier-only `.git` skip is removed. The deterministic materializer never emits checkout metadata.
- `packaging/archive/` is byte-unchanged from `IR-017`; Provider Archive 1 retains its separate narrower output-path policy.

The explicit contract is `contracts/build/build-input-path-v1.md`. No upstream file is renamed, omitted, projected, or modified.

## Independent Checks

- `node --test tests/release/build-input-path-contract.test.mjs` — `4/4` pass.
- Exact retained API-REV-010 Chinese tree passed the corrected production `verifyInputManifest()` with all `3,149` records and all ten previously rejected routing paths.
- The compressed fixture digest is `991f67d27281c782d69302692198486ab1648b64d550a039099985a87308ac17`; decompressed digest is `e083c4c9cf3a072d9a0365b2147f30a3bfd2d522dbacc7b17474cd07305852e6`; its ordered path list exactly equals the API-REV-010 manifest and has `3,149` unique values.
- `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check` — pass: `76` top-level Node cases / `83` TAP tests, `7/7` Python plus compileall, all Go/source/schema/evidence checks, zero skips.
- `git diff --check` — pass.
- Provider Archive implementation diff from IR-017 — empty.

## Prior Finding Resolution

`CR-F-027` is resolved in source. The current producer can no longer successfully emit a path set that its mandatory consumer rejects, while unsafe source paths still fail during materialization and unsafe manifest records fail during verification. Exact current Chinese path acceptance is proven without weakening containment, immutability, collision, or closure checks.

## Remaining Gate

Source proof does not replace the actual package path. API/E2E must restart at canonical Chinese network-denied construction, complete both reproducible archives and verification/compliance, then execute the exact 200-WAV plus 30/30/100 lifecycle/resource qualification and form Qualification Set 2 and Branch Catalog Projection 2. Existing complete English evidence remains subject to API/E2E changed-byte/contract validity analysis.
