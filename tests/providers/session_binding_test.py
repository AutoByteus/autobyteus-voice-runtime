import hashlib
import json
import os
import platform
import stat
import sys
import tempfile
import unittest
from unittest import mock
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "providers/python"))
from autobyteus_voice_provider.exact_json import ContractError
from autobyteus_voice_provider.session import bind_session, cleanup_launcher_scratch, verify_complete_manifest


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return (json.dumps(value, separators=(",", ":")) + "\n").encode()


def target():
    platform_id = "win32" if sys.platform == "win32" else "darwin" if sys.platform == "darwin" else "linux"
    machine = platform.machine().lower()
    architecture = "arm64" if machine in {"arm64", "aarch64"} else "x64"
    return platform_id, architecture


def apply_mode(path, logical):
    os.chmod(path, stat.S_IREAD if os.name == "nt" else 0o555 if logical == "executable" else 0o444)


class SessionBindingTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name) / "package"
        self.config_path = Path(self.temporary.name) / "session.json"
        platform_id, architecture = target()
        self.capabilities = {"maxInFlightRequests": 1, "rawAndNormalizedText": True, "noSpeech": True}
        launcher = "bin/voice-provider.exe" if platform_id == "win32" else "bin/voice-provider"
        host = "host/python/python.exe" if platform_id == "win32" else "host/python/bin/python3"
        self.executables = {launcher, host}
        self.files = {
            "THIRD_PARTY_NOTICES.json": b"{}\n",
            launcher: b"launcher",
            host: b"python",
            "model/model-descriptor-v1.json": b"{}\n",
            "provider/engine-configuration-v1.json": b"{}\n",
            "provider/package-launcher-plan-v1.json": b"{}\n",
            "worker/worker.py": b"pass\n",
        }
        for relative, data in self.files.items():
            path = self.root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        self.descriptor = {
            "schemaVersion": 1,
            "packageId": "voice.english.fixture",
            "packageVersion": "1.0.0",
            "providerId": "fixture-provider",
            "sourceCommit": "a" * 40,
            "target": {"platform": platform_id, "architecture": architecture},
            "protocolVersion": 1,
            "sessionConfigVersion": 1,
            "launcher": launcher,
            "launcherPlan": {"path": "provider/package-launcher-plan-v1.json", "sha256": digest(self.files["provider/package-launcher-plan-v1.json"])},
            "host": {"kind": "bundled-python", "version": "3.12.13", "executable": host, "sha256": digest(self.files[host])},
            "worker": {"entrypoint": "worker/worker.py", "sha256": digest(self.files["worker/worker.py"])},
            "engine": {"kind": "faster-whisper", "version": "1.2.1", "configuration": {"path": "provider/engine-configuration-v1.json", "sha256": digest(self.files["provider/engine-configuration-v1.json"])}},
            "model": {"id": "fixture-model", "family": "whisper", "size": "small", "precision": "int8", "root": "model", "descriptor": "model/model-descriptor-v1.json", "sha256": digest(encoded([["model-descriptor-v1.json", len(self.files["model/model-descriptor-v1.json"]), digest(self.files["model/model-descriptor-v1.json"])]]))},
            "profiles": [{"profileId": "english", "languageMode": "en", "normalizationProfile": "autobyteus-english-v1", "capabilities": self.capabilities}],
            "audioContract": "autobyteus-pcm16-mono-16khz-wav-v1",
            "fileManifestPath": "provider/package-files-v1.json",
            "noticeInventoryPath": "THIRD_PARTY_NOTICES.json",
        }
        self.write_control_files()

    def tearDown(self):
        for item in self.root.rglob("*"):
            if item.is_file():
                os.chmod(item, 0o644)
        self.temporary.cleanup()

    def write_control_files(self):
        descriptor_path = self.root / "provider/provider-package-v1.json"
        descriptor_path.parent.mkdir(parents=True, exist_ok=True)
        descriptor_path.write_bytes(encoded(self.descriptor))
        records = []
        for file in sorted(item for item in self.root.rglob("*") if item.is_file() and item.name != "package-files-v1.json"):
            relative = file.relative_to(self.root).as_posix()
            logical = "executable" if relative in self.executables else "read-only"
            records.append({"path": relative, "sha256": digest(file.read_bytes()), "sizeBytes": file.stat().st_size, "mode": logical})
            apply_mode(file, logical)
        manifest_path = self.root / "provider/package-files-v1.json"
        manifest_path.write_bytes(encoded({"schemaVersion": 1, "packageId": self.descriptor["packageId"], "files": records}))
        apply_mode(manifest_path, "read-only")
        capability_digest = digest(json.dumps(self.capabilities, separators=(",", ":"), sort_keys=True).encode())
        config = {"schemaVersion": 1, "protocolVersion": 1, "sessionId": "0198f0f0-7e65-7f72-9c3e-95b59eeb72a9", "profileId": "english", "expected": {"packageId": self.descriptor["packageId"], "providerId": self.descriptor["providerId"], "modelId": self.descriptor["model"]["id"], "languageMode": "en", "platform": self.descriptor["target"]["platform"], "architecture": self.descriptor["target"]["architecture"], "descriptorSha256": digest(descriptor_path.read_bytes()), "fileManifestSha256": digest(manifest_path.read_bytes()), "capabilityDigest": capability_digest}}
        self.config_path.write_bytes(encoded(config))

    def test_binds_immutable_session_and_verifies_complete_manifest(self):
        session = bind_session(self.root, self.config_path)
        self.assertEqual(session.package_id, "voice.english.fixture")
        verify_complete_manifest(session)

    def test_rejects_unknown_nested_descriptor_field_before_hello(self):
        for item in self.root.rglob("*"):
            if item.is_file():
                os.chmod(item, 0o644)
        self.descriptor["engine"]["fallback"] = "forbidden"
        self.write_control_files()
        with self.assertRaises(ContractError):
            bind_session(self.root, self.config_path)

    @unittest.skipIf(os.name == "nt", "Windows launcher owns scratch cleanup")
    def test_removes_only_marked_launcher_scratch(self):
        scratch = Path(self.temporary.name) / "autobyteus-voice-fixture"
        scratch.mkdir(mode=0o700)
        (scratch / ".autobyteus-voice-scratch-v1").write_text("autobyteus-voice-scratch-v1\n", encoding="utf-8")
        (scratch / "provider-cache").write_text("temporary", encoding="utf-8")
        with mock.patch.dict(os.environ, {"HOME": str(scratch), "TMPDIR": str(scratch)}):
            cleanup_launcher_scratch(self.root)
        self.assertFalse(scratch.exists())


if __name__ == "__main__":
    unittest.main()
