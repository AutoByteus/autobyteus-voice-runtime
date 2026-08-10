# v1.0.0 Standard-Hosted Release Failure — Run 31420271551

- Date: 2026-08-10
- Repository: `AutoByteus/autobyteus-voice-runtime`
- Exact maintained-main/workflow checkout W: `743597440277e39155b059a475d6820ddc9ff831`
- Workflow: `Voice runtime host release`
- Run: https://github.com/AutoByteus/autobyteus-voice-runtime/actions/runs/31420271551
- Conclusion: `failure`

## Passed boundary

The default-branch checkout, Node 22.23.1 setup, Go 1.26.5 setup, exact-main
check, tag/release absence check, dependency installation, 19/19 focused
release-pipeline tests, and committed Admission 4 lineage verification passed.

## Direct failure

`Capture hosted authority and hydrate host-only inputs` stopped before input
hydration with:

`Error: Standard host tool version lock mismatch.`

The production owner `build/host-build-environment.mjs` requires Node
22.23.1, CMake 4.2.0, Xcode 26.1.1, and macOS SDK 26.1. The actual GitHub
runner image was `macos-26-arm64` version `20260728.0273.1`. Its official
included-software manifest identifies CMake 4.4.0 and default Xcode 26.6 with
macOS SDK 26.5; Xcode 26.1.1/SDK 26.1 remains installed but is not selected by
the workflow. Included-software source:
https://github.com/actions/runner-images/blob/macos-26-arm64/20260728.0273/images/macos/macos-26-arm64-Readme.md

The source throws before writing the requested host-build environment record,
so the always-run audit upload also failed because the audit directory was
empty. No host input was hydrated, no archive was built, and no profile,
product, provider, inference, corpus, performance, or model-weight work ran.

## Publication state

The build, composition, publish, and download-verification steps were skipped.
No `v1.0.0` tag, GitHub Release, release asset, or publication was created.
User-owned untracked main-checkout paths remain preserved.

## Classification and route

`Local Fix / release-host tool selection and early failure evidence` to
`implementation_engineer`.

The implementation must select/provision the exact reviewed toolchain on the
standard hosted runner (including explicit Xcode/SDK selection and exact CMake)
and ensure the audit directory receives truthful early-failure evidence. The
change must pass source review and applicable API/E2E validation before Delivery
retries. Do not relabel this historical run or bypass the lock.
