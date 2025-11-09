# Claude Code Skill Integration

This project now ships with the Claude Code skill system so contributors can load guidance directly inside Anthropic's IDE extensions.

## Directory Layout

```
.claude/
  skills/
    deployment-build/      # New deployment & build playbook for te-blog
    skill-developer/       # Meta-skill copied from Claude Code Infrastructure Showcase
    skill-rules.json       # Activation triggers for the two skills
```

## Available Skills

| Skill | Purpose | When It Activates |
|-------|---------|-------------------|
| `deployment-build` | Walks through lint/test/build pipelines, CI patterns, and Vercel deployment safeguards tailored to te-blog's Next.js stack | Mentions of deploy/build/pipeline topics or edits to build-related config files |
| `skill-developer` | Official Anthropic meta-skill for designing new skills, editing triggers, or debugging hook behavior | Any work inside `.claude/**` or prompts about skills/hooks |

Each skill follows the "500 line main file + resource files" pattern recommended by the Claude Code Infrastructure Showcase so Claude can load content progressively.

## Usage Tips

1. Install the Claude desktop app or VS Code extension with hook support.
2. Open this repo; Claude automatically detects `.claude/skills`.
3. When you mention deployment, builds, or skills, the UserPromptSubmit hook (from the Showcase) can now surface the relevant skill.
4. Load additional resource files only when needed to keep the context window lean.

## Extending the Setup

- Add new skills under `.claude/skills/<name>/` with the same structure.
- Update `.claude/skills/skill-rules.json` to describe triggers for the new skill (keywords, intent patterns, and file triggers).
- Keep each markdown file under ~500 lines.
- If you copy more assets from the reference repo (hooks, agents, etc.), document them in this folder so future contributors know what is available.

## Hook Automation

Hooks from the Claude Code Infrastructure Showcase are registered in `.claude/settings.json`:

| Hook | Type | Purpose |
|------|------|---------|
| `.claude/hooks/skill-activation-prompt.sh` | `UserPromptSubmit` | Runs before each prompt and suggests relevant skills using `skill-rules.json`. |
| `.claude/hooks/skill-verification-guard.sh` | `PreToolUse` (Edit/MultiEdit/Write) | Blocks risky edits when guardrail skills (like `deployment-build`) match file triggers. |
| `.claude/hooks/post-tool-use-tracker.sh` | `PostToolUse` (Edit/MultiEdit/Write) | Tracks edited files so build/tsc commands can be suggested in future Stop hooks. |
| `.claude/hooks/stop-tsc-check.sh` | `Stop` | Runs the recorded `pnpm exec tsc --noEmit` commands and surfaces errors back to Claude. |

All hooks run with plain Node.js and `jq`, so no extra package install is required beyond the main project setup. Set `SKIP_SKILL_GUARDRAILS=true` temporarily if you need to bypass the PreToolUse guard while debugging.

### Manual Testing

```bash
# Skill suggestions
echo '{"prompt":"deploy the latest changes"}' | CLAUDE_PROJECT_DIR=$PWD .claude/hooks/skill-activation-prompt.sh

# Post-tool tracker (simulate Edit tool output)
cat <<'EOF' | CLAUDE_PROJECT_DIR=$PWD .claude/hooks/post-tool-use-tracker.sh
{"tool_name":"Edit","tool_input":{"file_path":"app/page.tsx"},"session_id":"local-test"}
EOF

# File guard (deployment-build patterns)
cat <<'EOF' | CLAUDE_PROJECT_DIR=$PWD .claude/hooks/skill-verification-guard.sh
{"tool_name":"Edit","tool_input":{"file_path":"/Users/me/te-blog/package.json"},"session_id":"local-test"}
EOF

# Stop hook (reads tracker cache & runs tsc)
cat <<'EOF' | CLAUDE_PROJECT_DIR=$PWD .claude/hooks/stop-tsc-check.sh
{"session_id":"local-test"}
EOF
```

If any hook complains about `jq`, install it via `brew install jq` (macOS) or your distro package manager.
