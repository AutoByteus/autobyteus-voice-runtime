#include "result_policy.h"
#include <stdexcept>

std::string classify_result(bool validator_no_speech, const std::string& raw) {
    if (validator_no_speech) {
        if (!raw.empty()) throw std::runtime_error("recognizer-ran-for-no-speech");
        return "no-speech";
    }
    if (raw.empty()) throw std::runtime_error("empty-recognizer-result");
    return "transcript";
}
