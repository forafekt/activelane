#!/usr/bin/env bash

# Project-local development state. This file is sourced by other scripts.
activelane_repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
activelane_state_root="$activelane_repo_root/.activelane"

mkdir -p \
  "$activelane_state_root/registry" \
  "$activelane_state_root/extensions" \
  "$activelane_state_root/packages" \
  "$activelane_state_root/cache/go-build" \
  "$activelane_state_root/xdg/data" \
  "$activelane_state_root/xdg/cache" \
  "$activelane_state_root/xdg/config"

if [[ ! -f "$activelane_state_root/registries.json" ]]; then
  printf '%s\n' \
    '{' \
    '  "$schema": "../schemas/registry-config.schema.json",' \
    '  "version": 1,' \
    '  "registries": [' \
    '    {' \
    '      "id": "local",' \
    '      "type": "remote",' \
    '      "url": "http://127.0.0.1:8787",' \
    '      "enabled": true,' \
    '      "priority": 100,' \
    '      "scopes": ["activelane", "local"]' \
    '    }' \
    '  ]' \
    '}' > "$activelane_state_root/registries.json"
fi

export ACTIVELANE_STATE_DIR="$activelane_state_root"
export ACTIVELANE_REGISTRY_CONFIG="$activelane_state_root/registries.json"
export ACTIVELANE_EXTENSIONS_DIR="$activelane_state_root/extensions"
export XDG_DATA_HOME="$activelane_state_root/xdg/data"
export XDG_CACHE_HOME="$activelane_state_root/xdg/cache"
export XDG_CONFIG_HOME="$activelane_state_root/xdg/config"
export GOCACHE="$activelane_state_root/cache/go-build"
