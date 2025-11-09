#!/bin/bash
set -euo pipefail

# Stop hook that runs TypeScript checks for repos edited this session.
# It uses commands recorded by post-tool-use-tracker.sh and surfaces
# friendly guidance to Claude when compilation fails.

event_info=$(cat)
session_id=$(echo "$event_info" | jq -r '.session_id // "default"')
project_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
cache_dir="$project_dir/.claude/tsc-cache/$session_id"
commands_file="$cache_dir/commands.txt"

if [[ ! -f "$commands_file" ]]; then
    exit 0
fi

results_dir="$cache_dir/results"
mkdir -p "$results_dir"

error_found=false
summary=()

while IFS= read -r line; do
    [[ -z "$line" ]] && continue

    repo="${line%%:*}"
    rest="${line#*:}"
    check_type="${rest%%:*}"
    command="${rest#*:}"

    if [[ "$check_type" != "tsc" ]]; then
        continue
    fi

    log_file="$results_dir/${repo//\//_}-tsc.log"

    if eval "$command" >"$log_file" 2>&1; then
        continue
    fi

    error_found=true
    summary+=("$repo")
done < "$commands_file"

if [[ "$error_found" == false ]]; then
    rm -rf "$cache_dir"
    exit 0
fi

echo "## TypeScript check failed" >&2
echo "" >&2
echo "These areas need attention:" >&2
for repo in "${summary[@]}"; do
    log_file="$results_dir/${repo//\//_}-tsc.log"
    echo "- $repo" >&2
    echo '```' >&2
    sed -n '1,80p' "$log_file" >&2 || true
    echo '```' >&2
done
echo "" >&2
echo "Action: run the Deployment & Build skill, then fix the reported errors (the logs above were captured from \`pnpm exec tsc --noEmit\`)." >&2
echo "Set SKIP_SKILL_GUARDRAILS=true if you need to bypass this guard temporarily." >&2

exit 2
