# CRR-063 Host Package Input Source Review Evidence

## Reviewed identities

- Base / current `origin/main`: `27effcb6238b11ff3e41ad2473adf4e6d9fa6586`
- Implementation source: `d334c474c264bb59594f5c03ef6246d71d87b707`
- Implementation artifact / reviewed HEAD: `d51536be29f72a486000a52ce0d7054da798e045`
- Solution / architecture: `SR-025` / `ARCH-REV-025 Pass`
- Delivery trigger: `DR-012`, hosted run `31425696064`

The source commit changes 21 paths (`1,530` insertions, `1,497` deletions). It adds the Host Package Input Contract owner, changes Host Source Closure/controller/assembler/verifier/schema/test subjects, and removes the exact six stale `release/admission/v1.0.0-*` authorities. The artifact commit changes only the implementation handoff and implementation revision record.

## Source observations

1. `build/host-package-input-contract.mjs:295-325` searches the whole workflow text for one `npm ci --ignore-scripts` substring, rejects only `npm run build:host`, `npm exec`, and `npx`, and separately checks one controller literal/argument-name list. It does not reject another `npm install`, another package manager operation, or additional install arguments.
2. The contract emits the hard-coded `installArguments: ["ci", "--ignore-scripts"]` projection at lines 258-292 rather than deriving it from one exhaustively validated install command.
3. A production-shaped probe copied the real workflow/DR-012 package-lock/environment inputs, inserted `npm install --ignore-scripts --no-save ajv@8.19.0` after the real hydration command, and called the production `HostPackageInputContract.assertCurrent()`. The contract accepted the workflow and still projected `ajv: 8.20.0` plus only `npm ci --ignore-scripts`. See `crr-063/workflow-second-install-probe.json`.
4. `tests/release/relevant-source-closure-v3.test.mjs:256-311` still asserts that actual current `F..D` accepts the five API-REV-025 authorities. SR-025/AC-025 makes those files historical replacement inputs and requires focused renewal. The current production assembler correctly returns `focused-qualification-required`, so the stale assertion fails.

The workflow-semantic scenario is governed by confirmed architecture premise `MP-AR-025B`: supported maintained-main release workflow changes proceed through the manual standard-hosted release, and the Host Package Input Contract must close actual package installation/invocation semantics before construction. This is not inferred from the probe; the probe only reproduces the already-established contract path.

## Reviewer execution

| Command                                                                                                                                                                                                     | Result                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `node --test tests/build/host-package-input-contract.test.mjs tests/build/host-source-closure.test.mjs tests/release/host-release-contracts.test.mjs`                                                       | Pass, `12/12`                                                                                          |
| `node tooling/check-release-pipeline.mjs && node --test tests/build/host-package-input-contract.test.mjs tests/build/host-source-closure.test.mjs tests/release/release-source-admission-verifier.test.mjs` | Pass, `13/13`                                                                                          |
| `npm run check:release-pipeline`                                                                                                                                                                            | Fail, `21/22`; stale actual-current Admission 4 assertion blocks with `focused-qualification-required` |
| `VOICE_GO=/private/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go npm run check`                                                                                                                                | Fail, `111/112` Node TAP; Python `7/7`, compileall, Go/source/evidence portions pass                   |
| Changed-file Prettier                                                                                                                                                                                       | Pass                                                                                                   |
| `git diff --check 27effcb... d334c47...`                                                                                                                                                                    | Pass                                                                                                   |

Raw logs and their checksum list are under `code-review-evidence/crr-063/`.

## Changed source size audit

| Path                                    | Effective non-empty lines | Assessment                                                                                                                                  |
| --------------------------------------- | ------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `build/host-package-input-contract.mjs` |                       416 | Below 500; over 220 triggers SoC review. The single semantic-contract responsibility is cohesive, but the workflow validator is incomplete. |
| `build/host-package-assembler.mjs`      |                       226 | Below 500; over 220 reviewed and cohesive.                                                                                                  |
| `build/host-package-verifier.mjs`       |                       126 | Pass.                                                                                                                                       |
| `build/host-source-closure.mjs`         |                       169 | Pass.                                                                                                                                       |
| `release/run-host-construction.mjs`     |                       236 | Below 500; over 220 reviewed and cohesive.                                                                                                  |
| `tooling/check-release-pipeline.mjs`    |                        66 | Pass.                                                                                                                                       |

## Conclusion

`Fail — Local Fix`. `CR-F-049` requires replacing the stale API-REV-025/current-source acceptance assertion with the truthful staged focused-renewal boundary and restoring both required repository gates. `CR-F-050` requires the sole semantic owner to validate the actual package-manager install surface exhaustively and add the missing second-install/argument negatives without restoring raw workflow/package hashing.
