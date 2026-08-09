import sys
from pathlib import Path
from .exact_json import ContractError
from .normalization import TranscriptNormalizer
from .protocol import ProtocolWorker
from .session import bind_session, cleanup_launcher_scratch

def main(recognizer_factory):
    root = None
    try:
        try:
            expected = ["--private-host-root", "--private-activation-record", "--private-model-root", "--private-installation-lease-fd", "--session-config"]
            if len(sys.argv) != 11 or sys.argv[1::2] != expected:
                raise ContractError("private-usage")
            root = Path(sys.argv[2])
            activation, model, config = Path(sys.argv[4]), Path(sys.argv[6]), Path(sys.argv[10])
            if not all(path.is_absolute() for path in (root, activation, model, config)):
                raise ContractError("private-path")
            try:
                lease_fd = int(sys.argv[8])
            except ValueError as error:
                raise ContractError("private-lease") from error
            session = bind_session(root, activation, model, lease_fd, config)
            normalizer = TranscriptNormalizer(session.profile_id, session.resolve("normalizer/t2s-mapping-v1.json") if session.profile_id == "chinese" else None)
            recognizer = recognizer_factory(session)
        except Exception:
            sys.stderr.write("VOICE_PROVIDER_STARTUP_REJECTED\n")
            return 65
        return ProtocolWorker(session, recognizer, normalizer).run()
    finally:
        cleanup_launcher_scratch(root)
