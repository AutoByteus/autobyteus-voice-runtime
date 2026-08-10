import hashlib
import json
import os
import re
import shutil
import stat
import sys
from dataclasses import dataclass
from pathlib import Path
from types import MappingProxyType
from .exact_json import ContractError, exact_object, load_json

SHA = re.compile(r"^[a-f0-9]{64}$")
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
RELATIVE = re.compile(r"^(?!/)(?!.*(?:^|/)\.\.?(?:/|$))(?!.*\\)[A-Za-z0-9._/-]+$")
CONFIG_KEYS = {"schemaVersion","protocolVersion","sessionId","profileId","installationRoot","installationId","activationSha256","expected"}
EXPECTED_KEYS = {"hostPackageId","providerId","modelId","languageMode","platform","architecture","descriptorSha256","fileManifestSha256","hostSourceClosureSha256","modelAdmissionRootSha256","modelManifestSha256","modelTreeSha256","compatibilityPairSha256","capabilityDigest"}
ACTIVATION_KEYS = {"schemaVersion","installationId","profileId","languageMode","target","catalog","host","model","compatibilityPairSha256","capabilityDigest","decision","createdAt"}

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
    host_root: Path
    model_root: Path
    descriptor: MappingProxyType
    activation: MappingProxyType
    lease_fd: int

    def resolve(self, relative: str) -> Path:
        return _contained_regular(self.host_root, relative)

    def resolve_model(self, relative: str) -> Path:
        return _contained_regular(self.model_root, relative)


def bind_session(host_root: Path, activation_path: Path, model_root: Path, lease_fd: int, config_path: Path) -> BoundProviderSession:
    root = _contained_directory(host_root)
    model = _contained_directory(model_root)
    config = exact_object(load_json(config_path), CONFIG_KEYS, "session-config")
    expected = exact_object(config["expected"], EXPECTED_KEYS, "expected")
    if config["schemaVersion"] != 2 or config["protocolVersion"] != 1 or not _uuid(config["sessionId"]) or not _uuid(config["installationId"]):
        raise ContractError("invalid-session")
    if (config["profileId"], expected["languageMode"]) not in {("english","en"),("chinese","zh")} or (expected["platform"], expected["architecture"]) != _actual_target():
        raise ContractError("invalid-profile-target")
    for key in EXPECTED_KEYS - {"hostPackageId","providerId","modelId","languageMode","platform","architecture"}:
        if not isinstance(expected[key], str) or not SHA.fullmatch(expected[key]):
            raise ContractError("invalid-digest")
    if not SHA.fullmatch(config["activationSha256"]):
        raise ContractError("invalid-activation-digest")
    if lease_fd <= 2:
        raise ContractError("invalid-lease")
    os.fstat(lease_fd)
    descriptor_path = _contained_regular(root, "provider/runtime-host-v2.json")
    descriptor_bytes = descriptor_path.read_bytes()
    descriptor = json.loads(descriptor_bytes)
    if _digest(descriptor_bytes) != expected["descriptorSha256"] or descriptor.get("schemaVersion") != 2 or descriptor.get("hostPackageId") != expected["hostPackageId"] or descriptor.get("providerId") != expected["providerId"]:
        raise ContractError("host-identity-mismatch")
    activation_bytes = activation_path.read_bytes()
    if _digest(activation_bytes) != config["activationSha256"]:
        raise ContractError("activation-digest-mismatch")
    activation = exact_object(json.loads(activation_bytes), ACTIVATION_KEYS, "activation")
    _bind_activation(config, expected, activation)
    expected_activation = Path(config["installationRoot"]) / "activations" / config["installationId"] / "profile-activation-v1.json"
    expected_model = Path(config["installationRoot"]) / "models" / activation["model"]["modelAssetId"] / activation["model"]["manifestSha256"] / "files"
    if activation_path.resolve(strict=True) != expected_activation.resolve(strict=True) or model != expected_model.resolve(strict=True):
        raise ContractError("private-path-mismatch")
    return BoundProviderSession(config["sessionId"], config["profileId"], expected["languageMode"], expected["hostPackageId"], expected["providerId"], expected["modelId"], _actual_target(), expected["capabilityDigest"], root, model, _freeze(descriptor), _freeze(activation), lease_fd)


def verify_complete_manifest(session: BoundProviderSession):
    records = session.activation["model"]["files"]
    if not records:
        raise ContractError("empty-model")
    expected_paths = []
    tree_rows = []
    previous = ""
    for record in records:
        if set(record) != {"path","role","sizeBytes","sha256","mode"}:
            raise ContractError("invalid-model-file")
        relative = record["path"]
        if not _relative(relative) or relative <= previous or record["mode"] != "read-only" or not SHA.fullmatch(record["sha256"]):
            raise ContractError("invalid-model-record")
        previous = relative
        candidate = session.resolve_model(relative)
        info = candidate.stat()
        if info.st_size != record["sizeBytes"] or stat.S_IMODE(info.st_mode) & 0o222 or info.st_nlink != 1 or _file_digest(candidate) != record["sha256"]:
            raise ContractError("model-file-mismatch")
        expected_paths.append(relative)
        tree_rows.append([relative, record["sizeBytes"], record["sha256"]])
    actual = sorted(item.relative_to(session.model_root).as_posix() for item in session.model_root.rglob("*") if item.is_file())
    if any(item.is_symlink() for item in session.model_root.rglob("*")) or actual != expected_paths:
        raise ContractError("model-closure-mismatch")
    encoded = (json.dumps(tree_rows, ensure_ascii=False, separators=(",", ":")) + "\n").encode()
    if _digest(encoded) != session.activation["model"]["treeSha256"]:
        raise ContractError("model-tree-mismatch")


def _bind_activation(config, expected, activation):
    exact_object(activation["target"], {"platform","architecture"}, "activation-target")
    exact_object(activation["host"], {"hostPackageId","providerId","descriptorSha256","fileManifestSha256","hostSourceClosureSha256","modelAdmissionRootSha256","compatibilityRequirementSha256"}, "activation-host")
    exact_object(activation["model"], {"modelAssetId","modelId","manifestSha256","revision","layoutId","treeSha256","files"}, "activation-model")
    facts = [activation["schemaVersion"] == 1, activation["installationId"] == config["installationId"], activation["profileId"] == config["profileId"], activation["languageMode"] == expected["languageMode"], activation["target"] == {"platform":expected["platform"],"architecture":expected["architecture"]}, activation["host"]["hostPackageId"] == expected["hostPackageId"], activation["host"]["providerId"] == expected["providerId"], activation["host"]["descriptorSha256"] == expected["descriptorSha256"], activation["host"]["fileManifestSha256"] == expected["fileManifestSha256"], activation["host"]["hostSourceClosureSha256"] == expected["hostSourceClosureSha256"], activation["host"]["modelAdmissionRootSha256"] == expected["modelAdmissionRootSha256"], activation["model"]["modelId"] == expected["modelId"], activation["model"]["manifestSha256"] == expected["modelManifestSha256"], activation["model"]["treeSha256"] == expected["modelTreeSha256"], activation["compatibilityPairSha256"] == expected["compatibilityPairSha256"], activation["capabilityDigest"] == expected["capabilityDigest"], activation["decision"] == "active"]
    if not all(facts):
        raise ContractError("activation-identity-mismatch")


def _contained_directory(value: Path) -> Path:
    if not value.is_absolute() or value.is_symlink():
        raise ContractError("invalid-directory")
    actual = value.resolve(strict=True)
    if not actual.is_dir():
        raise ContractError("invalid-directory")
    return actual


def _contained_regular(root: Path, relative: str) -> Path:
    if not _relative(relative):
        raise ContractError("invalid-contained-path")
    unresolved = root / relative
    current = unresolved
    while current != root:
        if current.is_symlink():
            raise ContractError("contained-link")
        current = current.parent
    actual = unresolved.resolve(strict=True)
    if root not in actual.parents or not actual.is_file() or actual.is_symlink():
        raise ContractError("contained-escape")
    return actual


def _relative(value):
    return isinstance(value, str) and RELATIVE.fullmatch(value) is not None

def _uuid(value):
    return isinstance(value, str) and UUID.fullmatch(value) is not None

def _digest(value):
    return hashlib.sha256(value).hexdigest()

def _file_digest(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(256 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()

def _actual_target():
    platform_id = "darwin" if sys.platform == "darwin" else "unsupported"
    architecture = "arm64" if os.uname().machine.lower() in {"arm64","aarch64"} else "unsupported"
    return platform_id, architecture

def _freeze(value):
    if isinstance(value, dict):
        return MappingProxyType({key:_freeze(item) for key,item in value.items()})
    if isinstance(value, list):
        return tuple(_freeze(item) for item in value)
    return value

def cleanup_launcher_scratch(host_root):
    if os.name == "nt" or not isinstance(host_root, Path) or not host_root.is_absolute():
        return
    home, temporary = os.environ.get("HOME"), os.environ.get("TMPDIR")
    if not home or home != temporary:
        return
    scratch = Path(home)
    try:
        root = host_root.resolve(strict=True)
        marker = scratch / ".autobyteus-voice-scratch-v1"
        if not scratch.name.startswith("autobyteus-voice-") or scratch.is_symlink() or root == scratch or root in scratch.parents or scratch in root.parents or marker.read_text() != "autobyteus-voice-scratch-v1\n":
            return
        shutil.rmtree(scratch)
    except (OSError, RuntimeError, UnicodeError):
        return
