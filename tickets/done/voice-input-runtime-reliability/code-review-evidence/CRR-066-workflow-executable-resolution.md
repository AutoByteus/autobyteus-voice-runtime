# CRR-066 Workflow Executable Resolution Evidence

## Reviewed identities

- Base / `origin/main`: `27effcb6238b11ff3e41ad2473adf4e6d9fa6586`
- IR-041 source: `447d34148500ef56aad94a62da215e7f3066e2b6`
- IR-042 source: `77092392ce565f887c4698a3a12f384ea41b5e02`
- IR-042 artifact / reviewed HEAD: `7cf0dc5d2a4f3d271436bd97e5ee3bd5f5286203`
- Governing solution / architecture: `SR-025` / `ARCH-REV-025 Pass`
- Prior result: `CRR-065 Fail — Local Fix`; `CR-F-049` resolved, `CR-F-050` open

## Prior-finding verification

### CR-F-049 — Resolved / unchanged

The actual-current Admission 4 regression still requires `focused-qualification-required`, retains API-REV-025 only as immutable historical comparison input, and all required repository gates pass.

### CR-F-050 — Resolved

`build/workflow-executable-surface.mjs` now parses the one canonical job step list completely rather than discovering only selected `run:` or block-action lines. Every step must:

- use a canonical block-map representation;
- select exactly one `run` or `uses` execution mechanism;
- expose only the reviewed fields;
- participate in the exact ordered action or run projection.

The action projection closes exact identity, step ID, condition, and inputs. The run projection closes exact step ID, condition, continuation state, and environment. Workflow/job defaults and per-step shell selection reject before admission. The helper remains imported only by the sole public Host Package Input Contract and its bytes remain bound in Host Source Closure 1.

The exact CRR-065 actionlint-valid flow-style `actions/github-script@v7` install and custom-shell install probes now reject. Reviewer extensions also prove an actionlint-valid job-default shell and an added canonical run step reject. The original block-action negative still rejects, while the existing metadata-only equality test passes.

Reachability remains grounded in confirmed `MP-AR-025B`: the supported maintained-main manual release executes this workflow after the reviewed `F -> D -> R -> W` chain. No new material premise was needed.

## Reviewer execution

| Command / probe                                  | Result                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Focused contract/closure/release/admission tests | Pass, `18/18`                                                                         |
| `npm run check:release-pipeline`                 | Pass, `22/22`                                                                         |
| Pinned-Go `npm run check`                        | Pass: `112/112` Node TAP, `7/7` Python plus compileall, all Go/source/evidence checks |
| Changed-file Prettier and source diff check      | Pass                                                                                  |
| Current workflow `actionlint`                    | Pass                                                                                  |
| Exact canonical block-action install             | Rejected                                                                              |
| CRR-065 flow-style action install                | Rejected as noncanonical block map; `actionlint` confirms valid workflow syntax       |
| CRR-065 custom-shell install                     | Rejected at shell selection; `actionlint` confirms valid workflow syntax              |
| Job-default custom shell                         | Rejected at shell selection; `actionlint` confirms valid workflow syntax              |
| Added canonical run step                         | Rejected at exact run surface; `actionlint` confirms valid workflow syntax            |

Raw logs, patches, probe results, and checksums are under `code-review-evidence/crr-066/`.

## Source structure

- `build/host-package-input-contract.mjs`: 413 effective non-empty lines; cohesive public facade and below the 500 hard limit.
- `build/workflow-executable-surface.mjs`: 283 effective non-empty lines; the `>220` audit is triggered, but the file owns one cohesive private concern—strict parsing and projection of the hosted workflow executable step surface. It has no second public authority or unrelated release behavior.
- `build/host-source-closure.mjs`: 170 effective non-empty lines and binds the helper's ordinary-file identity.

## Conclusion

`Pass`. `CR-F-049` remains resolved and `CR-F-050` is resolved. The single public semantic boundary, private closure-bound helper, fail-closed executable representation, metadata neutrality, focused-renewal truth, and clean stale-authority removal now align with SR-025/ARCH-REV-025. API/E2E may resume the focused authority renewal and exact-six promotion scope; this result authorizes no release or publication work.
