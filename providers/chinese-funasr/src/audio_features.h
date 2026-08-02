#pragma once
#include <vector>

namespace funasr_audio {
constexpr int kSampleRate = 16000;
constexpr int kWindowSamples = 400;
std::vector<float> compute_features(std::vector<float> samples, int& frames);
}
