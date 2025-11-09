# Delivery Pipeline

This repo now has a single delivery contract across local dev, Claude automations, and CI.

## Local Steps

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm test --run`
4. `pnpm build`

Make sure `.env.local` mirrors `./.env.example`. Use `SKIP_SKILL_GUARDRAILS=true` only when you need to bypass the Claude guards temporarily.

## Claude Automation

- **PostToolUse tracker** records edits and remembers which commands must run.
- **PreToolUse guard** blocks deployments-critical files until you load the `deployment-build` skill.
- **Stop hook** automatically runs `pnpm exec tsc --noEmit` after risky sessions and streams errors back to Claude if the build breaks.

If you see a Stop-hook error, open the referenced log and fix the TypeScript errors before continuing.

## Continuous Integration

The GitHub workflow at `.github/workflows/ci.yml` mirrors the same sequence:

- Installs dependencies with pnpm 10
- Runs lint, test (`pnpm test --run`), and `pnpm build`
- Uploads the `.next` artifact for debugging or deployment tools

Treat this workflow as the source of truth for merge readiness. Any changes to scripts or env vars should update both the workflow and this document.

## Environment Management

- Node 20 / pnpm 10.10
- `.env.local` for local dev, Vercel env groups for preview/production
- Required env keys live in `.env.example`; keep it in sync whenever you add/remove config
