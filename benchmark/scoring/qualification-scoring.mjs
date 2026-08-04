import { errorRate } from "./error-rate.mjs";
import {
  CHINESE_SCORING_AUTHORITY,
  scoreChineseQualification,
} from "./chinese-qualification.mjs";

export function scoreQualificationResult({
  profileId,
  metric,
  rawReference,
  rawHypothesis,
}) {
  return profileId === "chinese"
    ? scoreChineseQualification({ rawReference, rawHypothesis })
    : errorRate(rawReference, rawHypothesis, { metric, profileId });
}

export function qualificationScoringAuthority(profileId) {
  return profileId === "chinese" ? CHINESE_SCORING_AUTHORITY : null;
}
