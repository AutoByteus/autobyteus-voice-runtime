const sha = /^[a-f0-9]{64}$/;
const uuid =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
export function decodeFrame(line) {
  let value;
  try {
    value = JSON.parse(line);
  } catch {
    throw new Error("MALFORMED_FRAME");
  }
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== "object" ||
    value.protocolVersion !== 1
  )
    throw new Error("INVALID_FRAME");
  const schemas = {
    hello: [
      "type",
      "protocolVersion",
      "sessionId",
      "packageId",
      "providerId",
      "modelId",
      "profileId",
      "languageMode",
      "target",
      "capabilityDigest",
    ],
    lifecycle: null,
    "transcription-result": [
      "type",
      "protocolVersion",
      "requestId",
      "outcome",
      "rawText",
      "normalizedText",
      "detectedLanguage",
      "metrics",
    ],
    "request-error": [
      "type",
      "protocolVersion",
      "requestId",
      "code",
      "retryable",
    ],
    "shutdown-ack": ["type", "protocolVersion", "requestId"],
  };
  if (!(value.type in schemas)) throw new Error("INVALID_FRAME");
  if (value.type === "lifecycle") validateLifecycle(value);
  else exact(value, schemas[value.type]);
  if (
    value.type === "hello" &&
    (!uuid.test(value.sessionId) ||
      !sha.test(value.capabilityDigest) ||
      !["english", "chinese", "auto"].includes(value.profileId) ||
      !["en", "zh", "auto"].includes(value.languageMode) ||
      !value.target ||
      !["darwin", "linux", "win32"].includes(value.target.platform) ||
      !["arm64", "x64"].includes(value.target.architecture))
  )
    throw new Error("INVALID_HELLO");
  if (
    ["transcription-result", "request-error", "shutdown-ack"].includes(
      value.type,
    ) &&
    !uuid.test(value.requestId)
  )
    throw new Error("INVALID_REQUEST_ID");
  if (value.type === "transcription-result") {
    if (
      !["transcript", "no-speech"].includes(value.outcome) ||
      typeof value.rawText !== "string" ||
      typeof value.normalizedText !== "string" ||
      !["en", "zh", "unknown"].includes(value.detectedLanguage) ||
      !validMetrics(value.metrics) ||
      (value.outcome === "no-speech" &&
        (value.rawText !== "" || value.normalizedText !== ""))
    )
      throw new Error("INVALID_RESULT");
  }
  if (
    value.type === "request-error" &&
    (value.code !== "INVALID_AUDIO" || value.retryable !== false)
  )
    throw new Error("INVALID_REQUEST_ERROR");
  return value;
}
function validateLifecycle(value) {
  const state = value.state;
  if (state === "transcribing") {
    exact(value, ["type", "protocolVersion", "state", "requestId"]);
    if (!uuid.test(value.requestId)) throw new Error("INVALID_LIFECYCLE");
  } else if (state === "failed") {
    exact(value, ["type", "protocolVersion", "state", "code"]);
    if (
      ![
        "PACKAGE_INTEGRITY_FAILED",
        "MODEL_PREPARATION_FAILED",
        "INFERENCE_FAILED",
        "PROTOCOL_INVALID",
        "INTERNAL_FAILED",
      ].includes(value.code)
    )
      throw new Error("INVALID_LIFECYCLE");
  } else {
    exact(value, ["type", "protocolVersion", "state"]);
    if (
      ![
        "model-preparing",
        "inference-ready",
        "shutting-down",
        "stopped",
      ].includes(state)
    )
      throw new Error("INVALID_LIFECYCLE");
  }
}
function exact(value, fields) {
  if (Object.keys(value).sort().join(",") !== [...fields].sort().join(","))
    throw new Error("UNKNOWN_FRAME_FIELD");
}
function validMetrics(value) {
  return (
    value &&
    Object.keys(value).sort().join(",") ===
      "audioDurationMs,inferenceMs,normalizationMs" &&
    Number.isInteger(value.audioDurationMs) &&
    value.audioDurationMs >= 150 &&
    value.audioDurationMs <= 30000 &&
    Number.isFinite(value.inferenceMs) &&
    value.inferenceMs >= 0 &&
    Number.isFinite(value.normalizationMs) &&
    value.normalizationMs >= 0
  );
}
