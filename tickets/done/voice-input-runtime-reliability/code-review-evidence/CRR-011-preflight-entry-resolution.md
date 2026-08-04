# CRR-011 Preflight Entry Resolution Evidence

## Scope

This reviewer probe rechecks the two actual-host entry defects from `CRR-010` against IR-010 source commit `b7342bc8e06d587bfe640faa4209c62ac2f4bae9`.

## Canonical readable executable entry

- `/opt/homebrew/bin/cmake` is a symlink to `/opt/homebrew/Cellar/cmake/4.3.3/bin/cmake` on the reference M1 host.
- `/usr/bin/tar` is a symlink to `/usr/bin/bsdtar`.
- Production `canonicalExecutablePath()` returned those exact canonical targets.
- Production `assertTrustedExecutableIdentity()` accepted the canonical CMake target with its current SHA-256.
- `tests/build/trusted-native-environment.test.mjs` invoked `createTrustedNativeBuildEnvironment()` with a symlinked configured CMake path and a preflight record containing the canonical target; the production owner accepted it.

This closes the lexical-versus-canonical mismatch from `CR-F-018` without weakening byte verification.

## Execute-only sudo identity

The reviewer confirmed the actual non-root host behavior:

```text
cat /usr/bin/sudo
cat: /usr/bin/sudo: Permission denied
```

Production `capturePinnedSudoIdentity()` and immediate `verifyPinnedSudoIdentity()` both succeeded without reading the executable. Two captures were byte-equal as JSON. The recorded stable identity included:

```json
{
  "path": "/usr/bin/sudo",
  "ownerUid": 0,
  "ownerGid": 0,
  "mode": "4511",
  "sizeBytes": 1580368,
  "probeArgs": ["-V"],
  "stdoutSha256": "6d0e9e583743268ef44261a4a9db95d4b4f27109c0a5f1182de74aaa553a3c1d",
  "stderrSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

The full identity also binds device, inode, and mtime/ctime nanoseconds. Its canonical digest was `7dc34a43d0637fcb2d0b97feb483ba6c32f15594b2a7b1758c43561b65a5818a`. Mutating the expected inode was rejected by the production verifier. The preflight contract recomputes this identity when consuming a passing record, while the separately executed exact `sudo -n /usr/sbin/purge` capability result binds the identity digest.

This closes `CR-F-019`. The probe deliberately did not provision purge rights or claim that the complete preflight passed; actual capability and qualification remain API/E2E work.

## Reviewer checks

- Focused production-path tests: `7/7` passed.
- Full `VOICE_GO=/tmp/autobyteus-go1.26.5-v1/go/bin/go npm run check`: `57/57` Node tests, `7/7` Python tests plus compileall, all Go/source/schema/evidence checks passed.
- Verified-root Go race, vet, and formatting checks passed.
- Original selection-study checksums: `191/191` passed; log: `CRR-011-selection-checksums.log`.
- Repository JSON parse sweep: `204` files passed.
- Prettier and source-commit `git diff --check` passed.
