#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pnpm exec tsx auto/benchmark-research.ts
pnpm exec tsx auto/benchmark-embedding.ts

rm -rf .next
start_ms=$(node -e 'process.stdout.write(String(Date.now()))')
pnpm build >/dev/null
end_ms=$(node -e 'process.stdout.write(String(Date.now()))')

echo "METRIC build_ms=$((end_ms - start_ms))"
