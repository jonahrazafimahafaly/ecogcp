#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -d "${ROOT_DIR}/tools/google-cloud-cli/bin" ]]; then
  export PATH="${ROOT_DIR}/tools/google-cloud-cli/bin:${PATH}"
fi

exec kubectl "$@"
