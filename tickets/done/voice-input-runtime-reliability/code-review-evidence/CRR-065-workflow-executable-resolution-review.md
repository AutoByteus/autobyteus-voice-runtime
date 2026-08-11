# CRR-065 Workflow Executable Resolution Review Evidence

## Reviewed identities

- Base / `origin/main`: `27effcb6238b11ff3e41ad2473adf4e6d9fa6586`
- IR-039 source: `d334c474c264bb59594f5c03ef6246d71d87b707`
- IR-040 source: `a66a7eeb604a94445070b7573abe5a5d6238efc1`
- IR-041 source: `447d34148500ef56aad94a62da215e7f3066e2b6`
- IR-041 artifact / reviewed HEAD: `847b5fa726017078219533512c6188559c31eebd`
- Governing solution / architecture: `SR-025` / `ARCH-REV-025 Pass`
- Prior result: `CRR-064 Fail — Local Fix`; `CR-F-049` resolved, `CR-F-050` open

## Prior-finding verification

### CR-F-049 — Resolved / unchanged

The actual-current Admission 4 regression still requires `focused-qualification-required`, retains the exact historical API-REV-025 subjects only as historical comparison inputs, and all required gates pass.

### CR-F-050 — Improved, but remains open

IR-041 correctly extracts a private closure-bound workflow helper, preserves one public Host Package Input Contract owner, rejects the exact block-style `actions/github-script@v7` negative, admits only the four current block-style actions with exact semantic fields, and keeps non-executable name/comment metadata neutral. The helper source is present in Host Source Closure 1.

The parser does not enumerate the complete supported executable workflow surface:

1. `workflowActionSteps()` recognizes step starts only when they match the canonical block form `^ {6}- [A-Za-z0-9_-]+:`. A valid YAML flow-style step containing the same `actions/github-script@v7` install script is not recognized. `actionlint -ignore SC2251` accepts the production-shaped workflow, while `HostPackageInputContract.assertCurrent()` accepts it and returns the unchanged `npm ci --ignore-scripts` projection.
2. GitHub Actions supports a per-step custom `shell` command and substitutes the temporary script at `{0}`. A production-shaped `hosted_toolchain` step with a custom shell that first runs `npm install --ignore-scripts --no-save ajv@8.19.0` is accepted by `actionlint` and by the contract with the unchanged projection. The shell executes after source admission and before Host Package Input Contract evaluation/construction.

The first probe is the same action-indirection defect from CRR-064 expressed in another valid YAML representation. The second corroborates that line-oriented `run:` plus canonical-block `uses:` enumeration is not a complete semantic boundary for supported executable step forms. GitHub's governing workflow syntax documents YAML workflows, action steps, and custom per-step/default shells: <https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax>.

Reachability remains independently established by confirmed `MP-AR-025B`: API/E2E promotes `R`, Delivery integrates `W`, Policy 3 classifies workflow-only changes as release-only, and the supported maintained-main manual dispatch executes these workflow step semantics before construction. The probes reproduce the gap; they do not establish the product path.

See `crr-065/workflow-executable-probes.json`, both patches, and `actionlint-probes.log`.

## Reviewer execution

| Command / probe                                   | Result                                                                                    |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Focused contract/closure/release/admission tests  | Pass, `18/18`                                                                             |
| `npm run check:release-pipeline`                  | Pass, `22/22`                                                                             |
| Pinned-Go `npm run check`                         | Pass: `112/112` Node TAP, `7/7` Python plus compileall, all Go/source/evidence checks     |
| Changed-file Prettier and source diff check       | Pass                                                                                      |
| Exact IR-041 block-style reviewer action negative | Rejected as required                                                                      |
| Equivalent flow-style action negative             | **Accepted incorrectly** with unchanged install projection; `actionlint` accepts workflow |
| Supported custom-shell install indirection        | **Accepted incorrectly** with unchanged install projection; `actionlint` accepts workflow |

Raw logs and checksum manifest are under `code-review-evidence/crr-065/`.

## Source structure

- `build/host-package-input-contract.mjs`: 413 effective non-empty lines. It remains a cohesive public semantic facade and is below the hard limit.
- `build/workflow-executable-surface.mjs`: 176 effective non-empty lines. Extraction is cohesive and closure-bound, but its regex-defined input subset is not the full supported workflow execution surface.
- `build/host-source-closure.mjs`: 170 effective non-empty lines and binds the helper's ordinary-file identity.

## Conclusion

`Fail — Local Fix`. `CR-F-049` remains resolved. `CR-F-050` is improved but not resolved because semantically equivalent supported workflow forms can still perform an undeclared install while the sole authority emits the unchanged admitted projection. Keep the single public owner and private helper, but parse the workflow structurally or fail closed on every noncanonical executable form; cover at least the accepted flow-style action and custom-shell cases without raw-hashing unrelated metadata.
