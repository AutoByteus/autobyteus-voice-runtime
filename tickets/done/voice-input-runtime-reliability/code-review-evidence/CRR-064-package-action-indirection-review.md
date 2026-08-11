# CRR-064 Package Action Indirection Review Evidence

## Reviewed identities

- Base / `origin/main`: `27effcb6238b11ff3e41ad2473adf4e6d9fa6586`
- IR-039 source: `d334c474c264bb59594f5c03ef6246d71d87b707`
- IR-040 source: `a66a7eeb604a94445070b7573abe5a5d6238efc1`
- IR-040 artifact / reviewed HEAD: `908ebcb8505f3e3330ae9d5d15847deb616ffe63`
- Governing solution / architecture: `SR-025` / `ARCH-REV-025 Pass`
- Prior result: `CRR-063 Fail — Local Fix`, `CR-F-049`, `CR-F-050`

## Prior-finding verification

### CR-F-049 — Resolved

`tests/release/relevant-source-closure-v3.test.mjs` now supplies exact historical API-REV-025 subjects, expects `SOURCE_ADMISSION_BLOCKED`, reloads the durably written Admission 4 record, requires `focused-qualification-required`, retains both equal historical profile comparisons, and proves the current Host Package Input Contract source is focused-impact. This matches SR-025/AC-025's staged renewal boundary.

### CR-F-050 — Partially resolved, remains open

`build/host-package-input-contract.mjs:304-370` enumerates only YAML `run:` scalar lines. It now rejects the reviewer-injected direct second `npm install`, altered arguments, package-script indirection, and alternate manager, and derives the projection from the admitted exact command.

The supported GitHub Actions workflow also executes `uses:` steps. Policy 3 classifies `.github/workflows/**` as release-pipeline-only, so a later `R..W` workflow edit reaches the same approved maintained-main manual release and is supposed to be gated by Host Package Input Contract 1. The parser ignores all `uses:` identities and their `with:` executable scalar content. A production-shaped probe inserted, after source admission and before hosted tool selection/construction, an `actions/github-script@v7` step whose script invokes the exact reviewer second-install command. `HostPackageInputContract.assertCurrent()` accepted the workflow and still projected only `npm ci --ignore-scripts` plus declared `ajv: 8.20.0`.

This is package-manager indirection under the already confirmed `MP-AR-025B` contract. The probe reproduces the implementation gap; reachability comes independently from the approved `F -> D -> R -> W` maintained-main workflow lifecycle and the workflow's supported execution of `uses:` steps.

See `crr-064/workflow-package-manager-probes.json`.

## Reviewer execution

| Command                                                                                                                                                                                                 | Result                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `node --test tests/build/host-package-input-contract.test.mjs tests/build/host-source-closure.test.mjs tests/release/host-release-contracts.test.mjs tests/release/relevant-source-closure-v3.test.mjs` | Pass, `18/18`                                                                         |
| `npm run check:release-pipeline`                                                                                                                                                                        | Pass, `22/22`                                                                         |
| `VOICE_GO=/private/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go npm run check`                                                                                                                            | Pass: `112/112` Node TAP, `7/7` Python plus compileall, all Go/source/evidence checks |
| Changed-file Prettier                                                                                                                                                                                   | Pass                                                                                  |
| `git diff --check d334c47...a66a7ee`                                                                                                                                                                    | Pass                                                                                  |
| Direct second-install probe                                                                                                                                                                             | Rejected as required                                                                  |
| Equivalent `uses:` action install-indirection probe                                                                                                                                                     | Accepted incorrectly with unchanged projection                                        |

Raw logs and checksums are under `code-review-evidence/crr-064/`.

## Source size

- `.github/workflows/release-voice-runtime.yml`: 212 effective non-empty lines.
- `build/host-package-input-contract.mjs`: 461 effective non-empty lines, below the 500 hard limit but under substantial size pressure. Its single semantic-contract responsibility remains cohesive. Any further correction must remain below the hard limit or extract a cohesive private workflow-semantic helper while keeping the public contract facade authoritative and closure-binding the helper source.

## Conclusion

`Fail — Local Fix`. `CR-F-049` is resolved. `CR-F-050` remains because the sole owner closes direct `run:` package-manager commands but not equivalent executable action indirection. The bounded correction should validate executable workflow-step semantics, reject an additional unreviewed `uses:` action capable of package/workspace mutation before construction, add the exact negative, preserve metadata-only equality, and avoid a raw workflow hash or parallel validator.
