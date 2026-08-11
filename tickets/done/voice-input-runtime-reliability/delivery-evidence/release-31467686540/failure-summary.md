# v1.0.0 Standard-Hosted Release Failure — Run 31467686540

- Date: 2026-08-11
- Workflow: `Voice runtime host release`
- Run: `31467686540`
- Exact maintained-main checkout: `34db749f543609fd397e25f08102c790eca568de`
- Result: `Fail closed` during **Build and independently verify exact runtime hosts**.
- Release state: `v1.0.0` tag absent; GitHub release absent; composition, publication, downloaded-byte verification, and quarantine were unattempted.

## Passing gates

Checkout, Node/Go setup, Release Admission Verification 1, exact hosted toolchain selection, and host-only input hydration all succeeded. Admission verified `F = D`, exact R ancestry/protected authorities, `reuse-permitted`, and equal English/Chinese focused/admitted/workflow Host Source Closures. No model weights, product/profile/corpus/performance qualification, inference, desktop action, or user/shared-state action occurred.

## Exact failure

- Chinese hosted archive matched the renewed focused authority exactly: `b12e5669de17b86299e5b7a3d078a85bea3ab396da33e38e291b3d239c8e63df`.
- English descriptor identity and entry count matched, but its hosted archive and file-manifest identities did not:
  - expected archive SHA-256: `9d7d7b501229e85fc2ad54996f716d79eb59077a56c30ce3ce580c619fbcdc4a`
  - hosted archive SHA-256: `0910bdd7946bf59563bf09f62964149e1f556b253eadd83bb96cc25ed8ec204e`
  - expected file-manifest SHA-256: `b45187206bbfa7ded2d806c2605f8b186efa28dfb66dde860ca8f9f405bd5433`
  - hosted file-manifest SHA-256: `22f545dd38e255d25e020815b07c6e25d587f24655caa2a3e6ddf3774c3fc04d`
  - expected/hosted extracted size: `723,873,712 / 723,873,277` bytes (hosted is 435 bytes smaller)
  - both entry counts: `6,503`
  - both descriptor SHA-256 values: `e6b46a9445d2268f0d82deb506d0d7b993c4eca89aa163ffd16c0a364b202f2a`
- The production owner rejected the mismatch with `Hosted host differs from focused host authority.`

## Classification and routing

`Unclear / release-blocking build reproducibility failure.` The retained audit proves the production guard behaved correctly, but it does not retain the two English file manifests or archives needed to identify the differing members. Delivery must not weaken equality, regenerate authority, retry, tag, or publish. Route the cumulative package to Code Reviewer for failure-origin determination and then to the appropriate Implementation or Solution owner.
