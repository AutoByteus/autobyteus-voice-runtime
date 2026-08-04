#pragma once
#include <filesystem>
#include <nlohmann/json.hpp>
#include <string>
#include <vector>
struct BoundSession { std::filesystem::path root; std::string session_id,profile_id,language_mode,package_id,provider_id,model_id,platform,architecture,capability_digest; nlohmann::json descriptor; nlohmann::json manifest; std::filesystem::path resolve(const std::string& relative) const; };
class ScratchCleanup { public: explicit ScratchCleanup(const std::filesystem::path& package_root); ~ScratchCleanup(); ScratchCleanup(const ScratchCleanup&)=delete; ScratchCleanup& operator=(const ScratchCleanup&)=delete; private: std::filesystem::path scratch_; };
BoundSession bind_session(const std::filesystem::path& root,const std::filesystem::path& config);
void verify_complete_manifest(const BoundSession& session);
