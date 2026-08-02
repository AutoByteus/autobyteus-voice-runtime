import hashlib
import json
import os
import platform
import re
import shutil
import stat
import sys
from dataclasses import dataclass
from pathlib import Path
from types import MappingProxyType
from .exact_json import ContractError, exact_object, load_json

SHA = re.compile(r"^[a-f0-9]{64}$")
COMMIT = re.compile(r"^[a-f0-9]{40}$")
SEMVER = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")
UUID = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")
RELATIVE = re.compile(r"^(?!/)(?!.*(?:^|/)\.\.?(?:/|$))(?!.*\\)[A-Za-z0-9._/-]+$")
CONFIG_KEYS = {"schemaVersion", "protocolVersion", "sessionId", "profileId", "expected"}
EXPECTED_KEYS = {"packageId", "providerId", "modelId", "languageMode", "platform", "architecture", "descriptorSha256", "fileManifestSha256", "capabilityDigest"}
DESCRIPTOR_KEYS = {"schemaVersion", "packageId", "packageVersion", "providerId", "sourceCommit", "target", "protocolVersion", "sessionConfigVersion", "launcher", "launcherPlan", "host", "worker", "engine", "model", "profiles", "audioContract", "fileManifestPath", "noticeInventoryPath"}

@dataclass(frozen=True)
class BoundProviderSession:
    session_id: str
    profile_id: str
    language_mode: str
    package_id: str
    provider_id: str
    model_id: str
    target: tuple[str, str]
    capability_digest: str
    package_root: Path
    descriptor: MappingProxyType
    manifest: tuple[MappingProxyType, ...]

    def resolve(self, relative: str) -> Path:
        return _contained_regular(self.package_root, relative)

    def resolve_directory(self, relative: str) -> Path:
        if not RELATIVE.fullmatch(relative):
            raise ContractError("invalid-contained-path")
        unresolved = self.package_root / Path(relative)
        if any(item.is_symlink() for item in _lineage(unresolved, self.package_root)):
            raise ContractError("contained-directory-link")
        candidate = unresolved.resolve(strict=True)
        if self.package_root not in candidate.parents or not candidate.is_dir():
            raise ContractError("contained-directory-escape")
        return candidate

def bind_session(package_root: Path, config_path: Path) -> BoundProviderSession:
    root = package_root.resolve(strict=True)
    config = exact_object(load_json(config_path), CONFIG_KEYS, "session-config")
    expected = exact_object(config["expected"], EXPECTED_KEYS, "expected-identity")
    if config["schemaVersion"] != 1 or config["protocolVersion"] != 1 or not isinstance(config["sessionId"], str) or not UUID.fullmatch(config["sessionId"]):
        raise ContractError("invalid-session-identity")
    profile, language = config["profileId"], expected["languageMode"]
    if (profile, language) not in {("english", "en"), ("chinese", "zh"), ("auto", "auto")}:
        raise ContractError("invalid-profile-language")
    for key in ("descriptorSha256", "fileManifestSha256", "capabilityDigest"):
        if not isinstance(expected[key], str) or not SHA.fullmatch(expected[key]):
            raise ContractError("invalid-digest")
    if not all(_text(expected[key]) for key in ("packageId", "providerId", "modelId")) or expected["platform"] not in {"darwin", "linux", "win32"} or expected["architecture"] not in {"arm64", "x64"} or (expected["platform"], expected["architecture"]) != _actual_target():
        raise ContractError("invalid-expected-identity")
    descriptor_path = _contained_regular(root, "provider/provider-package-v1.json")
    manifest_path = _contained_regular(root, "provider/package-files-v1.json")
    descriptor_bytes, manifest_bytes = descriptor_path.read_bytes(), manifest_path.read_bytes()
    if _digest(descriptor_bytes) != expected["descriptorSha256"] or _digest(manifest_bytes) != expected["fileManifestSha256"] or not _mode_matches(manifest_path, "read-only"):
        raise ContractError("control-identity-mismatch")
    descriptor = exact_object(json.loads(descriptor_bytes), DESCRIPTOR_KEYS, "descriptor")
    manifest = exact_object(json.loads(manifest_bytes), {"schemaVersion", "packageId", "files"}, "manifest")
    _validate_descriptor(descriptor)
    _match_identity(config, expected, descriptor, manifest)
    records = _control_records(root, manifest)
    _verify_control(root, descriptor, records)
    frozen_descriptor = _freeze(descriptor)
    frozen_manifest = tuple(_freeze(record) for record in manifest["files"])
    return BoundProviderSession(config["sessionId"], profile, language, expected["packageId"], expected["providerId"], expected["modelId"], (expected["platform"], expected["architecture"]), expected["capabilityDigest"], root, frozen_descriptor, frozen_manifest)

def verify_complete_manifest(session: BoundProviderSession):
    paths = set()
    for record in session.manifest:
        path = record.get("path")
        if path in paths or not isinstance(path, str):
            raise ContractError("manifest-path-invalid")
        paths.add(path)
        candidate = session.resolve(path)
        if candidate.stat().st_size != record.get("sizeBytes") or _digest(candidate.read_bytes()) != record.get("sha256") or not _mode_matches(candidate, record.get("mode")):
            raise ContractError("manifest-file-mismatch")
    manifest_file = session.resolve("provider/package-files-v1.json")
    if not _mode_matches(manifest_file, "read-only"):
        raise ContractError("manifest-mode-mismatch")
    actual = set()
    for item in session.package_root.rglob("*"):
        if item.is_symlink():
            raise ContractError("package-link-rejected")
        if item.is_file():
            actual.add(item.relative_to(session.package_root).as_posix())
    if actual != paths | {"provider/package-files-v1.json"}:
        raise ContractError("manifest-closure-mismatch")
    session.resolve(session.descriptor["noticeInventoryPath"])
    session.resolve(session.descriptor["model"]["descriptor"])
    session.resolve_directory(session.descriptor["model"]["root"])
    prefix = session.descriptor["model"]["root"] + "/"
    model_records = [[record["path"][len(prefix):], record["sizeBytes"], record["sha256"]] for record in session.manifest if record["path"].startswith(prefix)]
    model_digest = _digest((json.dumps(model_records, ensure_ascii=False, separators=(",", ":")) + "\n").encode())
    if not model_records or model_digest != session.descriptor["model"]["sha256"]:
        raise ContractError("model-tree-identity-mismatch")

def _match_identity(config, expected, descriptor, manifest):
    target = descriptor.get("target", {})
    profiles = descriptor.get("profiles", [])
    chosen = [item for item in profiles if item.get("profileId") == config["profileId"] and item.get("languageMode") == expected["languageMode"]]
    facts = (descriptor.get("schemaVersion") == 1, descriptor.get("protocolVersion") == 1, descriptor.get("sessionConfigVersion") == 1, descriptor.get("packageId") == expected["packageId"] == manifest.get("packageId"), descriptor.get("providerId") == expected["providerId"], descriptor.get("model", {}).get("id") == expected["modelId"], target.get("platform") == expected["platform"], target.get("architecture") == expected["architecture"], len(chosen) == 1)
    if not all(facts):
        raise ContractError("session-descriptor-mismatch")
    capability = json.dumps(chosen[0]["capabilities"], ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()
    if _digest(capability) != expected["capabilityDigest"]:
        raise ContractError("capability-mismatch")

def _control_records(root, manifest):
    if manifest.get("schemaVersion") != 1 or not _text(manifest.get("packageId")) or not isinstance(manifest.get("files"), list) or not manifest["files"]:
        raise ContractError("manifest-invalid")
    for item in manifest["files"]:
        exact_object(item, {"path", "sha256", "sizeBytes", "mode"}, "manifest-record")
        if not _path(item["path"]) or not _sha(item["sha256"]) or type(item["sizeBytes"]) is not int or item["sizeBytes"] < 0 or item["mode"] not in {"executable", "read-only"}:
            raise ContractError("manifest-record-invalid")
    manifest_paths = [item["path"] for item in manifest["files"]]
    if manifest_paths != sorted(manifest_paths):
        raise ContractError("manifest-not-sorted")
    records = {item["path"]: item for item in manifest["files"]}
    if len(records) != len(manifest["files"]):
        raise ContractError("manifest-duplicates")
    return records

def _verify_control(root, descriptor, records):
    identities = {
        descriptor["launcherPlan"]["path"]: descriptor["launcherPlan"]["sha256"],
        descriptor["host"]["executable"]: descriptor["host"]["sha256"],
        descriptor["worker"]["entrypoint"]: descriptor["worker"]["sha256"],
        descriptor["engine"]["configuration"]["path"]: descriptor["engine"]["configuration"]["sha256"],
    }
    paths = {descriptor["launcher"], descriptor["model"]["descriptor"], *identities}
    paths.update(relative for relative in records if relative.startswith(("provider/", "worker/", "normalizer/", "contracts/")))
    for relative in paths:
        record = records.get(relative)
        candidate = _contained_regular(root, relative)
        if record is None or candidate.stat().st_size != record.get("sizeBytes") or _digest(candidate.read_bytes()) != record.get("sha256") or not _mode_matches(candidate, record.get("mode")):
            raise ContractError("control-file-mismatch")
        if relative in identities and record["sha256"] != identities[relative]:
            raise ContractError("descriptor-control-identity-mismatch")
    if records[descriptor["launcher"]]["mode"] != "executable" or records[descriptor["host"]["executable"]]["mode"] != "executable":
        raise ContractError("executable-mode-mismatch")

def _digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def _validate_descriptor(value):
    exact_object(value["target"], {"platform", "architecture"}, "descriptor-target")
    exact_object(value["launcherPlan"], {"path", "sha256"}, "descriptor-launcher-plan")
    exact_object(value["host"], {"kind", "version", "executable", "sha256"}, "descriptor-host")
    exact_object(value["worker"], {"entrypoint", "sha256"}, "descriptor-worker")
    exact_object(value["engine"], {"kind", "version", "configuration"}, "descriptor-engine")
    exact_object(value["engine"]["configuration"], {"path", "sha256"}, "descriptor-engine-configuration")
    exact_object(value["model"], {"id", "family", "size", "precision", "root", "descriptor", "sha256"}, "descriptor-model")
    if value["schemaVersion"] != 1 or value["protocolVersion"] != 1 or value["sessionConfigVersion"] != 1 or not SEMVER.fullmatch(value["packageVersion"]) or not COMMIT.fullmatch(value["sourceCommit"]):
        raise ContractError("descriptor-version-invalid")
    for key in ("packageId", "providerId"):
        if not _text(value[key]):
            raise ContractError("descriptor-identity-invalid")
    if value["target"].get("platform") not in {"darwin", "linux", "win32"} or value["target"].get("architecture") not in {"arm64", "x64"}:
        raise ContractError("descriptor-target-invalid")
    expected_launcher = "bin/voice-provider.exe" if value["target"]["platform"] == "win32" else "bin/voice-provider"
    if value["launcher"] != expected_launcher:
        raise ContractError("descriptor-launcher-invalid")
    if value["host"].get("kind") not in {"bundled-python", "native"} or value["engine"].get("kind") not in {"mlx-whisper", "faster-whisper", "funasr-native"}:
        raise ContractError("descriptor-implementation-invalid")
    for item in (value["host"].get("version"), value["engine"].get("version"), value["model"].get("id"), value["model"].get("family"), value["model"].get("size"), value["model"].get("precision")):
        if not _text(item):
            raise ContractError("descriptor-value-invalid")
    paths = (value["launcher"], value["launcherPlan"]["path"], value["host"]["executable"], value["worker"]["entrypoint"], value["engine"]["configuration"]["path"], value["model"]["root"], value["model"]["descriptor"])
    digests = (value["launcherPlan"]["sha256"], value["host"]["sha256"], value["worker"]["sha256"], value["engine"]["configuration"]["sha256"], value["model"]["sha256"])
    if not all(_path(item) for item in paths) or not all(_sha(item) for item in digests):
        raise ContractError("descriptor-asset-invalid")
    if not value["model"]["descriptor"].startswith(value["model"]["root"] + "/"):
        raise ContractError("descriptor-model-path-invalid")
    profiles = value["profiles"]
    if not isinstance(profiles, list) or not 1 <= len(profiles) <= 2:
        raise ContractError("descriptor-profiles-invalid")
    identities = set()
    combinations = {("english", "en", "autobyteus-english-v1"), ("chinese", "zh", "autobyteus-simplified-zh-v1"), ("auto", "auto", "autobyteus-auto-v1")}
    for profile in profiles:
        exact_object(profile, {"profileId", "languageMode", "normalizationProfile", "capabilities"}, "descriptor-profile")
        exact_object(profile["capabilities"], {"maxInFlightRequests", "rawAndNormalizedText", "noSpeech"}, "descriptor-capabilities")
        identity = (profile["profileId"], profile["languageMode"], profile["normalizationProfile"])
        if identity not in combinations or identity[0] in identities or profile["capabilities"] != {"maxInFlightRequests": 1, "rawAndNormalizedText": True, "noSpeech": True}:
            raise ContractError("descriptor-profile-invalid")
        identities.add(identity[0])
    if value["audioContract"] != "autobyteus-pcm16-mono-16khz-wav-v1" or value["fileManifestPath"] != "provider/package-files-v1.json" or value["noticeInventoryPath"] != "THIRD_PARTY_NOTICES.json":
        raise ContractError("descriptor-contract-invalid")

def _text(value):
    return isinstance(value, str) and bool(value)

def _path(value):
    return isinstance(value, str) and len(value.encode("ascii", "ignore")) == len(value) and len(value) <= 240 and RELATIVE.fullmatch(value) is not None

def _sha(value):
    return isinstance(value, str) and SHA.fullmatch(value) is not None

def _actual_target():
    platform_id = "win32" if sys.platform == "win32" else "darwin" if sys.platform == "darwin" else "linux" if sys.platform.startswith("linux") else "unsupported"
    machine = platform.machine().lower()
    architecture = "arm64" if machine in {"arm64", "aarch64"} else "x64" if machine in {"x86_64", "amd64"} else "unsupported"
    return platform_id, architecture

def _contained_regular(root: Path, relative: str) -> Path:
    if not _path(relative):
        raise ContractError("invalid-contained-path")
    unresolved = root / Path(relative)
    if any(item.is_symlink() for item in _lineage(unresolved, root)):
        raise ContractError("contained-path-link")
    candidate = unresolved.resolve(strict=True)
    if root not in candidate.parents or not candidate.is_file():
        raise ContractError("contained-path-escape")
    return candidate

def _lineage(candidate: Path, root: Path):
    current = candidate
    result = []
    while current != root:
        result.append(current)
        current = current.parent
    return result

def _mode_matches(path: Path, logical: str) -> bool:
    value = path.stat()
    if os.name == "nt":
        attributes = getattr(value, "st_file_attributes", 0)
        return bool(attributes & stat.FILE_ATTRIBUTE_READONLY) and not bool(attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT)
    expected = 0o555 if logical == "executable" else 0o444 if logical == "read-only" else -1
    return stat.S_IMODE(value.st_mode) == expected

def _freeze(value):
    if isinstance(value, dict):
        return MappingProxyType({key: _freeze(item) for key, item in value.items()})
    if isinstance(value, list):
        return tuple(_freeze(item) for item in value)
    return value

def cleanup_launcher_scratch(package_root):
    if os.name == "nt" or not isinstance(package_root, Path) or not package_root.is_absolute():
        return
    home, temporary = os.environ.get("HOME"), os.environ.get("TMPDIR")
    if not home or home != temporary:
        return
    unresolved = Path(home)
    if not unresolved.is_absolute() or not unresolved.name.startswith("autobyteus-voice-") or unresolved.is_symlink():
        return
    try:
        scratch = unresolved.resolve(strict=True)
        root = package_root.resolve(strict=True)
        marker = scratch / ".autobyteus-voice-scratch-v1"
        if root == scratch or root in scratch.parents or scratch in root.parents or not scratch.is_dir() or marker.is_symlink() or not marker.is_file() or marker.read_text(encoding="utf-8") != "autobyteus-voice-scratch-v1\n":
            return
        shutil.rmtree(scratch)
    except (OSError, RuntimeError, UnicodeError):
        return
