#include "session.h"
#include "package_integrity.h"
#include <cstdlib>
#include <fcntl.h>
#include <fstream>
#include <regex>
#include <set>
#include <stdexcept>
#include <sys/stat.h>
namespace fs = std::filesystem;
using json = nlohmann::json;
namespace {
const std::regex sha("^[a-f0-9]{64}$"), uuid("^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"), relative("^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))(?!.*\\\\)[A-Za-z0-9._/-]+$");
void exact(const json& value,const std::set<std::string>& keys) { if (!value.is_object()) throw std::runtime_error("invalid-object"); std::set<std::string> actual; for (const auto& item:value.items()) actual.insert(item.key()); if(actual!=keys) throw std::runtime_error("invalid-fields"); }
json read_json(const fs::path& path) { if(!path.is_absolute()||fs::is_symlink(path)||!fs::is_regular_file(path)||fs::file_size(path)>1024*1024) throw std::runtime_error("invalid-json"); std::ifstream input(path); return json::parse(input); }
bool valid_sha(const json& value) { return value.is_string()&&std::regex_match(value.get<std::string>(),sha); }
bool valid_relative(const std::string& value) { return value.size()<=240&&std::regex_match(value,relative); }
fs::path directory(const fs::path& path) { if(!path.is_absolute()||fs::is_symlink(path)||!fs::is_directory(path)) throw std::runtime_error("invalid-directory"); return fs::canonical(path); }
fs::path regular(const fs::path& root,const std::string& value) { if(!valid_relative(value)) throw std::runtime_error("invalid-relative"); auto unresolved=root/value; for(auto current=unresolved;current!=root;current=current.parent_path()) if(current==current.root_path()||fs::is_symlink(fs::symlink_status(current))) throw std::runtime_error("path-link"); auto actual=fs::canonical(unresolved); auto rel=fs::relative(actual,root); if(rel.empty()||rel.native().starts_with("..")||!fs::is_regular_file(actual)||fs::is_symlink(actual)) throw std::runtime_error("path-escape"); return actual; }
std::pair<std::string,std::string> target() {
#if defined(__APPLE__) && (defined(__aarch64__) || defined(_M_ARM64))
    return {"darwin","arm64"};
#else
    return {"unsupported","unsupported"};
#endif
}
bool read_only_single_link(const fs::path& path) { struct stat value{}; return ::lstat(path.c_str(),&value)==0&&S_ISREG(value.st_mode)&&value.st_nlink==1&&(value.st_mode&0222)==0; }
void bind_activation(const json& config,const json& expected,const json& activation) {
    exact(activation,{"schemaVersion","installationId","profileId","languageMode","target","catalog","host","model","compatibilityPairSha256","capabilityDigest","decision","createdAt"});
    exact(activation.at("target"),{"platform","architecture"});
    exact(activation.at("host"),{"hostPackageId","providerId","descriptorSha256","fileManifestSha256","hostSourceClosureSha256","modelAdmissionRootSha256","compatibilityRequirementSha256"});
    exact(activation.at("model"),{"modelAssetId","modelId","manifestSha256","revision","layoutId","treeSha256","files"});
    if(activation.at("schemaVersion")!=1||activation.at("installationId")!=config.at("installationId")||activation.at("profileId")!=config.at("profileId")||activation.at("languageMode")!=expected.at("languageMode")||activation.at("target").at("platform")!=expected.at("platform")||activation.at("target").at("architecture")!=expected.at("architecture")||activation.at("host").at("hostPackageId")!=expected.at("hostPackageId")||activation.at("host").at("providerId")!=expected.at("providerId")||activation.at("host").at("descriptorSha256")!=expected.at("descriptorSha256")||activation.at("host").at("fileManifestSha256")!=expected.at("fileManifestSha256")||activation.at("host").at("hostSourceClosureSha256")!=expected.at("hostSourceClosureSha256")||activation.at("host").at("modelAdmissionRootSha256")!=expected.at("modelAdmissionRootSha256")||activation.at("model").at("modelId")!=expected.at("modelId")||activation.at("model").at("manifestSha256")!=expected.at("modelManifestSha256")||activation.at("model").at("treeSha256")!=expected.at("modelTreeSha256")||activation.at("compatibilityPairSha256")!=expected.at("compatibilityPairSha256")||activation.at("capabilityDigest")!=expected.at("capabilityDigest")||activation.at("decision")!="active") throw std::runtime_error("activation-mismatch");
}
}
fs::path BoundSession::resolve_host(const std::string& value) const { return regular(host_root,value); }
fs::path BoundSession::resolve_model(const std::string& value) const { return regular(model_root,value); }
BoundSession bind_session(const fs::path& host_input,const fs::path& activation_path,const fs::path& model_input,int lease_fd,const fs::path& config_path) {
    auto host=directory(host_input), model=directory(model_input); if(lease_fd<=2||fcntl(lease_fd,F_GETFD)==-1) throw std::runtime_error("invalid-lease");
    auto config=read_json(config_path); exact(config,{"schemaVersion","protocolVersion","sessionId","profileId","installationRoot","installationId","activationSha256","expected"});
    auto expected=config.at("expected"); exact(expected,{"hostPackageId","providerId","modelId","languageMode","platform","architecture","descriptorSha256","fileManifestSha256","hostSourceClosureSha256","modelAdmissionRootSha256","modelManifestSha256","modelTreeSha256","compatibilityPairSha256","capabilityDigest"});
    if(config.at("schemaVersion")!=2||config.at("protocolVersion")!=1||!config.at("sessionId").is_string()||!std::regex_match(config.at("sessionId").get<std::string>(),uuid)||!config.at("installationId").is_string()||!std::regex_match(config.at("installationId").get<std::string>(),uuid)||!config.at("activationSha256").is_string()||!std::regex_match(config.at("activationSha256").get<std::string>(),sha)||target()!=std::pair<std::string,std::string>{expected.at("platform"),expected.at("architecture")}) throw std::runtime_error("invalid-config");
    for(const auto* key:{"descriptorSha256","fileManifestSha256","hostSourceClosureSha256","modelAdmissionRootSha256","modelManifestSha256","modelTreeSha256","compatibilityPairSha256","capabilityDigest"}) if(!valid_sha(expected.at(key))) throw std::runtime_error("invalid-digest");
    const auto descriptor_path=regular(host,"provider/runtime-host-v2.json"); const auto descriptor=read_json(descriptor_path); if(sha256_file_incremental_apple(descriptor_path)!=expected.at("descriptorSha256")||descriptor.at("schemaVersion")!=2||descriptor.at("hostPackageId")!=expected.at("hostPackageId")||descriptor.at("providerId")!=expected.at("providerId")) throw std::runtime_error("host-mismatch");
    auto activation=read_json(activation_path); if(sha256_file_incremental_apple(activation_path)!=config.at("activationSha256")) throw std::runtime_error("activation-digest"); bind_activation(config,expected,activation);
    auto install=fs::path(config.at("installationRoot").get<std::string>()); auto expected_activation=install/"activations"/config.at("installationId").get<std::string>()/"profile-activation-v1.json"; auto expected_model=install/"models"/activation.at("model").at("modelAssetId").get<std::string>()/activation.at("model").at("manifestSha256").get<std::string>()/"files";
    if(fs::canonical(activation_path)!=fs::canonical(expected_activation)||model!=fs::canonical(expected_model)) throw std::runtime_error("private-path-mismatch");
    return {host,model,config.at("sessionId"),config.at("profileId"),expected.at("languageMode"),expected.at("hostPackageId"),expected.at("providerId"),expected.at("modelId"),expected.at("platform"),expected.at("architecture"),expected.at("capabilityDigest"),activation,lease_fd};
}
void verify_complete_manifest(const BoundSession& session) {
    const auto& records=session.activation.at("model").at("files"); if(!records.is_array()||records.empty()) throw std::runtime_error("empty-model"); std::set<std::string> expected; json rows=json::array(); std::string previous;
    for(const auto& record:records) { exact(record,{"path","role","sizeBytes","sha256","mode"}); const auto relative_path=record.at("path").get<std::string>(); if(!valid_relative(relative_path)||(!previous.empty()&&relative_path<=previous)||record.at("mode")!="read-only"||!valid_sha(record.at("sha256"))) throw std::runtime_error("invalid-model-record"); previous=relative_path; const auto file=session.resolve_model(relative_path); if(!read_only_single_link(file)||fs::file_size(file)!=record.at("sizeBytes").get<std::uintmax_t>()||sha256_file_incremental_apple(file)!=record.at("sha256")) throw std::runtime_error("model-file-mismatch"); expected.insert(relative_path); rows.push_back({relative_path,record.at("sizeBytes"),record.at("sha256")}); }
    std::set<std::string> actual; for(const auto& item:fs::recursive_directory_iterator(session.model_root)) { if(item.is_symlink()) throw std::runtime_error("model-link"); if(item.is_regular_file()) actual.insert(fs::relative(item.path(),session.model_root).generic_string()); } if(actual!=expected||sha256_bytes(rows.dump()+"\n")!=session.activation.at("model").at("treeSha256")) throw std::runtime_error("model-closure-mismatch");
}
ScratchCleanup::ScratchCleanup(const fs::path& host_root) { const char* home=std::getenv("HOME"); const char* temporary=std::getenv("TMPDIR"); if(!home||!temporary||std::string(home)!=temporary) return; try { fs::path value(home); auto root=fs::canonical(host_root); auto marker=value/".autobyteus-voice-scratch-v1"; std::ifstream input(marker); std::string contents((std::istreambuf_iterator<char>(input)),{}); if(value.is_absolute()&&value.filename().string().starts_with("autobyteus-voice-")&&!fs::is_symlink(value)&&contents=="autobyteus-voice-scratch-v1\n"&&fs::relative(value,root).native().starts_with("..")&&fs::relative(root,value).native().starts_with("..")) scratch_=value; } catch(...) {} }
ScratchCleanup::~ScratchCleanup() { if(scratch_.empty()) return; std::error_code error; fs::permissions(scratch_,fs::perms::owner_all,fs::perm_options::add,error); fs::remove_all(scratch_,error); }
