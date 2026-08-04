#include "preparation_diagnostics.h"

#include <cerrno>
#include <string>
#include <unistd.h>

namespace {
constexpr const char *prefix = "AUTOBYTEUS_VOICE_PREP_V1 ";

bool valid_stage(const char *stage) {
  const std::string value(stage);
  return value == "manifest-verification" || value == "encoder-load" ||
         value == "language-model-load" || value == "context-create" ||
         value == "normalizer-load";
}

void write_all(const std::string &line) noexcept {
  std::size_t offset = 0;
  while (offset < line.size()) {
    const auto result =
        ::write(STDERR_FILENO, line.data() + offset, line.size() - offset);
    if (result > 0) {
      offset += static_cast<std::size_t>(result);
      continue;
    }
    if (result < 0 && errno == EINTR)
      continue;
    return;
  }
}
} // namespace

PreparationDiagnostics::PreparationDiagnostics() : origin_(Clock::now()) {}

void PreparationDiagnostics::start(const char *stage) { emit(stage, "start"); }

void PreparationDiagnostics::complete(const char *stage) {
  emit(stage, "complete");
}

void PreparationDiagnostics::emit(const char *stage,
                                  const char *event) noexcept {
  if (!valid_stage(stage) || sequence_ >= 10)
    return;
  const auto elapsed = std::chrono::duration_cast<std::chrono::microseconds>(
                           Clock::now() - origin_)
                           .count();
  const std::string line = std::string(prefix) +
                           "{\"elapsedUs\":" + std::to_string(elapsed) +
                           ",\"event\":\"" + event +
                           "\",\"sequence\":" + std::to_string(sequence_++) +
                           ",\"stage\":\"" + stage + "\"}\n";
  write_all(line);
}
