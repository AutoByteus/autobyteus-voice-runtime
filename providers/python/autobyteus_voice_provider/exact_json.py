import json
from pathlib import Path

MAX_JSON_BYTES = 1024 * 1024

class ContractError(ValueError):
    pass

def load_json(path: Path):
    if not path.is_absolute() or not path.is_file() or path.is_symlink():
        raise ContractError("invalid-json-file")
    data = path.read_bytes()
    if not data or len(data) > MAX_JSON_BYTES:
        raise ContractError("invalid-json-size")
    try:
        return json.loads(data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ContractError("invalid-json") from error

def exact_object(value, keys, name):
    if not isinstance(value, dict) or set(value) != set(keys):
        raise ContractError(f"invalid-{name}")
    return value
