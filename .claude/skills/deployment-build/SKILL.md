---
name: deployment-build
description: Ensure te-blog builds cleanly and deploys safely. Use whenever you touch build tooling, CI/CD, or Vercel deployment flows. Covers lint/test/build order, environment validation, bundle analysis, and rollout safeguards for a Next.js 15 + pnpm stack.
---

# Deployment & Build Skill

## Why This Exists

te-blog runs on Next.js 15 + React 19 with pnpm 10. Production failures almost always come from missing env vars, skipped lint/test passes, or build command drift between local, CI, and Vercel. This skill packages the repeatable steps so the app ships the same way everywhere.

## When to Call It

- Editing Node/Next tooling (`package.json`, `next.config.mjs`, `pnpm-lock.yaml`, `vitest.config.ts`)
- Touching deployment scripts or infrastructure docs
- Investigating build/test failures or slow CI pipelines
- Preparing releases (preview → production promotion)
- Auditing env vars / secrets before deploy

## te-blog Build Profile

| Area | Detail |
|------|--------|
| Runtime | Node 18+ (pnpm 10.10) |
| Framework | Next.js 15 App Router + React 19 |
| Styling | Tailwind CSS 4 + custom CSS |
| Tests | Vitest + @testing-library/react |
| Bundler | Turbopack (dev) / SWC (build) |
| Deploy Target | Vercel (default) or `next start` container |

## Golden Path (Local → CI → Prod)

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm test --run`
4. `pnpm build`
5. Promote preview → production once preview URL is verified

Keep Node + pnpm versions in sync via `.nvmrc` or `.tool-versions` so these steps behave identically on every machine.

## Quick Checklist

- [ ] Dependencies installed with frozen lockfile
- [ ] `.env.local` (local) or Vercel env groups match `.env.example`
- [ ] Lint/test/build pass in order
- [ ] Markdown content compiles without MDX errors
- [ ] Bundle size/regressions reviewed when routes change
- [ ] Preview deployment checked before promoting to prod

## Deployment Guards

- **Blockers:** failing lint/test/build, missing env vars, new dependencies without lock updates, or build steps not mirrored in CI.
- **Warnings:** static assets >300 KB, dynamic route overrides without docs, new scripts without README updates.
- **Rollback:** keep last `.next` artifact (Vercel stores automatically) and tag releases to redeploy instantly.

## What You Get

- Command recipes for local + CI flows
- Env var validation strategies
- Vercel promotion + rollback guidance
- Troubleshooting notes for lint/test/build failures

## Resources

- [`resources/pipeline.md`](resources/pipeline.md) – Expanded lint/test/build flow with caching + troubleshooting snippets
- [`resources/vercel.md`](resources/vercel.md) – Vercel deployment checklist
- [`resources/ci.md`](resources/ci.md) – GitHub Actions blueprint + artifact handling
- [`resources/troubleshooting.md`](resources/troubleshooting.md) – Failure playbooks and env debugging tips

Load the main skill first, then pull in individual resources only when you need the deeper guidance. This keeps Claude’s context lean while still covering everything required to ship te-blog confidently.
