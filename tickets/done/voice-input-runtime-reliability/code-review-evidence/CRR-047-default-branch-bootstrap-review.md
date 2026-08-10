# CRR-047 Default-Branch Bootstrap Failure-Origin Evidence

## Reviewed Subjects

- Reviewed source: `2e743600ef67469f3fd1bf2c9078d53c2d053979`
- Reviewed artifact: `ec0f726afd252448784855665a08d1de2ee0521c`
- API/E2E evidence commit: `f31f856b29a1a776bf1f0fb8bb04270e05345f51`
- Repository default branch at failure: `main` at `fd83e8681dfd4e98afdfa46cb691d31400565d70`
- Scenario/failure: `API-VOICE-016-B` / `API-F-015`

## Independent Operational Contract

GitHub's official manual-run documentation states that a workflow manually triggered with `workflow_dispatch` must be present on the repository's default branch. The REST workflow-dispatch endpoint separately permits the request body to select a branch or tag ref.

- Manual workflow documentation: https://docs.github.com/actions/managing-workflow-runs/manually-running-a-workflow
- REST endpoint documentation: https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event

This is the governing external platform contract for the approved API/E2E operator action; it is independent of the workflow source and the failing dispatch itself.

## Repository And Execution Evidence

- Default `main` workflow tree at the failure point contains only `.github/workflows/release-voice-runtime.yml`.
- Reviewed artifact tree contains:
  - `.github/workflows/recover-qualified-voice-archives.yml`, blob `7e721c10640e5fba3b07a0f8375f4d1876496b5c`;
  - `.github/workflows/promote-qualified-voice-candidate.yml`, blob `cfaf7c2d4d053088a606c2eb25e2efa2fa2d2ebf`;
  - `.github/workflows/release-voice-runtime.yml`.
- The recovery workflow uses `on.workflow_dispatch` and targets the approved organization-managed Apple Silicon runner group.
- Exact dispatch exited `1` with `HTTP 404: workflow ... not found on the default branch`.
- GitHub reported zero runs at the exact reviewed artifact head.
- Therefore zero recovery builds, Results, archives, promotions, candidates, tags, releases, or publications occurred.

## Failure-Origin Decision

The reviewed implementation follows the formerly approved API/E2E-before-Delivery ordering, but that ordering omitted GitHub's default-branch registration prerequisite. No local execution, personal runner, old heavy workflow, or API/E2E merge authority was available under the prior contract.

On 2026-08-09, the user explicitly approved the special-case sequence that merges the already-reviewed pipeline to default `main` before real pipeline validation. This is preferable to a personal branch/runner workaround because it uses GitHub's supported workflow catalog and preserves the approved managed recovery boundary.

The source review remains Pass. The narrow bootstrap merge is authorized, but API-REV-020 remains a truthful Fail until a later dispatch creates and completes the required recovery/promotion work.

## Safety Boundary

- Bootstrap integration is not a release.
- Do not tag, publish, rebuild in Delivery, execute provider/profile/corpus/performance qualification, or use a personal runner.
- After registration, API/E2E must dispatch the exact reviewed ref/commit and independently verify the resulting recovery and promotion evidence.
