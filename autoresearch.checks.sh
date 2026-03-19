#!/usr/bin/env bash
set -euo pipefail

pnpm lint >/dev/null
pnpm test --run >/dev/null
