#pragma once
#include <filesystem>
#include <nlohmann/json.hpp>
#include <string>
struct BoundSession {
    std::filesystem::path host_root, model_root;
    std::string session_id, profile_id, language_mode, package_id, provider_id, model_id, platform, architecture, capability_digest;
    nlohmann::json activation;
    int lease_fd = -1;
    std::filesystem::path resolve_host(const std::string& relative) const;
    std::filesystem::path resolve_model(const std::string& relative) const;
};
class ScratchCleanup { public: explicit ScratchCleanup(const std::filesystem::path& host_root); ~ScratchCleanup(); ScratchCleanup(const ScratchCleanup&)=delete; ScratchCleanup& operator=(const ScratchCleanup&)=delete; private: std::filesystem::path scratch_; };
BoundSession bind_session(const std::filesystem::path& host_root,const std::filesystem::path& activation_path,const std::filesystem::path& model_root,int lease_fd,const std::filesystem::path& config_path);
void verify_complete_manifest(const BoundSession& session);
