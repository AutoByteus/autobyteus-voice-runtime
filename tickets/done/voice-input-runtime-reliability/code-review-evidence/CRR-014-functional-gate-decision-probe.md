# CRR-014 Functional-Gate Decision Probe

## Basis

- Reviewed source commit: `0afc5904ea7584cddcee7a1f70f0179036689a45`
- Approved contract: `AC-003`, `AC-009`, `AC-017`, and `AC-023` make quality, RSS, package size, exact counts, missing observations, and other functional gates blocking. A non-pass qualification must be retained and must not advance as success.
- Supported initiating trigger: normal API/E2E or Delivery qualification executes an exact current package against its required corpus and observes a functional threshold breach after every attempt itself completed successfully (for example, WER above 8%).

## Forward Source Trace

1. `benchmark/run-profile-qualification.mjs:155` calls `writeEvidence(context, "pass", null)` after the trial/lifecycle path completes.
2. `benchmark/profile-qualification-evidence.mjs:76` immediately finalizes `qualification-attempts-v1.json` with that requested `pass` decision.
3. `benchmark/profile-qualification-evidence.mjs:81-101` separately computes the authoritative functional outcome; a quality/RSS/size/count/observation breach changes the Summary result to `fail / functional-gate-failed`.
4. `benchmark/profile-qualification-evidence.mjs:205-214` writes Summary 2 and Assessment 1 and returns normally. `run-profile-qualification.mjs` ignores the returned decision and exits successfully.
5. Later, `release/evidence/qualification-set.mjs:193-208` rejects the non-pass Summary because the retained attempt ledger still says `pass`; therefore it cannot write the required non-pass Qualification Set 2 before its CLI failure.

## Focused Reproduction

A temporary reviewer probe constructed the normal completed-attempt shape: 30 successful cold attempts, 30 successful warm-preparation attempts, 100 successful warm requests, complete timings/cache/RSS/recovery/offline facts, and one English corpus result whose WER exceeds the fixed functional limit. The production evidence writer returned normally and produced:

```json
{
  "writerReturned": true,
  "summaryFunctionalDecision": "fail",
  "summaryFailureCategory": "functional-gate-failed",
  "attemptLedgerDecision": "pass",
  "attemptLedgerFailureCategory": null,
  "assessment": "controlled-pass"
}
```

Durable output: `CRR-014-functional-gate-decision-probe.json`.

## Consequence

The functional threshold is correctly classified in Summary 2 but is not propagated to the attempt-ledger/CLI result. The per-profile job reports success, and Qualification Set 2 later rejects the contradictory artifacts before writing its own durable `fail` decision. This is a bounded implementation defect in decision finalization/propagation, not a design ambiguity.
