# Release Guide

How a verified change to the 0.3.x Voice Input runtime is finalized, released and
rolled out. Read it before merging a ticket into the target branch, tagging or
publishing. A generic delivery process covers the order of the steps; this file
holds what is specific to this repository.

It covers the 0.3.x line (the Python worker, see [DESIGN.md](DESIGN.md)). The v1.0
work on `main` has its own release tooling and is not described here.

First written by autobyteus-655 (the `v0.3.1` fix). Steps marked *(not yet run)*
come from the workflow file and have not been carried out under this guide yet.
The first release that runs them confirms or corrects them here.

## Finalization Target

- Remote `origin` (`AutoByteus/autobyteus-voice-runtime`, **public**). Ticket
  branches are `codex/<ticket-name>`.
- 0.3.x fixes finalize into the maintenance branch `release/0.3`. It was created
  from `v0.3.0` by autobyteus-655. `main` holds the unreleased v1.0 work: never
  merge 0.3.x tickets into `main`, and never merge `main` into `release/0.3`.
- Merge the ticket branch with `--no-ff`, then push. Before pushing
  `release/0.3`, fetch and check that `origin/release/0.3` has not moved since
  you last integrated it.
- **Secrets before the first push.** A pushed commit in a public repository is
  already exposed, the ticket branch included. Scan the new commits:
  `gitleaks git --log-opts="origin/release/0.3..HEAD" --redact .`. Use
  `v0.3.0..HEAD` before `release/0.3` exists. Any finding blocks the push.
  Report the commit, file and kind, never the value.
- Never commit build output: `dist/`, a worker `.venv`, downloaded models.
- File names must check out on macOS, Linux and Windows (the bundles are built on
  all three): no `< > : " | ? * \`, no trailing dot or space, no device names
  such as `CON`. Name ticket evidence with `-`, not `:`.

## Release Decision

- The founder decides, for every release (a release is hard to undo). Without
  the founder's word, finalize and tag nothing.
- There is one kind of release, a `vX.Y.Z` tag. The workflow publishes it as a
  normal GitHub release (not a pre-release).

## Checks Before Tagging

None beyond the testing guideline. The workflow's verify job runs the repository
tests (`node --test tests/*.test.mjs`, `python3 -m unittest
tests/test_voice_input_worker.py`), and API/E2E runs those, plus the live bundle
checks, before the merge ([TESTING.md](TESTING.md)).

## Cutting The Release *(not yet run)*

On the founder's word, on `release/0.3` after the ticket's merge:

```bash
git fetch origin release/0.3 && git checkout --detach origin/release/0.3
git tag -a v0.3.N -m "Voice Input runtime 0.3.N"
git push origin v0.3.N
```

- The tag starts `.github/workflows/release-voice-runtime.yml`. The workflow
  file of the tagged commit is used, so a `release/0.3` tag runs the 0.3
  workflow, not `main`'s.
- The workflow takes the version from the tag (`v0.3.N` → `0.3.N`) and passes it
  to `scripts/build-runtime.sh` and `scripts/generate-manifest.mjs` as
  `AUTOBYTEUS_VOICE_RUNTIME_VERSION`. The scripts' own defaults are not used
  there.
- Release notes are GitHub's generated notes.

## Watching The Rollout *(not yet run)*

- One workflow run: `build-runtime` (darwin arm64, darwin x64, linux x64,
  win32 x64), `verify-runtime`, then `publish-release`.
  `gh run list -R AutoByteus/autobyteus-voice-runtime --limit 1`, then
  `gh run watch <id> --exit-status`.
- A complete release has 5 assets: `voice-input-runtime-{darwin-arm64,darwin-x64,linux-x64,win32-x64}.tar.gz`
  and `voice-input-runtime-manifest.json`. Check them with
  `gh release view v0.3.N -R AutoByteus/autobyteus-voice-runtime --json assets`.
  The manifest must name the new version.
- `publish-release` runs only after every build and the verify job succeed, so
  a failed build publishes nothing. There is no partial release, but the tag
  exists.
- A release reaches users only through a caller that pins it. The desktop app
  pins `v0.3.0` (`autobyteus-web/electron/extensions/extensionCatalog.ts`,
  `DEFAULT_RUNTIME_VERSION`, in the workspace superrepo). The autobyteus-516 Voice
  Input extension pins 0.3.1.
- After publishing, repeat the ticket's live check on the released darwin-arm64
  bundle when the ticket asks for it (autobyteus-655 AC-006).

## Recovery

- Never move or delete a pushed tag; fix forward with the next patch version.
- Read a failed job's log first. A runner, network or package-index failure
  (the same commit would pass): rerun only the failed jobs,
  `gh run rerun <id> --failed`. Our code or workflow (the same commit would fail
  again): fix it on `release/0.3` through a ticket and tag the next patch.

## Rollback

Callers pin a tag, so going back means pinning the previous tag in the caller. A
published release can stay.

## Deployment

The repository deploys no service. Users receive a runtime when their app
installs the version its caller pins, from the GitHub release assets.
