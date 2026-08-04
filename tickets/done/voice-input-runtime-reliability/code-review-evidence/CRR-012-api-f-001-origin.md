# CRR-012 API-F-001 Failure-Origin Evidence

## Confirmed source origin

- Reviewed source commit: `b7342bc8e06d587bfe640faa4209c62ac2f4bae9`
- Production source: `benchmark/darwin-arm64-runner-preflight.mjs`
- Observed/recomputed source SHA-256: `4154f2d138626c783125d4250aa473283dc649ccf9a5fa574a05286ff8f552df`
- Affected production predicate:

```js
!/(warning|performance warning|CPU_Speed_Limit\s+[0-9](?!00))/i.test(thermal);
```

The actual reference-host `/usr/bin/pmset -g therm` output is:

```text
Note: No thermal warning level has been recorded
Note: No performance warning level has been recorded
Note: No CPU power status has been recorded
```

The production regex returns `true` because it matches the bare word `warning` inside both negated healthy sentences. Therefore the production `thermalNormal` value is `false`.

The reviewer independently reran `/usr/bin/pmset -g therm` and the production predicate against the captured evidence file; both reproduced the API/E2E observation exactly.

## Supported path and consequence

`AC-020` and `BEH-004` require the actual M1 qualification owner to run this preflight before either current package. The supported operational path is:

```text
API/E2E or maintainer prequalify
  -> actual M1 preflight
  -> /usr/bin/pmset -g therm
  -> production thermal predicate
  -> thermalNormal=false for healthy output
  -> runner-power-or-pressure
  -> both current packages remain blocked
```

This is reachable independently of the test: the governing preflight contract and workflow call the production command on the reference host. The API run provides direct execution evidence; it does not establish the product path by itself.

## Separate environment prerequisites

The reviewer also reconfirmed:

- the host was on Battery Power;
- `/usr/bin/sudo -n /usr/sbin/purge` exited `1` with `sudo: a password is required`.

These are real rerun prerequisites under `AC-020`, but they do not cause or excuse the source parser defect. Connecting AC power and provisioning exact least-privilege purge permission are environment actions, not source fixes.

## Review-gap determination

This was reasonably detectable during source review: the predicate visibly searches the bare word `warning` without distinguishing the negated normal output, and no regression exercised the actual `pmset -g therm` healthy shape. `CRR-011` therefore overstated API/E2E readiness and behavioral fidelity. The bounded correction must preserve fail-closed behavior: accept the established affirmative healthy state, reject affirmative warning state, and reject unrecognized/malformed output rather than treating it as healthy.
