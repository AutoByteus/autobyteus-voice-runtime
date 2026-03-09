#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$RUNTIME_ROOT/.venv"
BOOTSTRAP_STAMP="$VENV_DIR/.bootstrap-complete"

find_python() {
  local candidates=()

  if [[ -n "${AUTOBYTEUS_VOICE_INPUT_PYTHON:-}" ]]; then
    candidates+=("${AUTOBYTEUS_VOICE_INPUT_PYTHON}")
  fi

  candidates+=("python3.11" "python3.10" "python3.9" "python3" "python")

  for candidate in "${candidates[@]}"; do
    if command -v "$candidate" >/dev/null 2>&1; then
      command -v "$candidate"
      return 0
    fi
  done

  echo "AutoByteus Voice Input runtime could not find a usable Python interpreter." >&2
  exit 1
}

resolve_backend() {
  local index=1
  while [[ $index -le $# ]]; do
    local value="${!index}"
    if [[ "$value" == "--backend" ]]; then
      local next_index=$((index + 1))
      if [[ $next_index -le $# ]]; then
        printf '%s' "${!next_index}"
        return 0
      fi
    fi
    index=$((index + 1))
  done

  echo "Voice Input runtime launcher requires --backend." >&2
  exit 1
}

bootstrap_venv() {
  local backend="$1"
  local python_bin
  python_bin="$(find_python)"

  if [[ ! -x "$VENV_DIR/bin/python" ]]; then
    "$python_bin" -m venv "$VENV_DIR"
  fi

  if [[ ! -f "$BOOTSTRAP_STAMP" ]]; then
    local requirements_file="$RUNTIME_ROOT/requirements-$backend.txt"

    if [[ ! -f "$requirements_file" ]]; then
      echo "Missing requirements file: $requirements_file" >&2
      exit 1
    fi

    "$VENV_DIR/bin/python" -m pip install --upgrade pip >/dev/null
    "$VENV_DIR/bin/python" -m pip install --requirement "$requirements_file" >/dev/null
    touch "$BOOTSTRAP_STAMP"
  fi
}

main() {
  local backend
  backend="$(resolve_backend "$@")"
  bootstrap_venv "$backend"
  exec "$VENV_DIR/bin/python" "$RUNTIME_ROOT/voice_input_worker.py" "$@"
}

main "$@"
