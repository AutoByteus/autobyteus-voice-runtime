# CRR-013 Thermal Parser Resolution Evidence

## Finding recheck

`CR-F-020` / `API-F-001` is resolved in source commit `23d766873fa1be357c657fab8203913fec09e65b`.

- `benchmark/darwin-arm64-runner-preflight.mjs` no longer contains the bare-word warning predicate.
- It delegates to `parseDarwinThermalState()` and sets `thermalNormal=true` only for the closed `normal` classification.
- `benchmark/darwin-thermal-state.mjs` accepts only the established three-line healthy state, reports explicit thermal/performance/CPU-limit state as `warning`, and reports all other or malformed input as `unrecognized`.
- Both `warning` and `unrecognized` remain non-normal in production.

## Captured-output identity

The durable fixture and API-REV-003 actual output are byte-identical:

```text
96de6076213225f787270bff80efd2011e0ad142953c37697dc547f77d302892  tests/fixtures/pmset-therm/healthy.txt
96de6076213225f787270bff80efd2011e0ad142953c37697dc547f77d302892  api-e2e-evidence/api-rev-003/environment/pmset-therm.actual.txt
```

Focused durable tests passed `3/3` for the healthy state, affirmative thermal/performance/CPU-limit warnings, and empty/vague/partial/non-string states.

## Focused production integration

The reviewer ran the current production preflight on the actual M1 with an owned `caffeinate` process. The resulting schema-valid record is retained at `CRR-013-focused-preflight.json`.

Observed power fields:

```json
{
  "acConnected": false,
  "lowPowerModeOff": true,
  "caffeinateActive": true,
  "thermalNormal": true,
  "memoryPressureNormal": true
}
```

The preflight still exited blocked with `runner-power-or-pressure` because the host remained on Battery Power. This is the intended independent `AC-020` gate. The owned `caffeinate` process was killed and reaped; no owned process remains. Purge permission was not modified or bypassed.

## Reviewer checks

- Focused thermal coverage: `3/3` passed.
- Full `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check`: `60/60` Node, `7/7` Python plus compileall, all Go/source/schema/evidence checks passed.
- Verified-root Go race, vet, and formatting checks passed.
- Original selection-study checksums: `191/191` passed.
- Repository JSON parse sweep: `207/207` passed.
- Focused Prettier and source-delta `git diff --check` passed.
