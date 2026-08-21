#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "${repository_root}/go.mod" ]]; then
  echo "architecture error: the repository root must not contain go.mod" >&2
  exit 1
fi

for legacy_root in internal services/registry tools/alx; do
  if [[ -e "${repository_root}/${legacy_root}" ]]; then
    echo "architecture error: legacy Go root ${legacy_root} has returned" >&2
    exit 1
  fi
done

if rg -n 'strings\.(Split|Trim)\(.*URL\.Path|ServeHTTP.*switch' "${repository_root}/go/registry/httpapi" --glob '*.go'; then
  echo "architecture error: manual HTTP path dispatch detected" >&2
  exit 1
fi

if rg -n 'github\.com/activelane/activelane/go/cmd/' "${repository_root}/go" --glob '*.go' --glob '!cmd/**'; then
  echo "architecture error: reusable Go package imports a command" >&2
  exit 1
fi

echo "Go architecture checks passed"
