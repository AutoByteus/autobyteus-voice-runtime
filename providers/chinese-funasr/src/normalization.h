#pragma once
#include <filesystem>
#include <memory>
#include <string>

struct NormalizationData;

class Normalizer {
public:
    explicit Normalizer(const std::filesystem::path& mapping);
    ~Normalizer();
    std::string apply(const std::string& raw) const;

private:
    std::unique_ptr<NormalizationData> data_;
};
