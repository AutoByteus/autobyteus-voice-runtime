#pragma once
#include <functional>
#include <memory>
#include <string>
#include <vector>

class FunAsrEngine {
public:
    using PreparationBoundary = std::function<void(const char* stage, const char* event)>;
    FunAsrEngine(const std::string& encoder_path, const std::string& language_model_path, PreparationBoundary boundary);
    ~FunAsrEngine();
    FunAsrEngine(const FunAsrEngine&) = delete;
    FunAsrEngine& operator=(const FunAsrEngine&) = delete;
    std::string transcribe(const std::vector<float>& mono_pcm_16khz);
private:
    struct Impl;
    std::unique_ptr<Impl> impl_;
};
