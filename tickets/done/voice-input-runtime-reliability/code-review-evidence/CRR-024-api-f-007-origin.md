# CRR-024 API-F-007 Failure-Origin Evidence

## Decision

- API/E2E failure: `API-F-007` in `API-VOICE-004`.
- Review finding: `CR-F-027`.
- Origin: implementation-owned producer/consumer integration defect.
- Classification: `Local Fix`.
- Owner: `implementation_engineer`.

## Supported Reachability

The initiating trigger is not the API probe. The repository-supported operational surface is `.github/workflows/release-voice-runtime.yml` `workflow_dispatch` with `operation=prequalify`. The workflow derives both current entries from `contracts/catalog/current-release-matrix-v1.json`, materializes `chinese/darwin-arm64` through its reviewed recipe, and sends the resulting input tree to the first network-denied `package-assembler.mjs` construction. This is the required AC-006/AC-017/AC-019 path for the selected Chinese package.

Forward trace:

1. `release-voice-runtime.yml:30-58` expands the exact current two-entry matrix, including `chinese/darwin-arm64`.
2. `release-voice-runtime.yml:80-108` runs `materialize-release-inputs.mjs`, then the canonical package assembler twice under the pinned deny-network Seatbelt profile.
3. `build/materialize-release-inputs.mjs:73-100,213-241` verifies the pinned clean checkout and copies every `100644`/`100755` Git tree entry. `fileRecords()` at lines 261-277 emits every copied relative path without applying the later record-path grammar.
4. `build/package-assembler.mjs:129-159` selects `profile-builders/funasr.mjs`; `build/profile-builders/common.mjs:26-29` calls `verifyInputManifest()` before staging or native compilation.
5. `build/locked-inputs.mjs:80-100` rejects any manifest record outside `^[A-Za-z0-9._/-]+$`.

The material consequence is mandatory and current: the first Chinese archive is not created, so the exact two-profile functional qualification, Qualification Set 2, and Branch Catalog Projection 2 cannot pass.

## Direct Evidence

- Reviewed source: `e133c4a7a73a5531c726ecb04461acb641461667`.
- API/E2E artifact commit: `8be597785b3bafdad6c28e5bcb95998b882b4975`.
- Production input manifest SHA-256: `45ebe9bfe4885fb3207c8c613ac76a5bbc439343ff6b93f0345082718e99515e`.
- Manifest records: `3,149`.
- Independent closure audit: all recorded bytes, sizes, modes, uniqueness, and exact tree closure match; no missing or extra paths.
- Rejected records: exactly ten pinned llama.cpp UI source files containing `(`, `)`, `[`, `]`, or `+`, all under `llama-cpp-source/tools/ui/src/routes/`.
- Exact production result: `Invalid input manifest record.` from `verifyInputManifest()` before CMake/native compilation or archive creation.

The evidence excludes corrupt bytes, dirty checkout, host state, permissions, corpus identity, provider/model selection, thresholds, performance, and user state as origins.

## Source-Review Gap

This was reasonably detectable as a source integration invariant even though the exact ten upstream filenames required actual checkout evidence:

- the materializer's Git-copy path accepts every ordinary Git file path;
- the manifest writer emits those paths without the consumer grammar;
- the mandatory verifier applies a narrower independent grammar later;
- existing `current-platform-contracts.test.mjs` composes the producer and verifier only with one simple repository-file fixture, not a production-shaped Git checkout or the current Chinese path set.

Therefore `CRR-023`'s API/E2E-readiness conclusion is superseded for this boundary. The exact upstream path population itself was not inferable from repository source alone, but the producer/consumer acceptance mismatch was.

## Required Correction Boundary

Reconcile materialization and verification under one explicit input-path contract so the reviewed current Chinese recipe cannot successfully emit a tree that its mandatory package consumer rejects. Preserve:

- exact checkout revision/tree authentication and deterministic provenance;
- containment, no-symlink, immutability, uniqueness, byte/size/mode, and complete-tree closure checks;
- the canonical Provider Archive 1 output-path policy (a separate boundary);
- the current provider/model/threshold/matrix, Seatbelt, qualification, and release ordering.

Do not silently rename or mutate locked upstream files. If the implementation chooses a deterministic build-source projection, that projection must be explicit and provenance-bound rather than an ad hoc omission. If it defines a broader safe input-path grammar, containment and alias/traversal rejection must remain fail closed. Add durable production-shaped coverage for the exact current Chinese path set plus negative unsafe-path cases, and prove the generated manifest passes the same production verifier used by package construction.

## Rerun Boundary

After source re-review, API/E2E should first revalidate both current input manifests if the shared input contract changed, then restart at canonical Chinese construction and complete double-build/reproducibility, 200-WAV and exact 30/30/100/lifecycle/resource/compliance qualification, Qualification Set 2, and Branch Catalog Projection 2. Existing complete English runtime evidence may be reused only after API/E2E proves the corrected source does not invalidate its relevant bytes or contract.
