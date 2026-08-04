#include <CommonCrypto/CommonDigest.h>

#include <array>
#include <cstddef>
#include <iomanip>
#include <sstream>
#include <stdexcept>
#include <string>

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

struct AppleSha256::State {
  CC_SHA256_CTX context{};
  bool finished = false;
};

AppleSha256::AppleSha256() : state_(new State()) {
  if (CC_SHA256_Init(&state_->context) != 1) {
    delete state_;
    state_ = nullptr;
    throw std::runtime_error("digest-init-failed");
  }
}

AppleSha256::~AppleSha256() { delete state_; }

void AppleSha256::update(const void *bytes, std::size_t size) {
  if (!state_ || state_->finished ||
      CC_SHA256_Update(&state_->context, bytes, size) != 1)
    throw std::runtime_error("digest-update-failed");
}

std::string AppleSha256::finish() {
  if (!state_ || state_->finished)
    throw std::runtime_error("digest-final-failed");
  std::array<unsigned char, CC_SHA256_DIGEST_LENGTH> bytes{};
  if (CC_SHA256_Final(bytes.data(), &state_->context) != 1)
    throw std::runtime_error("digest-final-failed");
  state_->finished = true;
  std::ostringstream result;
  result << std::hex << std::setfill('0');
  for (const auto byte : bytes)
    result << std::setw(2) << static_cast<unsigned int>(byte);
  return result.str();
}
} // namespace package_integrity
