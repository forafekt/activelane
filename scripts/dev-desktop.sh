#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source "$repo_root/scripts/activelane-dev-env.sh"

if ! command -v node >/dev/null 2>&1; then
  for candidate in "$HOME"/.nvm/versions/node/*/bin/node "$HOME"/.cache/codex-runtimes/*/dependencies/node/bin/node; do
    if [[ -x "$candidate" ]]; then
      PATH="$(dirname "$candidate"):$PATH"
      break
    fi
  done
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to start the desktop frontend." >&2
  exit 1
fi

if ! command -v wails3 >/dev/null 2>&1 && [[ -x "$HOME/go/bin/wails3" ]]; then
  PATH="$HOME/go/bin:$PATH"
fi

if ! command -v wails3 >/dev/null 2>&1; then
  echo "Wails 3 is required. Install it before starting the desktop app." >&2
  exit 1
fi

export PATH
cd "$repo_root/apps/desktop"
exec wails3 dev
