#pragma once

#include <chrono>
#include <cstdint>

class PreparationDiagnostics {
public:
  PreparationDiagnostics();
  void start(const char *stage);
  void complete(const char *stage);

private:
  using Clock = std::chrono::steady_clock;
  void emit(const char *stage, const char *event) noexcept;
  Clock::time_point origin_;
  std::uint64_t sequence_ = 0;
};
