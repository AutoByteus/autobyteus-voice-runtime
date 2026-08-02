#include "normalization.h"
#include "result_policy.h"
#include <fstream>
#include <iostream>
#include <nlohmann/json.hpp>
#include <stdexcept>
#include <string>

int main(int argc, char** argv) {
    try {
        if (argc != 3) throw std::runtime_error("expected mapping and fixtures");
        Normalizer normalizer(argv[1]);
        std::ifstream input(argv[2]);
        const auto fixtures = nlohmann::json::parse(input).at("fixtures");
        for (const auto& fixture : fixtures) {
            if (fixture.at("profileId") != "chinese") continue;
            const auto actual = normalizer.apply(fixture.at("raw").get<std::string>());
            if (actual != fixture.at("normalized").get<std::string>())
                throw std::runtime_error("normalization mismatch: " + fixture.at("id").get<std::string>());
        }
        if (classify_result(true, "") != "no-speech") throw std::runtime_error("no-speech mismatch");
        if (classify_result(false, "你好") != "transcript") throw std::runtime_error("transcript mismatch");
        try {
            static_cast<void>(classify_result(false, ""));
            throw std::runtime_error("empty speech result accepted");
        } catch (const std::runtime_error& error) {
            if (std::string(error.what()) != "empty-recognizer-result") throw;
        }
        return 0;
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return 1;
    }
}
