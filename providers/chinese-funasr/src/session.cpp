#include "session.h"
#include "sha256.h"
#include <fstream>
#include <cstdlib>
#include <map>
#include <regex>
#include <set>
#include <stdexcept>
#include <tuple>
#if defined(_WIN32)
#include <windows.h>
#endif
namespace fs = std::filesystem;
using json = nlohmann::json;
namespace {
const std::regex sha("^[a-f0-9]{64}$");
const std::regex commit("^[a-f0-9]{40}$");
const std::regex semver("^[0-9]+\\.[0-9]+\\.[0-9]+$");
const std::regex uuid("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$");
const std::regex relative("^(?!/)(?!.*(?:^|/)\\.\\.?(?:/|$))(?!.*\\\\)[A-Za-z0-9._/-]+$");
void exact_keys(const json& value, const std::set<std::string>& expected) {
    if (!value.is_object()) throw std::runtime_error("invalid-object");
    std::set<std::string> actual;
    for (const auto& item : value.items()) actual.insert(item.key());
    if (actual != expected) throw std::runtime_error("invalid-fields");
}
json read_json(const fs::path& path) {
    if (!path.is_absolute() || !fs::is_regular_file(path) || fs::is_symlink(path) || fs::file_size(path) > 1024 * 1024) throw std::runtime_error("invalid-json-file");
    std::ifstream input(path);
    return json::parse(input);
}
bool text(const json& value) { return value.is_string() && !value.get_ref<const std::string&>().empty(); }
bool path_value(const json& value) { return value.is_string() && value.get_ref<const std::string&>().size() <= 240 && std::regex_match(value.get_ref<const std::string&>(), relative); }
bool digest_value(const json& value) { return value.is_string() && std::regex_match(value.get_ref<const std::string&>(), sha); }
fs::path contained_regular(const fs::path& root, const std::string& value) {
    if (value.size() > 240 || !std::regex_match(value, relative)) throw std::runtime_error("invalid-path");
    const auto unresolved = root / value;
    for (auto current = unresolved; current != root; current = current.parent_path()) {
        if (current == current.root_path() || fs::is_symlink(fs::symlink_status(current))) throw std::runtime_error("path-link");
    }
    const auto candidate = fs::canonical(unresolved);
    const auto contained = fs::relative(candidate, root);
    if (contained.empty() || contained.native().starts_with("..") || !fs::is_regular_file(candidate) || fs::is_symlink(candidate)) throw std::runtime_error("path-escape");
    return candidate;
}
std::pair<std::string, std::string> actual_target() {
#if defined(_WIN32)
    const std::string platform = "win32";
#elif defined(__APPLE__)
    const std::string platform = "darwin";
#else
    const std::string platform = "linux";
#endif
#if defined(__aarch64__) || defined(_M_ARM64)
    const std::string architecture = "arm64";
#else
    const std::string architecture = "x64";
#endif
    return {platform, architecture};
}
void validate_descriptor_shape(const json& descriptor) {
    exact_keys(descriptor, {"schemaVersion","packageId","packageVersion","providerId","sourceCommit","target","protocolVersion","sessionConfigVersion","launcher","launcherPlan","host","worker","engine","model","profiles","audioContract","fileManifestPath","noticeInventoryPath"});
    exact_keys(descriptor.at("target"), {"platform","architecture"});
    exact_keys(descriptor.at("launcherPlan"), {"path","sha256"});
    exact_keys(descriptor.at("host"), {"kind","version","executable","sha256"});
    exact_keys(descriptor.at("worker"), {"entrypoint","sha256"});
    exact_keys(descriptor.at("engine"), {"kind","version","configuration"});
    exact_keys(descriptor.at("engine").at("configuration"), {"path","sha256"});
    exact_keys(descriptor.at("model"), {"id","family","size","precision","root","descriptor","sha256"});
    if (descriptor.at("schemaVersion") != 1 || descriptor.at("protocolVersion") != 1 || descriptor.at("sessionConfigVersion") != 1 || !text(descriptor.at("packageId")) || !text(descriptor.at("providerId")) || !descriptor.at("packageVersion").is_string() || !std::regex_match(descriptor.at("packageVersion").get<std::string>(), semver) || !descriptor.at("sourceCommit").is_string() || !std::regex_match(descriptor.at("sourceCommit").get<std::string>(), commit)) throw std::runtime_error("invalid-descriptor-version");
    const auto& target = descriptor.at("target");
    if (!target.at("platform").is_string() || !target.at("architecture").is_string() || !std::set<std::string>{"darwin","linux","win32"}.contains(target.at("platform").get<std::string>()) || !std::set<std::string>{"arm64","x64"}.contains(target.at("architecture").get<std::string>())) throw std::runtime_error("invalid-descriptor-target");
    const auto launcher = target.at("platform") == "win32" ? "bin/voice-provider.exe" : "bin/voice-provider";
    if (descriptor.at("launcher") != launcher) throw std::runtime_error("invalid-descriptor-launcher");
    if (!descriptor.at("host").at("kind").is_string() || !std::set<std::string>{"bundled-python","native"}.contains(descriptor.at("host").at("kind").get<std::string>()) || !descriptor.at("engine").at("kind").is_string() || !std::set<std::string>{"mlx-whisper","faster-whisper","funasr-native"}.contains(descriptor.at("engine").at("kind").get<std::string>())) throw std::runtime_error("invalid-descriptor-implementation");
    for (const auto* key : {"version"}) if (!text(descriptor.at("host").at(key)) || !text(descriptor.at("engine").at(key))) throw std::runtime_error("invalid-descriptor-value");
    for (const auto* key : {"id","family","size","precision"}) if (!text(descriptor.at("model").at(key))) throw std::runtime_error("invalid-descriptor-model");
    for (const auto& value : {descriptor.at("launcher"),descriptor.at("launcherPlan").at("path"),descriptor.at("host").at("executable"),descriptor.at("worker").at("entrypoint"),descriptor.at("engine").at("configuration").at("path"),descriptor.at("model").at("root"),descriptor.at("model").at("descriptor")}) if (!path_value(value)) throw std::runtime_error("invalid-descriptor-path");
    for (const auto& value : {descriptor.at("launcherPlan").at("sha256"),descriptor.at("host").at("sha256"),descriptor.at("worker").at("sha256"),descriptor.at("engine").at("configuration").at("sha256"),descriptor.at("model").at("sha256")}) if (!digest_value(value)) throw std::runtime_error("invalid-descriptor-digest");
    if (!descriptor.at("model").at("descriptor").get<std::string>().starts_with(descriptor.at("model").at("root").get<std::string>() + "/")) throw std::runtime_error("invalid-descriptor-model-path");
    const auto& profiles = descriptor.at("profiles");
    if (!profiles.is_array() || profiles.empty() || profiles.size() > 2) throw std::runtime_error("invalid-descriptor-profiles");
    std::set<std::string> profile_ids;
    for (const auto& profile : profiles) {
        exact_keys(profile, {"profileId","languageMode","normalizationProfile","capabilities"});
        exact_keys(profile.at("capabilities"), {"maxInFlightRequests","rawAndNormalizedText","noSpeech"});
        if (!profile.at("profileId").is_string() || !profile.at("languageMode").is_string() || !profile.at("normalizationProfile").is_string()) throw std::runtime_error("invalid-descriptor-profile");
        const auto identity = std::make_tuple(profile.at("profileId").get<std::string>(), profile.at("languageMode").get<std::string>(), profile.at("normalizationProfile").get<std::string>());
        if (!std::set<std::tuple<std::string,std::string,std::string>>{{"english","en","autobyteus-english-v1"},{"chinese","zh","autobyteus-simplified-zh-v1"},{"auto","auto","autobyteus-auto-v1"}}.contains(identity) || !profile_ids.insert(std::get<0>(identity)).second || profile.at("capabilities") != json{{"maxInFlightRequests",1},{"rawAndNormalizedText",true},{"noSpeech",true}}) throw std::runtime_error("invalid-descriptor-profile");
    }
    if (descriptor.at("audioContract") != "autobyteus-pcm16-mono-16khz-wav-v1" || descriptor.at("fileManifestPath") != "provider/package-files-v1.json" || descriptor.at("noticeInventoryPath") != "THIRD_PARTY_NOTICES.json") throw std::runtime_error("invalid-descriptor-contract");
}
}
fs::path BoundSession::resolve(const std::string& value) const {
    return contained_regular(root, value);
}
ScratchCleanup::ScratchCleanup(const fs::path& package_root) {
#if !defined(_WIN32)
    const char* home = std::getenv("HOME");
    const char* temporary = std::getenv("TMPDIR");
    if (home == nullptr || temporary == nullptr || std::string(home) != temporary) return;
    const fs::path unresolved(home);
    if (!unresolved.is_absolute() || !unresolved.filename().string().starts_with("autobyteus-voice-") || fs::is_symlink(unresolved)) return;
    try {
        const auto scratch = fs::canonical(unresolved);
        const auto root = fs::canonical(package_root);
        const auto marker = scratch / ".autobyteus-voice-scratch-v1";
        const auto root_from_scratch = fs::relative(root, scratch);
        const auto scratch_from_root = fs::relative(scratch, root);
        if (!fs::is_directory(scratch) || fs::is_symlink(marker) || !fs::is_regular_file(marker) || !root_from_scratch.native().starts_with("..") || !scratch_from_root.native().starts_with("..")) return;
        std::ifstream input(marker);
        std::string contents((std::istreambuf_iterator<char>(input)), {});
        if (contents == "autobyteus-voice-scratch-v1\n") scratch_ = scratch;
    } catch (...) {}
#else
    static_cast<void>(package_root);
#endif
}
ScratchCleanup::~ScratchCleanup() {
#if !defined(_WIN32)
    if (scratch_.empty()) return;
    std::error_code error;
    try {
        for (const auto& item : fs::recursive_directory_iterator(scratch_, fs::directory_options::skip_permission_denied, error)) fs::permissions(item.path(), fs::perms::owner_all, fs::perm_options::add, error);
    } catch (...) {}
    fs::permissions(scratch_, fs::perms::owner_all, fs::perm_options::add, error);
    fs::remove_all(scratch_, error);
#endif
}
bool mode_matches(const fs::path& file, const std::string& logical) {
#if defined(_WIN32)
    const auto attributes = GetFileAttributesW(file.c_str());
    return attributes != INVALID_FILE_ATTRIBUTES && (attributes & FILE_ATTRIBUTE_READONLY) != 0 && (attributes & FILE_ATTRIBUTE_REPARSE_POINT) == 0;
#else
    const auto actual = fs::status(file).permissions() & fs::perms::mask;
    const auto expected = logical == "executable" ? fs::perms::owner_read | fs::perms::owner_exec | fs::perms::group_read | fs::perms::group_exec | fs::perms::others_read | fs::perms::others_exec : logical == "read-only" ? fs::perms::owner_read | fs::perms::group_read | fs::perms::others_read : fs::perms::unknown;
    return actual == expected;
#endif
}
BoundSession bind_session(const fs::path& root_input, const fs::path& config_path) {
    if (!root_input.is_absolute() || !config_path.is_absolute() || !fs::is_directory(root_input) || fs::is_symlink(root_input)) throw std::runtime_error("invalid-private-path");
    const auto root = fs::canonical(root_input);
    const auto config = read_json(config_path);
    exact_keys(config, {"schemaVersion","protocolVersion","sessionId","profileId","expected"});
    const auto expected = config.at("expected");
    exact_keys(expected, {"packageId","providerId","modelId","languageMode","platform","architecture","descriptorSha256","fileManifestSha256","capabilityDigest"});
    if (config["schemaVersion"] != 1 || config["protocolVersion"] != 1 || !config["sessionId"].is_string() || !std::regex_match(config["sessionId"].get<std::string>(), uuid) || !config["profileId"].is_string()) throw std::runtime_error("invalid-config");
    for (const auto* key : {"packageId","providerId","modelId"}) if (!text(expected.at(key))) throw std::runtime_error("invalid-expected-identity");
    if (!expected["languageMode"].is_string() || !std::set<std::string>{"en","zh","auto"}.contains(expected["languageMode"].get<std::string>()) || !expected["platform"].is_string() || !std::set<std::string>{"darwin","linux","win32"}.contains(expected["platform"].get<std::string>()) || !expected["architecture"].is_string() || !std::set<std::string>{"arm64","x64"}.contains(expected["architecture"].get<std::string>())) throw std::runtime_error("invalid-expected-target");
    for (const auto* key : {"descriptorSha256","fileManifestSha256","capabilityDigest"}) if (!std::regex_match(expected[key].get<std::string>(), sha)) throw std::runtime_error("invalid-digest");
    const auto descriptor_path = contained_regular(root, "provider/provider-package-v1.json");
    const auto manifest_path = contained_regular(root, "provider/package-files-v1.json");
    const auto descriptor = read_json(descriptor_path);
    const auto manifest = read_json(manifest_path);
    if (sha256_file(descriptor_path) != expected["descriptorSha256"].get<std::string>() || sha256_file(manifest_path) != expected["fileManifestSha256"].get<std::string>() || !mode_matches(manifest_path, "read-only")) throw std::runtime_error("control-digest");
    validate_descriptor_shape(descriptor);
    exact_keys(manifest, {"schemaVersion","packageId","files"});
    if (manifest.at("schemaVersion") != 1 || !text(manifest.at("packageId")) || !manifest.at("files").is_array() || manifest.at("files").empty()) throw std::runtime_error("invalid-manifest");
    const std::string profile = config["profileId"].get<std::string>();
    const std::string language = expected["languageMode"].get<std::string>();
    if ((profile != "chinese" || language != "zh") && !(profile == "auto" && language == "auto")) throw std::runtime_error("invalid-profile");
    const auto target = actual_target();
    if (descriptor["schemaVersion"] != 1 || descriptor["protocolVersion"] != 1 || descriptor["sessionConfigVersion"] != 1 || descriptor["packageId"] != expected["packageId"] || manifest["packageId"] != expected["packageId"] || descriptor["providerId"] != expected["providerId"] || descriptor["model"]["id"] != expected["modelId"] || descriptor["target"]["platform"] != expected["platform"] || descriptor["target"]["architecture"] != expected["architecture"] || target.first != expected["platform"].get<std::string>() || target.second != expected["architecture"].get<std::string>()) throw std::runtime_error("identity-mismatch");
    json selected;
    int profile_count = 0;
    for (const auto& item : descriptor["profiles"]) if (item["profileId"] == profile && item["languageMode"] == language) { selected = item; ++profile_count; }
    if (profile_count != 1 || sha256_bytes(selected["capabilities"].dump()) != expected["capabilityDigest"].get<std::string>()) throw std::runtime_error("capability-mismatch");
    BoundSession session{
        root,
        config["sessionId"].get<std::string>(),
        profile,
        language,
        expected["packageId"].get<std::string>(),
        expected["providerId"].get<std::string>(),
        expected["modelId"].get<std::string>(),
        expected["platform"].get<std::string>(),
        expected["architecture"].get<std::string>(),
        expected["capabilityDigest"].get<std::string>(),
        descriptor,
        manifest,
    };
    std::map<std::string, json> records;
    std::string previous_path;
    for (const auto& record : manifest["files"]) {
        exact_keys(record, {"path","sha256","sizeBytes","mode"});
        if (!path_value(record["path"]) || !digest_value(record["sha256"]) || !record["sizeBytes"].is_number_unsigned() || !record["mode"].is_string() || !std::set<std::string>{"executable","read-only"}.contains(record["mode"].get<std::string>())) throw std::runtime_error("invalid-manifest-record");
        const auto record_path = record["path"].get<std::string>();
        if ((!previous_path.empty() && record_path <= previous_path) || !records.emplace(record_path, record).second) throw std::runtime_error("duplicate-or-unsorted-manifest-path");
        previous_path = record_path;
    }
    const std::map<std::string, std::string> identities = {
        {descriptor["launcherPlan"]["path"].get<std::string>(), descriptor["launcherPlan"]["sha256"].get<std::string>()},
        {descriptor["host"]["executable"].get<std::string>(), descriptor["host"]["sha256"].get<std::string>()},
        {descriptor["worker"]["entrypoint"].get<std::string>(), descriptor["worker"]["sha256"].get<std::string>()},
        {descriptor["engine"]["configuration"]["path"].get<std::string>(), descriptor["engine"]["configuration"]["sha256"].get<std::string>()},
    };
    std::set<std::string> controls = {
        descriptor["launcher"].get<std::string>(),
        descriptor["model"]["descriptor"].get<std::string>(),
    };
    for (const auto& [relative, digest] : identities) {
        static_cast<void>(digest);
        controls.insert(relative);
    }
    for (const auto& [relative, record] : records)
        if (relative.starts_with("provider/") || relative.starts_with("worker/") || relative.starts_with("normalizer/") || relative.starts_with("contracts/")) controls.insert(relative);
    for (const auto& relative : controls) {
        const auto file = session.resolve(relative);
        const auto record = records.at(relative);
        const auto digest = sha256_file(file);
        if (digest != record["sha256"].get<std::string>() || fs::file_size(file) != record["sizeBytes"].get<std::uintmax_t>() || !mode_matches(file, record["mode"].get<std::string>())) throw std::runtime_error("control-identity-mismatch");
        if (identities.contains(relative) && digest != identities.at(relative)) throw std::runtime_error("descriptor-control-identity-mismatch");
    }
    if (records.at(descriptor["launcher"].get<std::string>())["mode"] != "executable" || records.at(descriptor["host"]["executable"].get<std::string>())["mode"] != "executable") throw std::runtime_error("executable-mode-mismatch");
    return session;
}
void verify_complete_manifest(const BoundSession& session) {
    std::set<std::string> expected;
    for (const auto& record : session.manifest["files"]) {
        const auto relative = record["path"].get<std::string>();
        if (!expected.insert(relative).second) throw std::runtime_error("duplicate-manifest-path");
        const auto file = session.resolve(relative);
        if (fs::file_size(file) != record["sizeBytes"].get<std::uintmax_t>() || sha256_file(file) != record["sha256"].get<std::string>() || !mode_matches(file, record["mode"].get<std::string>())) throw std::runtime_error("file-identity-mismatch");
    }
    if (!mode_matches(session.resolve("provider/package-files-v1.json"), "read-only")) throw std::runtime_error("manifest-mode-mismatch");
    std::set<std::string> actual;
    for (const auto& item : fs::recursive_directory_iterator(session.root)) {
        if (item.is_symlink()) throw std::runtime_error("package-link-rejected");
        if (item.is_regular_file()) actual.insert(fs::relative(item.path(), session.root).generic_string());
    }
    expected.insert("provider/package-files-v1.json");
    if (expected != actual) throw std::runtime_error("manifest-closure-mismatch");
    session.resolve(session.descriptor.at("noticeInventoryPath").get<std::string>());
    session.resolve(session.descriptor.at("model").at("descriptor").get<std::string>());
    const auto model_root = session.descriptor.at("model").at("root").get<std::string>();
    const auto unresolved_model_directory = session.root / model_root;
    for (auto current = unresolved_model_directory; current != session.root; current = current.parent_path())
        if (current == current.root_path() || fs::is_symlink(fs::symlink_status(current))) throw std::runtime_error("model-root-link");
    const auto model_directory = fs::canonical(unresolved_model_directory);
    const auto contained = fs::relative(model_directory, session.root);
    if (contained.empty() || contained.native().starts_with("..") || !fs::is_directory(model_directory) || fs::is_symlink(model_directory)) throw std::runtime_error("model-root-invalid");
    const auto prefix = model_root + "/";
    json model_records = json::array();
    for (const auto& record : session.manifest["files"]) {
        const auto relative = record.at("path").get<std::string>();
        if (relative.starts_with(prefix)) model_records.push_back({relative.substr(prefix.size()),record.at("sizeBytes"),record.at("sha256")});
    }
    if (model_records.empty() || sha256_bytes(model_records.dump() + "\n") != session.descriptor.at("model").at("sha256").get<std::string>()) throw std::runtime_error("model-tree-identity-mismatch");
}
