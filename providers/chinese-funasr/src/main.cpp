#include "audio.h"
#include "funasr_engine.h"
#include "normalization.h"
#include "preparation_diagnostics.h"
#include "result_policy.h"
#include "session.h"
#include <chrono>
#include <iostream>
#include <memory>
#include <nlohmann/json.hpp>
#include <regex>
#include <set>
#include <stdexcept>
#include <string>

using json = nlohmann::json;
using clock_type = std::chrono::steady_clock;

namespace {
void emit(const json& value) {
    const auto line = value.dump();
    if (line.size() > 1024 * 1024) throw std::runtime_error("frame-too-large");
    std::cout << line << '\n' << std::flush;
}

bool valid_uuid(const std::string& value) {
    static const std::regex pattern("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$");
    return std::regex_match(value, pattern);
}

double elapsed(clock_type::time_point start) {
    return std::chrono::duration<double, std::milli>(clock_type::now() - start).count();
}

void exact(const json& value, const std::set<std::string>& expected) {
    if (!value.is_object()) throw std::runtime_error("invalid-object");
    std::set<std::string> actual;
    for (const auto& item : value.items()) actual.insert(item.key());
    if (actual != expected) throw std::runtime_error("invalid-fields");
}
}

int main(int argc, char** argv) {
    BoundSession session;
    std::unique_ptr<ScratchCleanup> scratch;
    try {
        if (argc != 5 || std::string(argv[1]) != "--private-package-root" || std::string(argv[3]) != "--session-config") throw std::runtime_error("invalid-usage");
        scratch = std::make_unique<ScratchCleanup>(argv[2]);
        session = bind_session(argv[2], argv[4]);
    } catch (...) {
        std::cerr << "VOICE_PROVIDER_STARTUP_REJECTED\n";
        return 65;
    }

    emit({{"type","hello"},{"protocolVersion",1},{"sessionId",session.session_id},{"packageId",session.package_id},{"providerId",session.provider_id},{"modelId",session.model_id},{"profileId",session.profile_id},{"languageMode",session.language_mode},{"target",{{"platform",session.platform},{"architecture",session.architecture}}},{"capabilityDigest",session.capability_digest}});
    emit({{"type","lifecycle"},{"protocolVersion",1},{"state","model-preparing"}});
    std::unique_ptr<FunAsrEngine> engine;
    std::unique_ptr<Normalizer> normalizer;
    PreparationDiagnostics diagnostics;
    try {
        diagnostics.start("manifest-verification");
        verify_complete_manifest(session);
        diagnostics.complete("manifest-verification");
        const auto boundary = [&diagnostics](const char* stage, const char* event) {
            if (std::string(event) == "start") diagnostics.start(stage);
            else diagnostics.complete(stage);
        };
        engine = std::make_unique<FunAsrEngine>(session.resolve("model/funasr-encoder-f16.gguf").string(), session.resolve("model/qwen3-0.6b-q8_0.gguf").string(), boundary);
        diagnostics.start("normalizer-load");
        normalizer = std::make_unique<Normalizer>(session.resolve("normalizer/t2s-mapping-v1.json"));
        diagnostics.complete("normalizer-load");
    } catch (...) {
        emit({{"type","lifecycle"},{"protocolVersion",1},{"state","failed"},{"code","MODEL_PREPARATION_FAILED"}});
        return 1;
    }
    emit({{"type","lifecycle"},{"protocolVersion",1},{"state","inference-ready"}});

    std::set<std::string> used_ids;
    bool ready = true;
    std::string line;
    while (std::getline(std::cin, line)) {
        try {
            if (line.empty() || line.size() > 1024 * 1024) throw std::runtime_error("invalid-line");
            const auto frame = json::parse(line);
            const auto type = frame.at("type").get<std::string>();
            if (type == "transcribe-file") {
                exact(frame, {"type","protocolVersion","requestId","audioPath"});
                const auto request_id = frame.at("requestId").get<std::string>();
                if (!ready || frame.at("protocolVersion") != 1 || !valid_uuid(request_id) || !frame.at("audioPath").is_string() || !used_ids.insert(request_id).second) throw std::runtime_error("invalid-request");
                ready = false;
                emit({{"type","lifecycle"},{"protocolVersion",1},{"state","transcribing"},{"requestId",request_id}});
                ValidAudio audio;
                try {
                    audio = read_valid_audio(frame.at("audioPath").get<std::string>());
                } catch (...) {
                    emit({{"type","request-error"},{"protocolVersion",1},{"requestId",request_id},{"code","INVALID_AUDIO"},{"retryable",false}});
                    ready = true;
                    emit({{"type","lifecycle"},{"protocolVersion",1},{"state","inference-ready"}});
                    continue;
                }
                try {
                    const auto inference_start = clock_type::now();
                    const std::string raw = audio.no_speech ? "" : engine->transcribe(audio.samples);
                    const std::string outcome = classify_result(audio.no_speech, raw);
                    const double inference_ms = elapsed(inference_start);
                    const auto normalization_start = clock_type::now();
                    const std::string normalized = raw.empty() ? "" : normalizer->apply(raw);
                    const double normalization_ms = elapsed(normalization_start);
                    emit({{"type","transcription-result"},{"protocolVersion",1},{"requestId",request_id},{"outcome",outcome},{"rawText",raw},{"normalizedText",normalized},{"detectedLanguage",audio.no_speech?"unknown":"zh"},{"metrics",{{"audioDurationMs",audio.duration_ms},{"inferenceMs",inference_ms},{"normalizationMs",normalization_ms}}}});
                } catch (...) {
                    emit({{"type","lifecycle"},{"protocolVersion",1},{"state","failed"},{"code","INFERENCE_FAILED"}});
                    return 1;
                }
                ready = true;
                emit({{"type","lifecycle"},{"protocolVersion",1},{"state","inference-ready"}});
            } else if (type == "shutdown") {
                exact(frame, {"type","protocolVersion","requestId"});
                const auto request_id = frame.at("requestId").get<std::string>();
                if (!ready || frame.at("protocolVersion") != 1 || !valid_uuid(request_id) || used_ids.contains(request_id)) throw std::runtime_error("invalid-shutdown");
                emit({{"type","lifecycle"},{"protocolVersion",1},{"state","shutting-down"}});
                engine.reset();
                normalizer.reset();
                emit({{"type","shutdown-ack"},{"protocolVersion",1},{"requestId",request_id}});
                emit({{"type","lifecycle"},{"protocolVersion",1},{"state","stopped"}});
                return 0;
            } else {
                throw std::runtime_error("invalid-type");
            }
        } catch (...) {
            emit({{"type","lifecycle"},{"protocolVersion",1},{"state","failed"},{"code","PROTOCOL_INVALID"}});
            return 1;
        }
    }
    emit({{"type","lifecycle"},{"protocolVersion",1},{"state","failed"},{"code","PROTOCOL_INVALID"}});
    return 1;
}
