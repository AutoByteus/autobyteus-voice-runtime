#include "normalization.h"
#include <nlohmann/json.hpp>
#include <utf8proc.h>
#include <cctype>
#include <cstdlib>
#include <fstream>
#include <optional>
#include <stdexcept>
#include <unordered_map>
#include <utility>
#include <vector>

namespace {
using json = nlohmann::json;

std::vector<std::string> characters(const std::string& value) {
    std::vector<std::string> result;
    for (size_t index = 0; index < value.size();) {
        const auto first = static_cast<uint8_t>(value[index]);
        const size_t size = first < 0x80 ? 1 : first < 0xe0 ? 2 : first < 0xf0 ? 3 : 4;
        if (index + size > value.size()) throw std::runtime_error("invalid-utf8");
        for (size_t offset = 1; offset < size; ++offset)
            if ((static_cast<uint8_t>(value[index + offset]) & 0xc0) != 0x80)
                throw std::runtime_error("invalid-utf8");
        result.push_back(value.substr(index, size));
        index += size;
    }
    return result;
}

struct TrieNode {
    std::unordered_map<std::string, std::unique_ptr<TrieNode>> children;
    std::optional<std::string> replacement;
};

struct Trie {
    TrieNode root;

    explicit Trie(const json& dictionary) {
        if (!dictionary.is_object()) throw std::runtime_error("normalizer-invalid");
        for (const auto& [source, replacement] : dictionary.items()) {
            if (source.empty() || !replacement.is_string()) throw std::runtime_error("normalizer-invalid");
            auto* node = &root;
            for (const auto& token : characters(source)) {
                auto& child = node->children[token];
                if (!child) child = std::make_unique<TrieNode>();
                node = child.get();
            }
            node->replacement = replacement.get<std::string>();
        }
    }
};

struct Match { size_t end; std::string replacement; };

std::optional<Match> match(const std::vector<std::string>& input, size_t offset, const Trie& trie) {
    const auto* node = &trie.root;
    std::optional<Match> best;
    for (size_t index = offset; index < input.size(); ++index) {
        const auto child = node->children.find(input[index]);
        if (child == node->children.end()) break;
        node = child->second.get();
        if (node->replacement) best = Match{index + 1, *node->replacement};
    }
    return best;
}

std::string convert(const std::string& value, const Trie& trie) {
    const auto input = characters(value);
    std::string output;
    for (size_t index = 0; index < input.size();) {
        const auto matched = match(input, index, trie);
        if (matched) {
            output += matched->replacement;
            index = matched->end;
        } else {
            output += input[index++];
        }
    }
    return output;
}

std::vector<std::string> segment(const std::string& value, const Trie& trie) {
    const auto input = characters(value);
    std::vector<std::string> output;
    std::string unmatched;
    for (size_t index = 0; index < input.size();) {
        const auto matched = match(input, index, trie);
        if (matched) {
            if (!unmatched.empty()) output.push_back(std::exchange(unmatched, std::string{}));
            std::string found;
            for (size_t cursor = index; cursor < matched->end; ++cursor) found += input[cursor];
            output.push_back(found);
            index = matched->end;
        } else {
            unmatched += input[index++];
        }
    }
    if (!unmatched.empty()) output.push_back(unmatched);
    return output;
}

std::string nfkc(const std::string& value) {
    utf8proc_uint8_t* normalized = nullptr;
    const auto length = utf8proc_map(
        reinterpret_cast<const utf8proc_uint8_t*>(value.data()),
        static_cast<utf8proc_ssize_t>(value.size()),
        &normalized,
        static_cast<utf8proc_option_t>(UTF8PROC_STABLE | UTF8PROC_COMPOSE | UTF8PROC_COMPAT));
    if (length < 0 || normalized == nullptr) throw std::runtime_error("normalization-invalid-utf8");
    std::string result(reinterpret_cast<char*>(normalized), static_cast<size_t>(length));
    free(normalized);
    return result;
}

bool han(const std::string& token) {
    if (token.size() < 3) return false;
    utf8proc_int32_t codepoint = 0;
    if (utf8proc_iterate(reinterpret_cast<const utf8proc_uint8_t*>(token.data()), token.size(), &codepoint) < 0)
        throw std::runtime_error("invalid-utf8");
    return (codepoint >= 0x3400 && codepoint <= 0x9fff) || (codepoint >= 0x20000 && codepoint <= 0x323af);
}
}

struct NormalizationData {
    Trie normalization;
    Trie segmentation;
    std::vector<Trie> stages;

    explicit NormalizationData(const json& value)
        : normalization(value.at("normalization")), segmentation(value.at("segmentation")) {
        for (const auto& stage : value.at("conversionStages")) stages.emplace_back(stage);
    }
};

Normalizer::Normalizer(const std::filesystem::path& mapping) {
    std::ifstream input(mapping);
    const auto value = json::parse(input);
    if (!value.is_object()) throw std::runtime_error("normalizer-invalid");
    const auto expected = std::vector<std::string>{"conversionStages", "normalization", "schemaVersion", "segmentation", "source"};
    std::vector<std::string> actual;
    for (const auto& [key, ignored] : value.items()) { static_cast<void>(ignored); actual.push_back(key); }
    const auto& source = value.at("source");
    if (actual != expected || value.at("schemaVersion") != 1 ||
        source.at("package") != "opencc-js" || source.at("version") != "1.4.1" ||
        source.at("configuration") != "twp-to-cn" || !value.at("conversionStages").is_array() ||
        value.at("conversionStages").size() != 2) throw std::runtime_error("normalizer-invalid");
    data_ = std::make_unique<NormalizationData>(value);
}

Normalizer::~Normalizer() = default;

std::string Normalizer::apply(const std::string& raw) const {
    auto value = convert(nfkc(raw), data_->normalization);
    std::string converted;
    for (auto item : segment(value, data_->segmentation)) {
        for (const auto& stage : data_->stages) item = convert(item, stage);
        converted += item;
    }
    const auto input = characters(converted);
    std::string output;
    bool space = false;
    for (size_t index = 0; index < input.size(); ++index) {
        auto token = input[index];
        if (token == " " || token == "\t" || token == "\r" || token == "\n") { space = true; continue; }
        const bool previous_digit = index > 0 && input[index - 1].size() == 1 && std::isdigit(static_cast<unsigned char>(input[index - 1][0]));
        const bool next_digit = index + 1 < input.size() && input[index + 1].size() == 1 && std::isdigit(static_cast<unsigned char>(input[index + 1][0]));
        if (token == "," && !(previous_digit && next_digit)) token = "，";
        else if (token == "." && !(previous_digit && next_digit)) token = "。";
        else if (token == "!") token = "！";
        else if (token == "?") token = "？";
        const bool punctuation = token == "，" || token == "。" || token == "！" || token == "？";
        if (space && !output.empty() && !punctuation && !(han(characters(output).back()) && han(token))) output += ' ';
        if (punctuation && !output.empty() && output.back() == ' ') output.pop_back();
        output += token;
        space = false;
    }
    return output;
}
