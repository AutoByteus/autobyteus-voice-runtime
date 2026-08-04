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
            if len(sys.argv) != 5 or sys.argv[1] != "--private-package-root" or sys.argv[3] != "--session-config":
                raise ContractError("private-usage")
            root, config = Path(sys.argv[2]), Path(sys.argv[4])
            if not root.is_absolute() or not config.is_absolute():
                raise ContractError("private-path")
            session = bind_session(root, config)
            normalizer = TranscriptNormalizer(session.profile_id, session.resolve("normalizer/t2s-mapping-v1.json") if session.profile_id in ("chinese", "auto") else None)
            recognizer = recognizer_factory(session)
        except Exception:
            sys.stderr.write("VOICE_PROVIDER_STARTUP_REJECTED\n")
            return 65
        return ProtocolWorker(session, recognizer, normalizer).run()
    finally:
        cleanup_launcher_scratch(root)
