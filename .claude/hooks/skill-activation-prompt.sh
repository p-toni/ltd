#!/bin/bash
set -euo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
hook_dir="$project_dir/.claude/hooks"

export CLAUDE_PROJECT_DIR="$project_dir"
cat | node "$hook_dir/skill-activation-prompt.mjs"
