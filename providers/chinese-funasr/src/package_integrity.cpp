#include "package_integrity.h"

#include <array>
#include <fstream>
#include <stdexcept>

namespace package_integrity {
class AppleSha256 {
public:
  AppleSha256();
  ~AppleSha256();
  AppleSha256(const AppleSha256 &) = delete;
  AppleSha256 &operator=(const AppleSha256 &) = delete;
  void update(const void *bytes, std::size_t size);
  std::string finish();

private:
  struct State;
  State *state_;
};
} // namespace package_integrity

std::string sha256_bytes(const std::string &value) {
  package_integrity::AppleSha256 digest;
  digest.update(value.data(), value.size());
  return digest.finish();
}

std::string sha256_file_incremental_apple(const std::filesystem::path &path) {
  constexpr std::size_t buffer_size = 1024 * 1024;
  std::ifstream input(path, std::ios::binary);
  if (!input.is_open())
    throw std::runtime_error("file-open-failed");

  package_integrity::AppleSha256 digest;
  std::array<char, buffer_size> buffer{};
  while (true) {
    input.read(buffer.data(), static_cast<std::streamsize>(buffer.size()));
    const auto count = input.gcount();
    if (count > 0)
      digest.update(buffer.data(), static_cast<std::size_t>(count));
    if (input.bad() || (input.fail() && !input.eof()))
      throw std::runtime_error("file-read-failed");
    if (input.eof())
      break;
    if (count == 0)
      throw std::runtime_error("file-read-failed");
  }
  return digest.finish();
}
