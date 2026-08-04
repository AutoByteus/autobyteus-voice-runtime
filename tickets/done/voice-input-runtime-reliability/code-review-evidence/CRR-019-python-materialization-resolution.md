# CRR-019 Resolution Evidence — CR-F-023

## Result

- Finding: `CR-F-023`
- Trigger: `CRR-018` / `API-F-003` / `API-VOICE-003`
- Implementation: `IR-015`, source `24a994a51256f0eef5840ecdc977febec71ea491`
- Result: `Resolved`

## Production Path And Ownership

The supported path remains:

`workflow_dispatch prequalify -> Functional Preflight 2 -> closed English inputs -> outside native authorization -> network-denied package assembler -> MLX builder -> Python runtime materializer -> symlink-free stage/archive`.

IR-015 adds one archive-specific owner at the Python materializer boundary. Callers still receive only a normalized ordinary-file tree, and the shared `regularFiles()` owner remains strict. No alternate provider, input, archive, package, or runtime path was added.

## Source Verification

- `build/python/archive-link-normalization.mjs` keys the approved nine-link layout to the exact current archive SHA-256 `62aeee6161d57303a71a138b75fd5cc6fb8c89c4b1d9c7f0a052d89fa0b6652b` and target `darwin-arm64`.
- It walks the extracted root without following links, rejects special entries, resolves each link with containment/cycle/dangling/regular-target checks, and compares the complete sorted observed link topology one-for-one with the approved layout.
- It removes every link, renames the validated `bin/python3.12` target to ordinary executable `bin/python3`, removes unused alias targets, then rechecks that the tree has no links and that `bin/python3` is a regular executable.
- `build/python/materialize-runtime.mjs` invokes normalization immediately after authenticated extraction and before any generic traversal or interpreter execution. It uses `lstat()` for the executable and retains the shared strict `regularFiles()` calls.
- Runtime pruning keeps only `bin/python3`, removes generated console wrappers and `.dist-info/RECORD` files that encode root-dependent wrapper hashes, preserves `.dist-info/METADATA` for exact distribution verification, and rejects retained files containing the temporary runtime root.
- Package assembly continues to declare only `host/python/bin/python3` as the Python private executable, so removed console aliases are not runtime entrypoints.

## Reviewer Execution

1. `node --test tests/build/python-archive-link-normalization.test.mjs tests/build/locked-inputs.test.mjs`
   - `20` TAP tests observed: `18` pass, `2` unrelated Go-environment skips because `VOICE_GO` was omitted.
   - The new archive suite itself passed `9/9`, including absolute, escaping, dangling, cyclic, unexpected, missing, and special-entry rejection.
2. `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check`
   - Pass: `69/69` top-level Node cases / `76/76` TAP tests, `7/7` Python tests plus compileall, all Go/source/schema/evidence checks, and byte-identical English-v2 reproduction.
3. Narrow real-input materializer check against the retained exact API-REV-006 English input tree and current IR-015 source:
   - final ordinary-file count: `18,978`;
   - only `bin/python3` remains under `bin/`;
   - `.dist-info/RECORD` count: `0`;
   - pre/post-relocation tree digest: `65150bfe112e0fef4313270a9aebcd77b2dd14721dce0105a090380df4934094` both times;
   - relocated `bin/python3 -I -c 'import mlx_whisper; print("ready")'`: stdout `ready`, empty stderr.
4. `git diff --exit-code 24a994a51256f0eef5840ecdc977febec71ea491..HEAD -- build/python tests/build/python-archive-link-normalization.test.mjs`
   - Pass: current source/test bytes match the claimed source commit.

The reviewer real-input check is deliberately materializer-scoped, not a claim that the full Seatbelt Provider Archive command, inference, or qualification passed. API/E2E must rerun those boundaries.

## Resolution Decision

`CR-F-023` is resolved. The exact authenticated archive can now be transformed into the required symlink-free contained runtime without weakening global/final link rejection. The additional console-wrapper/RECORD cleanup is necessary for the same approved reproducibility and relocatability invariant, is confined to the materializer owner, and does not change the public runtime contract.

`CR-F-022` remains resolved and unchanged.
