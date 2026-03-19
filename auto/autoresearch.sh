#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pnpm exec tsx auto/benchmark-research.ts
pnpm exec tsx auto/benchmark-embedding.ts
