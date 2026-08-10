# AutoByteus Voice Input Runtime v1.0.0

## macOS Apple Silicon runtime hosts

- Adds two deterministic, relocatable Runtime Host Archive 2 packages for the exact current matrix: English and Chinese on `darwin-arm64`.
- English uses MLX Whisper Small FP16; Chinese uses the native Fun-ASR-Nano GGUF Q8 provider.
- Host archives contain the launcher, model manager, provider engine, pinned runtime dependencies, Host Source Closure 1, and Model Admission Root 1—but no model weights.
- `auto`, macOS Intel, Linux, Windows, and desktop integration remain deferred.

## Explicit on-demand model installation

- Adds the public `voice-model-manager` install/status/remove lifecycle.
- Downloads only the exact host-admitted immutable model files after an explicit install request; release CI neither downloads nor republishes weights.
- Verifies catalog, manifest, compatibility, sizes, SHA-256 values, and model-tree identity before atomic Store 1 activation.
- Supports bounded progress, cancellation, authenticated resume, idempotent repeat installation, status snapshots, safe removal, and provider lease protection.
- Provider execution remains offline and fail-closed through Session Config 2 and Protocol 1.

## Validation and release assets

- API-REV-025 passed at 97% confidence with two exact-equal host builds per profile, independent host verification, real public model installation, Store 1 lifecycle coverage, relocated offline retained-clip inference, execution-closure reuse, focused aggregation, and nonpublishing prepublication sealing.
- The prospective GitHub Release contains exactly nine assets: two host archives, two model manifests, Catalog 4, Release Qualification Evidence 4, Pre-Tag Release Manifest 4, `THIRD_PARTY_NOTICES.json`, and `release-SHA256SUMS.txt`.
- Model weights and product/performance qualification are not part of release CI.

## Release integrity

- The reviewed acyclic F/D/R/W release-authority chain admits the exact API/E2E-qualified source while allowing later documentation-only integration under closed Policy 3 classification.
- Release CI runs on a standard GitHub-hosted macOS runner and performs host-only construction, archive equality, exact nine-asset sealing, publication, and downloaded-byte verification.
- Release CI does not repeat product/profile/performance qualification and does not download model weights.
