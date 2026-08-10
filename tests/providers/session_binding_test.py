import hashlib
import json
import os
import stat
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "providers/python"))
from autobyteus_voice_provider.exact_json import ContractError
from autobyteus_voice_provider.session import bind_session, cleanup_launcher_scratch, verify_complete_manifest

UUID = "00000000-0000-4000-8000-000000000001"
SHA = "a" * 64

def encoded(value):
    return (json.dumps(value, separators=(",", ":")) + "\n").encode()

def digest(data):
    return hashlib.sha256(data).hexdigest()

class SessionBindingTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.base = Path(self.temporary.name)
        self.host = self.base / "host"
        self.install = self.base / "store"
        self.model = self.install / "models" / "asset" / SHA / "files"
        self.activation_path = self.install / "activations" / UUID / "profile-activation-v1.json"
        self.config_path = self.base / "session.json"
        self.model.mkdir(parents=True)
        self.activation_path.parent.mkdir(parents=True)
        (self.host / "provider").mkdir(parents=True)
        model_file = self.model / "weights.bin"
        model_file.write_bytes(b"x")
        model_file.chmod(0o400)
        tree = digest(encoded([["weights.bin", 1, digest(b"x")]]))
        descriptor = {"schemaVersion": 2, "hostPackageId": "host", "providerId": "provider"}
        descriptor_bytes = encoded(descriptor)
        (self.host / "provider/runtime-host-v2.json").write_bytes(descriptor_bytes)
        activation = {
            "schemaVersion": 1, "installationId": UUID, "profileId": "english", "languageMode": "en",
            "target": {"platform": "darwin", "architecture": "arm64"},
            "catalog": {"fileName": "catalog.json", "sha256": SHA},
            "host": {"hostPackageId": "host", "providerId": "provider", "descriptorSha256": digest(descriptor_bytes), "fileManifestSha256": SHA, "hostSourceClosureSha256": SHA, "modelAdmissionRootSha256": SHA, "compatibilityRequirementSha256": SHA},
            "model": {"modelAssetId": "asset", "modelId": "model", "manifestSha256": SHA, "revision": "a" * 40, "layoutId": "layout", "treeSha256": tree, "files": [{"path": "weights.bin", "role": "weights", "sizeBytes": 1, "sha256": digest(b"x"), "mode": "read-only"}]},
            "compatibilityPairSha256": SHA, "capabilityDigest": SHA, "decision": "active", "createdAt": "2026-08-09T00:00:00Z",
        }
        activation_bytes = encoded(activation)
        self.activation_path.write_bytes(activation_bytes)
        self.config = {
            "schemaVersion": 2, "protocolVersion": 1, "sessionId": "00000000-0000-4000-8000-000000000002", "profileId": "english",
            "installationRoot": str(self.install), "installationId": UUID, "activationSha256": digest(activation_bytes),
            "expected": {"hostPackageId": "host", "providerId": "provider", "modelId": "model", "languageMode": "en", "platform": "darwin", "architecture": "arm64", "descriptorSha256": digest(descriptor_bytes), "fileManifestSha256": SHA, "hostSourceClosureSha256": SHA, "modelAdmissionRootSha256": SHA, "modelManifestSha256": SHA, "modelTreeSha256": tree, "compatibilityPairSha256": SHA, "capabilityDigest": SHA},
        }
        self.config_path.write_bytes(encoded(self.config))
        self.lease = os.open(self.base / "lease", os.O_CREAT | os.O_RDWR, 0o600)

    def tearDown(self):
        os.close(self.lease)
        self.temporary.cleanup()

    @mock.patch("autobyteus_voice_provider.session._actual_target", return_value=("darwin", "arm64"))
    def test_binds_config2_activation_and_complete_external_model(self, _target):
        session = bind_session(self.host, self.activation_path, self.model, self.lease, self.config_path)
        self.assertEqual(session.package_id, "host")
        verify_complete_manifest(session)

    @mock.patch("autobyteus_voice_provider.session._actual_target", return_value=("darwin", "arm64"))
    def test_rejects_stale_activation_before_provider_hello(self, _target):
        self.config["activationSha256"] = "b" * 64
        self.config_path.write_bytes(encoded(self.config))
        with self.assertRaises(ContractError):
            bind_session(self.host, self.activation_path, self.model, self.lease, self.config_path)

    @unittest.skipIf(os.name == "nt", "POSIX scratch ownership")
    def test_removes_only_marked_launcher_scratch(self):
        scratch = self.base / "autobyteus-voice-fixture"
        scratch.mkdir(mode=0o700)
        (scratch / ".autobyteus-voice-scratch-v1").write_text("autobyteus-voice-scratch-v1\n")
        with mock.patch.dict(os.environ, {"HOME": str(scratch), "TMPDIR": str(scratch)}):
            cleanup_launcher_scratch(self.host)
        self.assertFalse(scratch.exists())

if __name__ == "__main__":
    unittest.main()
