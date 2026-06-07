#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-8000}"

if lsof -ti :"$PORT" >/dev/null 2>&1; then
  echo "Port ${PORT} is already in use. Stop the existing server first, or run: PORT=8001 ./scripts/dev.sh"
  exit 1
fi

echo "Starting preview server at http://localhost:${PORT}"
python3 -m http.server "$PORT"
