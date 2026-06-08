#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS_DIR="${ROOT_DIR}/assets"

cd "$ASSETS_DIR"

for video in *.mp4; do
  base="${video%.mp4}"
  poster="${base}-poster.png"
  qlmanage -t -s 1920 -o . "$video" >/dev/null 2>&1
  if [ -f "${video}.png" ]; then
    mv "${video}.png" "$poster"
    echo "Created ${poster}"
  fi
done
