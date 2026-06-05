#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REPO_URL="https://github.com/amilene/aknightmedia.git"

if ! command -v git >/dev/null 2>&1; then
  echo "Git is not available. Install Xcode Command Line Tools:"
  echo "  xcode-select --install"
  exit 1
fi

if [ ! -d .git ]; then
  git init -b main
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REPO_URL"
fi

git add index.html styles.css script.js .gitignore README.md scripts/
git status

echo ""
echo "Next steps:"
echo "  git commit -m \"Initial AKnight Media site\""
echo "  git push -u origin main"
