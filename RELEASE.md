# Release Guide

How a verified change to the 0.3.x Voice Input runtime is finalized, released and
rolled out. Read it before merging a ticket into the target branch, tagging or
publishing. A generic delivery process covers the order of the steps; this file
holds what is specific to this repository.

It covers the 0.3.x line (the Python worker, see [DESIGN.md](DESIGN.md)). The v1.0
work on `main` has its own release tooling and is not described here.

## Finalization Target

- Remote `origin` (`AutoByteus/autobyteus-voice-runtime`, **public**). Ticket
  branches are `codex/<ticket-name>`.
- 0.3.x fixes finalize into the maintenance branch `release/0.3`, which starts
  at `v0.3.0`. `main` holds the unreleased v1.0 work. Never merge 0.3.x tickets
  into `main`, and never merge `main` into `release/0.3`.
- Merge the ticket branch with `--no-ff`, then push. Before pushing
  `release/0.3`, fetch and check that `origin/release/0.3` has not moved since
  you last integrated it.
- **Secrets before the first push.** A pushed commit in a public repository is
  already exposed, the ticket branch included. Scan the new commits:
  `gitleaks git --log-opts="origin/release/0.3..HEAD" --redact .`. Any finding
  blocks the push. Report the commit, file and kind, never the value.
- Never commit build output: `dist/`, a worker `.venv`, downloaded models.
- File names must check out on macOS, Linux and Windows (the win32 bundle is
  built on Windows): no `< > : " | ? * \`, no trailing dot or space, no device
  names such as `CON`. Name ticket evidence with `-`, not `:`.
- Every push to `release/**` runs the release workflow build-only (below). Each
  push, a delivery record included, costs one run.

## Release Decision

- The founder decides, for every release (a release is hard to undo). Without
  the founder's word, finalize and tag nothing.
- There is one kind of release, a `vX.Y.Z` tag. The workflow publishes it as a
  normal GitHub release (not a pre-release).

## Checks Before Tagging

- **The build-only run of the commit you will tag.** The push of a merge to
  `release/0.3` runs `.github/workflows/release-voice-runtime.yml` without
  publishing: the four builds and the verify job, with version
  `0.0.0-ci.<sha>`, no release and no tag. Tag only a commit whose push run
  succeeded, so put no other commit between that run and the tag:

  ```bash
  gh run list -R AutoByteus/autobyteus-voice-runtime --branch release/0.3 --limit 1
  gh run watch <id> -R AutoByteus/autobyteus-voice-runtime --exit-status
  ```

  It belongs here because runner images, job conditions and the publish gate
  exist only on GitHub, and a local machine cannot reproduce them. The
  workflow's own tests run locally first ([TESTING.md](TESTING.md)).

## Cutting The Release

On the founder's word, on the `release/0.3` commit whose build-only run passed:

```bash
git fetch origin release/0.3
git tag -a v0.3.N <that commit> -m "Voice Input runtime 0.3.N"
git push origin v0.3.N
```

- The tag starts the workflow from the tagged commit's workflow file, so a
  `release/0.3` tag runs the 0.3 workflow, not `main`'s. GitHub lists the run
  under the name of `main`'s file at the same path ("Voice runtime host
  release"); the job names show which workflow ran.
- The workflow takes the version from the tag (`v0.3.N` → `0.3.N`) and passes it
  to `scripts/build-runtime.sh` and `scripts/generate-manifest.mjs` as
  `AUTOBYTEUS_VOICE_RUNTIME_VERSION`. The scripts' own defaults are not used.
- `workflow_dispatch` publishes only with `publish=true`, under the tag
  `v<runtime_version>`. Use it only to republish a tag whose run failed on the
  platform, never to publish assets from a commit other than the tag's.
- Release notes are GitHub's generated notes.

## Watching The Rollout

- One workflow run: `Resolve Voice Runtime Release Metadata`, four
  `Build <platform> <arch>` jobs (darwin arm64 and x64 and linux x64 on
  `ubuntu-latest`, which only package files; win32 x64 on `windows-latest`),
  `Verify Runtime Packaging`, then `Publish Voice Runtime Release`.
  `gh run list -R AutoByteus/autobyteus-voice-runtime --limit 1`, then
  `gh run watch <id> -R AutoByteus/autobyteus-voice-runtime --exit-status`.
- A complete release has 5 assets:
  `voice-input-runtime-{darwin-arm64,darwin-x64,linux-x64,win32-x64}.tar.gz`
  and `voice-input-runtime-manifest.json`. Check them with
  `gh release view v0.3.N -R AutoByteus/autobyteus-voice-runtime --json assets`.
  The manifest's `runtimeVersion` must be the new version, and each asset's
  `sha256` must match the downloaded bundle.
- Publish runs only when every build and the verify job succeeded. A failed
  build publishes nothing: there is no partial release, but the tag exists.
- A release reaches users only through a caller that pins its version, such as
  the desktop app's runtime catalog (`autobyteus-web/electron/extensions/extensionCatalog.ts`
  in the workspace superrepo). Publishing changes nothing for an app until its
  caller's pin moves.
- When a ticket asks for a live check on the released bundle, download the
  bundle from the release and run it in a test-owned extension folder
  ([TESTING.md](TESTING.md), "Real bundle" and "Desktop caller"). Never use a
  user's installed runtime.

## Recovery

- Never move or delete a pushed tag; fix forward with the next patch version.
  A tag whose run published nothing stays as a tag without a release.
- Read a failed job's log first.
  - A runner, network or package-index failure, where the same commit would
    pass: rerun only the failed jobs, `gh run rerun <id> --failed`.
  - Our code, configuration or workflow, where the same commit fails again
    (for example a runner image GitHub no longer provides: "The configuration
    '…' is not supported"): fix it on `release/0.3` through a ticket, prove the
    fix with a build-only run, and tag the next patch.

## Rollback

Callers pin a tag, so going back means pinning the previous tag in the caller. A
published release can stay.

## Deployment

The repository deploys no service. Users receive a runtime when their app
installs the version its caller pins, from the GitHub release assets.
