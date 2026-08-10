# CRR-054 — API-F-019 Failure-Origin Evidence

## Reviewed subjects

- API/E2E revision: `API-REV-024` (`Fail / 84%`)
- Scenario/failure: `API-VOICE-018` / `API-F-019`
- Reviewed source: `97f3007c2a62e5f48acd5fcc8c26d1e38b099850`
- Reviewed implementation artifact: `2a4b2ef7eab573388390274b47e1de197fe02d3e`
- API/E2E evidence/report commit: `c5722696af92c2432b7c2e4396583ce73fc6bc53`

## Independent production reachability

`R-005`, `R-025`, and `AC-028` require a deterministic, verifiable Chinese Runtime Host Archive 2 for the exact current `chinese/darwin-arm64` entry. The approved operational path is:

`API-VOICE-018 / release host construction -> build/host-package-assembler.mjs -> build/profile-builders/funasr-host.mjs -> authenticated CMake configuration -> providers/chinese-funasr/CMakeLists.txt voice-provider-worker -> providers/chinese-funasr/src/session.cpp -> archive assembly`

API-REV-024 invoked that exact network-denied construction path with source `97f3007...`, the official locked toolchain, current authenticated inputs, and Host Source Closure `571191f217d16369b126edfd6944d622207cd32dc8aefedff0e8b9fb4d40de02`. It reached the production CMake target and failed compiling `session.cpp`. The failing test therefore reproduces an independently required production path; it does not establish its own reachability.

## Direct failure evidence

`api-e2e-evidence/api-rev-024/host-build/build-chinese-a.log` records Apple Clang rejecting:

- `session.cpp:44`: `std::string` descriptor SHA-256 compared directly with a `nlohmann::json` value;
- `session.cpp:45`: `std::string` activation SHA-256 compared directly with a `nlohmann::json` value;
- `session.cpp:52`: `std::string` model-file SHA-256 compared directly with a `nlohmann::json` value.

The source validates these JSON values as string-shaped SHA-256 values before use:

- line 42 validates `activationSha256` as a string matching the SHA-256 expression;
- line 43 applies `valid_sha()` to every expected digest;
- line 52 applies `valid_sha()` to each model-file digest.

The bounded correction is therefore typed extraction of each already-validated string before comparison. It must not relax schema/digest validation, compare serialized JSON, or add a compatibility path.

## Same-class source defect hidden by the first compiler failures

Source inspection found the same invalid comparison at `session.cpp:53`:

```cpp
sha256_bytes(rows.dump()+"\n") != session.activation.at("model").at("treeSha256")
```

To verify that this was not speculative, the reviewer copied `session.cpp` to `/tmp`, changed only the three compiler-reported comparisons to typed string extraction, and ran:

```text
xcrun clang++ -std=c++20 -Wall -Wextra -Werror \
  -Iproviders/chinese-funasr/src \
  -I/private/tmp/autobyteus-voice-api-e2e-r22-20260810-v2/inputs-r23-v1/chinese/llama-cpp-source/vendor \
  -fsyntax-only /tmp/session-crr054.cpp
```

The command exited `1` and then reported the line-53 expression as `invalid operands to binary expression ('std::string' ... and 'const ... nlohmann::basic_json<>')`. This fourth occurrence is on the same required production translation unit and must be corrected with the other three.

## Coverage gap and prior review gap

- `providers/chinese-funasr/CMakeLists.txt:21` places `session.cpp` in the production `voice-provider-worker` target with the complete worker translation set.
- `VOICE_PROVIDER_BUILD_TESTS` builds only normalization/result-policy coverage.
- `tests/build/chinese-preparation-runtime.test.mjs` compiles selected package-integrity/preparation components, not `session.cpp` or the complete worker.
- `tests/build/host-builder-composition.test.mjs` proves JavaScript builder/manifest/archive composition, not production native compilation.
- API-REV-024 therefore passes all repository gates (`93/93` Node, `7/7` Python, all Go/source/evidence, release `9/9`) while the mandatory production target does not compile.

The invalid string/JSON comparisons and the absence of compilation coverage for the production worker were source-visible in IR-031 and should have prevented the prior API/E2E-readiness conclusions. This is a source-review gap as well as an implementation defect.

## Classification and required correction

- Classification: `Local Fix`
- Owner: `implementation_engineer`
- Finding: `CR-F-047`
- Required correction:
  1. retain the strict JSON type/shape/SHA validation;
  2. extract the already-validated descriptor, activation, model-file, and model-tree digest values as `std::string` before comparing them to computed SHA-256 strings;
  3. add durable Apple-native coverage that compiles the complete production `voice-provider-worker` translation set (or the exact production CMake target) with the authenticated headers/toolchain and warnings-as-errors;
  4. preserve the current provider/model/archive/closure behavior without fallback or schema relaxation.

After source re-review passes, API/E2E must restart at canonical Chinese construction.
