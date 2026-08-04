# CRR-034 API-F-013 Failure-Origin Evidence

## Reviewed State

- Exact source: `af008705488a029b95007e25c7c00484387d3ffe`
- Authority: `SR-012`, `ARCH-REV-013 Pass`, `IR-022`, `CRR-033 Pass`
- Execution: `API-REV-015`
- Failure: `API-F-013`, `API-VOICE-004`

## Supported Reachability

The independent initiating action is the checked-in release workflow's supported `workflow_dispatch` operation `prequalify`. Its normal production qualification path is:

1. pass Functional Preflight 2;
2. construct and verify the exact current Chinese package;
3. execute the required cache procedure `sudo -n /usr/sbin/purge` before each cold attempt;
4. launch the public packaged provider under the pinned network-denied Seatbelt profile;
5. accept its bound `hello`, then require `inference-ready` within the 30,000-ms hard preparation deadline;
6. count every started attempt and fail closed on any timeout before QSet/projection/release.

`API-REV-015` followed that path. The failure is `Reachable` and represents approved behavior under `AC-003`, `AC-004`, `AC-017`, `AC-020`, and `AC-023`; it is not established by a synthetic test.

## Direct Execution Facts

- Actual MacBookPro18,4 / M1 Max / 64-GiB Functional Preflight 2 passed and classified the run `controlled` at `81.03166666666668%` average CPU idle.
- Two network-denied Chinese builds were byte-identical at SHA-256 `e867796b0b362f27e3800f593ffac1201e710d3f2b87af883cd1437660ad66c0` and passed package verification, reproducibility, and compliance.
- Cold attempts `0`–`20` succeeded; attempt `21` emitted valid `hello` in `943.550583` ms and then failed `READY_TIMEOUT` before `inference-ready`.
- The last five successful preparation samples were `21018.183084`, `21069.624541`, `23315.952083`, `26989.1635`, and `29460.149334` ms.
- The failed attempt's total wall time was `34884.236208` ms.
- All 22 cache-procedure executions completed and were recorded. The ledger and Summary agree on `fail / timeout`, `22 started / 21 succeeded / 1 failed / 1 timed out / 0 excluded`; Assessment binds the failed Summary as `controlled-miss`.
- The Chinese resource policy is not the failure: observed peak `3944415232` bytes is within the `4294967296`-byte hard ceiling. The 2.5-GiB optimization miss is separately observational.
- Post-failure evidence remained on AC, recorded no thermal/performance warning, showed normal memory pressure, and found no surviving task-owned process. This is not per-attempt storage/GPU/model-stage telemetry and therefore does not identify the slowdown cause.

## Prior-Run And Source Comparison

`API-REV-014` ran the same packaged runtime semantics and completed all 30 cold starts. Its cold-preparation p95/max were `10851.1535 / 21453.11775` ms. `API-REV-015` reached `26989.1635 / 29460.149334` ms across its 21 successful samples before the next attempt timed out.

The following package/runtime identities match exactly between API-REV-014 and API-REV-015:

- package, provider, and model IDs;
- `hostSha256 = a55737d7b758f72c375f0cb7ae92889681b76610f47406e456c8c58c362e3fc0`;
- `engineConfigurationSha256 = ad42cf319e1970e62594c1fe10b12ace2dcd8917755b8f38883ffedcc3c781ef`;
- `modelSha256 = 2d0eb9783bacb9603719f22db5bdedc9d124447025c30bb87c38a3c5c9edfa9c`;
- `launcherSha256 = 8e00c10bad094d90271800f36a2e592cd5200235a744627d2e588c98df110008`;
- `normalizerSha256 = ccf955183f8569c0dc3eda6e47df2a8dbc76f6eae354618643b6238874b9e7ec`;
- `protocolSha256 = 8ad5b79320f01bc2b01821b2a592b337f8b62521929adf0f4ad281b34cbb7b27`.

Between source `57efa584...` and `af008705...`, the following preparation/cold-runtime owners are unchanged:

- `benchmark/provider-process-session.mjs`;
- `benchmark/cache-procedure.mjs`;
- `benchmark/cache-procedures/darwin-arm64-filesystem-cold-v1.sh`;
- `launcher/internal/run.go`;
- `providers/chinese-funasr/src/main.cpp`;
- `providers/chinese-funasr/src/funasr_engine.cpp`;
- `providers/chinese-funasr/src/session.cpp`;
- `build/profile-builders/funasr.mjs`.

The changed runner hunks add qualification scoring/resource-policy selection and evidence binding. They do not change the cold loop, cache procedure, session start, provider preparation, shutdown, or 30,000-ms deadline.

## Failure-Origin Decision

- Invalid/stale test: rejected. The exact 30 cold attempts, zero timeouts, and 30,000-ms hard preparation deadline are explicit approved contracts.
- API/E2E environment/execution defect: not established. The required preflight, package, purge, invocation, retention, and cleanup paths passed. The current approved preflight does not observe the progressive cause, so an unmeasured host dimension would itself require an upstream qualification-contract decision.
- Bounded implementation defect: not established. Runtime bytes and cold-path source are unchanged from the complete prior run, and evidence does not isolate an incorrect cleanup, provider error, orphan, mutation, or protocol mechanism.
- Source-review gap in CRR-033: no. IR-022 changed scoring/policy authority, not the runtime preparation path, and existing direct API-REV-014 evidence had completed all 30 starts.
- Design/feasibility impact: confirmed. Original Fun-ASR operational evidence was first-ever and warm-cache isolated-process evidence, while the investigation explicitly recorded the exact 30 filesystem-cold packaged lifecycle as unknown. One later passing run did not establish repeatable cross-run stability; API-REV-015 now proves that the selected package plus prescribed cold procedure can cross the immutable deadline on an otherwise passing host.

## Required Upstream Decision

The Solution Designer must preserve the real failure and determine, with stage-level and per-attempt evidence, whether to:

1. retain the 30,000-ms hard deadline and design/prove a provider/package/host-control correction that meets it repeatably; or
2. revise the cold-trial deadline, cadence, or required preconditions consistently with product intent and repeatability.

No retry, exclusion, timeout relaxation, warm proxy, provider/model substitution, or post hoc reclassification is authorized. Any revised design must define the affected evidence/contracts/source inventory and return through Architecture Review, Implementation, source review, and complete two-profile API/E2E.

## Result

- New finding: `CR-F-033`.
- Classification: `Design Impact`.
- Recipient: `solution_designer`.
