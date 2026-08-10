# v1.0.0 Standard-Hosted Release Failure — Run 31425696064

- Date: 2026-08-10
- Repository: `AutoByteus/autobyteus-voice-runtime`
- Exact maintained-main/workflow checkout W: `cba7445597368d1e88c386efd1be62304dcf1bd3`
- Run: https://github.com/AutoByteus/autobyteus-voice-runtime/actions/runs/31425696064
- Conclusion: `failure`

## Passed boundary

Checkout, audit initialization, exact Node and Go setup, the 22/22 focused
source/admission gate, exact Xcode 26.1.1/SDK 26.1/CMake 4.2.0 selection, Host
Build Environment 2 capture, and host-only input hydration all passed.

## Direct failure

Host construction failed closed before compiling either archive:

- message: `Hosted Host Source Closure differs from admission.`
- code: `SOURCE_ADMISSION_BLOCKED`
- admitted English Host Source Closure SHA-256:
  `d7cfe1ffad1c385492ae6e41283de598b4381b332c435cc2ee215c8b93768134`
- actual hosted English prebuild closure SHA-256:
  `4f46c2842d6ffb6cc2e18bb6a09eb9ff372d1ef4873d058fc3a2a3fa5e26eacf`

A byte-level comparison of the old admitted closure and the hosted closure
contains exactly one changed repository-file identity: `package.json`. The
change is the release-check command's test owner name from
`relevant-source-closure-v2.test.mjs` to
`relevant-source-closure-v3.test.mjs`, introduced between focused source F and
admitted source D. All toolchain and materialized host-input identities in the
English closure are equal. Chinese closure derivation/build was not attempted
after the English fail-closed decision.

This exposes an authority-design inconsistency: Policy 3 admits the
`package.json` change as release-only/reuse-permitted, while Host Source Closure
1 hashes the complete `package.json` and therefore rejects it as host-impacting.
Delivery cannot choose whether to narrow Host Source Closure, regenerate host
qualification/admission, or restructure the package script without an
explicit design decision.

## Audit and publication state

The new audit owner worked as designed. The retained terminal audit records
host construction `failure` and composition/publication/verification/quarantine
as skipped. No archive was built, no model weight was downloaded, and no tag,
release, or asset was created.

## Classification and route

`Design Impact / Policy 3 versus Host Source Closure authority inconsistency`
to `solution_designer`.

Resolve the authoritative treatment of `package.json`, then route through
implementation, source review, and applicable API/E2E before Delivery retries.
Do not relabel this historical failed run and do not bypass the fail-closed
closure check.
