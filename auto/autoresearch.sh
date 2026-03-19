#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" >/dev/null

start_ms=$(node -e 'process.stdout.write(String(Date.now()))')
pnpm build
end_ms=$(node -e 'process.stdout.write(String(Date.now()))')

build_ms=$((end_ms - start_ms))
echo "METRIC build_ms=${build_ms}"
