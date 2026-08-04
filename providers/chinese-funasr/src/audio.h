#pragma once
#include <filesystem>
#include <vector>
struct ValidAudio { std::vector<float> samples; int duration_ms; bool no_speech; };
ValidAudio read_valid_audio(const std::filesystem::path& path);
