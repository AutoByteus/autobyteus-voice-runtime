#include "audio_features.h"
#include <algorithm>
#include <cmath>
#include <cstring>
#include <numbers>
#include <utility>

namespace {
constexpr int kShift = 160;
constexpr int kFftSize = 512;
constexpr int kMelBands = 80;
constexpr int kLfrWindow = 7;
constexpr int kLfrStride = 6;
constexpr float kPreEmphasis = 0.97f;

float mel(float frequency) { return 1127.0f * logf(1.0f + frequency / 700.0f); }

void fft(std::vector<float>& real, std::vector<float>& imaginary) {
    for (int index = 1, target = 0; index < kFftSize; ++index) {
        int bit = kFftSize >> 1;
        for (; target & bit; bit >>= 1) target ^= bit;
        target ^= bit;
        if (index < target) { std::swap(real[index], real[target]); std::swap(imaginary[index], imaginary[target]); }
    }
    for (int length = 2; length <= kFftSize; length <<= 1) {
        const double angle = -2.0 * std::numbers::pi / length;
        const float root_real = cosf(angle), root_imaginary = sinf(angle);
        for (int offset = 0; offset < kFftSize; offset += length) {
            float current_real = 1, current_imaginary = 0;
            for (int pair = 0; pair < length / 2; ++pair) {
                const float upper_real = real[offset + pair], upper_imaginary = imaginary[offset + pair];
                const float lower_real = real[offset + pair + length / 2] * current_real - imaginary[offset + pair + length / 2] * current_imaginary;
                const float lower_imaginary = real[offset + pair + length / 2] * current_imaginary + imaginary[offset + pair + length / 2] * current_real;
                real[offset + pair] = upper_real + lower_real; imaginary[offset + pair] = upper_imaginary + lower_imaginary;
                real[offset + pair + length / 2] = upper_real - lower_real; imaginary[offset + pair + length / 2] = upper_imaginary - lower_imaginary;
                const float next_real = current_real * root_real - current_imaginary * root_imaginary;
                current_imaginary = current_real * root_imaginary + current_imaginary * root_real; current_real = next_real;
            }
        }
    }
}
}

std::vector<float> funasr_audio::compute_features(std::vector<float> samples, int& frames) {
    for (auto& sample : samples) sample *= 32768.0f;
    std::vector<float> window(kWindowSamples);
    for (int index = 0; index < kWindowSamples; ++index) window[index] = 0.54f - 0.46f * cosf(2.0f * std::numbers::pi_v<float> * index / (kWindowSamples - 1));
    constexpr int bins = kFftSize / 2 + 1;
    const float bandwidth = static_cast<float>(kSampleRate) / kFftSize;
    const float low = mel(20.0f), high = mel(8000.0f), width = (high - low) / (kMelBands + 1);
    std::vector<std::vector<float>> filters(kMelBands, std::vector<float>(bins, 0.0f));
    for (int band = 0; band < kMelBands; ++band) {
        const float left = low + band * width, center = low + (band + 1) * width, right = low + (band + 2) * width;
        for (int bin = 0; bin < bins; ++bin) {
            const float frequency = mel(bandwidth * bin);
            if (frequency > left && frequency < right) filters[band][bin] = frequency <= center ? (frequency - left) / (center - left) : (right - frequency) / (right - center);
        }
    }
    const int feature_frames = (samples.size() - kWindowSamples) / kShift + 1;
    std::vector<std::vector<float>> features(feature_frames, std::vector<float>(kMelBands));
    std::vector<float> real(kFftSize), imaginary(kFftSize), frame(kWindowSamples);
    for (int time = 0; time < feature_frames; ++time) {
        const float* source = samples.data() + time * kShift;
        double mean = 0; for (int index = 0; index < kWindowSamples; ++index) mean += source[index]; mean /= kWindowSamples;
        for (int index = 0; index < kWindowSamples; ++index) frame[index] = source[index] - static_cast<float>(mean);
        for (int index = kWindowSamples - 1; index > 0; --index) frame[index] -= kPreEmphasis * frame[index - 1]; frame[0] -= kPreEmphasis * frame[0];
        for (int index = 0; index < kFftSize; ++index) { real[index] = index < kWindowSamples ? frame[index] * window[index] : 0.0f; imaginary[index] = 0.0f; }
        fft(real, imaginary);
        for (int band = 0; band < kMelBands; ++band) {
            float energy = 0; for (int bin = 0; bin < bins; ++bin) if (filters[band][bin] > 0) energy += filters[band][bin] * (real[bin] * real[bin] + imaginary[bin] * imaginary[bin]);
            features[time][band] = logf(std::max(energy, 1.1920929e-07f));
        }
    }
    constexpr int padding = (kLfrWindow - 1) / 2;
    frames = (feature_frames + kLfrStride - 1) / kLfrStride;
    std::vector<std::vector<float>> padded; padded.reserve(feature_frames + padding + kLfrWindow);
    for (int index = 0; index < padding; ++index) padded.push_back(features[0]);
    for (const auto& feature : features) padded.push_back(feature);
    while (static_cast<int>(padded.size()) < (frames - 1) * kLfrStride + kLfrWindow) padded.push_back(features.back());
    std::vector<float> output(static_cast<size_t>(frames) * kLfrWindow * kMelBands);
    for (int time = 0; time < frames; ++time) for (int window_index = 0; window_index < kLfrWindow; ++window_index)
        memcpy(&output[static_cast<size_t>(time) * kLfrWindow * kMelBands + window_index * kMelBands], padded[time * kLfrStride + window_index].data(), kMelBands * sizeof(float));
    return output;
}
