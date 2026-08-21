#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/activelane-dev-env.sh"
cd "$activelane_repo_root"
exec "$@"
