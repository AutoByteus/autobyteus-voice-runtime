# CRR-055 — Chinese Worker Compilation Resolution Evidence

## Reviewed subjects

- Solution/design authority: `SR-021` / `ARCH-REV-021 Pass`
- Implementation revision: `IR-035`
- Source commit: `b88c230663eb96e0def8c869b095ea858b0ff50b`
- Implementation artifact HEAD: `5a2ec1b95536e8490d00e0359ff75e74f199d8f0`
- Triggering review/failure: `CRR-054`, `CR-F-047`, `API-REV-024`, `API-F-019`

## Source correction

`providers/chinese-funasr/src/session.cpp` retains the prior strict object, type, SHA-256 expression, activation, mode, size, containment, and closure checks. It now extracts the four already-validated digest subjects before comparing them to computed `std::string` values:

- expected host descriptor -> `descriptor_sha256`;
- Session Config 2 activation -> `activation_sha256`;
- each model-file record -> `file_sha256`;
- activation-bound model tree -> `tree_sha256`.

No computed digest is compared directly with a JSON value. The Chinese Host Build Input Recipe 2 records the corrected source exactly:

```text
sizeBytes: 10253
sha256: 98960e0c4abef6daa06b3606e8fd3a4871a5d84519de3807b7138b2bd4088e59
```

Reviewer recomputation matched both values.

## Durable coverage assessment

`tests/build/chinese-worker-native-compile.test.mjs`:

1. derives the ordered `voice-provider-worker` translation set from the real production CMake target and compares it with the exact expected ten C++ units plus utf8proc C;
2. requires the production `-Wall -Wextra -Werror` policy;
3. authenticates a minimal deterministic fixture by one hard-coded manifest SHA-256, archive size/SHA-256, exact file set, per-file size/SHA-256/Git-blob identity, and the current recipe's llama.cpp/utf8proc revision/tree subjects;
4. authenticates the live Xcode version, clang++ invocation target digest, SDK version, and SDK settings digest against the current recipe/fixture authority;
5. performs `-fsyntax-only` compilation for every production C++ translation unit and the exact utf8proc C unit with the current Apple target/SDK, locked headers, production feature definitions, and warnings-as-errors;
6. runs only for the sole current production target, `darwin-arm64`, and produced no skip in the reviewed environment.

The reviewer independently extracted the fixture and compared all eleven files byte-for-byte with the exact API-REV-024 authenticated/materialized llama.cpp and utf8proc trees under `/private/tmp/autobyteus-voice-api-e2e-r22-20260810-v2/inputs-r24-v1/chinese`; all `11/11` matched. The fixture is therefore not a synthetic substitute for the header/type boundary that produced API-F-019.

The test intentionally compile-closes translation units rather than claiming a link, archive, or provider result. Actual CMake link and package construction remain API/E2E responsibilities.

## Reviewer-executed checks

- `node --test tests/build/chinese-worker-native-compile.test.mjs` -> `1/1 Pass`, `0` skipped.
- `npm run check:release-pipeline` -> `9/9 Pass`.
- `VOICE_GO=/private/tmp/autobyteus-go1.26.5-sr021-v2/go/bin/go npm run check` -> `94/94` Node TAP, `7/7` Python plus compileall, all Go/source/evidence checks Pass, `0` skipped.
- Chinese recipe size/SHA binding -> exact Pass.
- Fixture archive/file identities -> exact Pass; API-REV-024 materialized byte comparison `11/11 Pass`.
- `git diff --check` -> Pass.
- Changed JSON/Node/Markdown Prettier checks -> Pass. C++ is outside Prettier's parser scope.

## Prior finding resolution

`CR-F-047` is resolved at source and durable-coverage boundaries. The correction is bounded, preserves approved behavior, adds no fallback or compatibility branch, and requires API/E2E to restart at the exact canonical Chinese construction command.
