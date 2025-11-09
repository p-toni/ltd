# Vercel Deployment Playbook

## Project Linking

1. `vercel link` in repo or connect via dashboard.
2. Framework preset auto-detects Next.js; keep package manager = pnpm.
3. Default build command `pnpm build` and output `.next` work out of the box.

## Environment Strategy

- Use Development / Preview / Production env groups.
- Mirror `.env.example` keys; never rely on local fallbacks.
- Store rotating secrets in Vercel’s encrypted env vars.

## Build Settings

| Setting | Value |
|---------|-------|
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build` |
| Output Directory | `.next` |
| Node Version | `18.x` (match `.nvmrc`/`.tool-versions` if added) |

## Promotion Flow

1. Every PR → Preview deployment.
2. Validate preview URL (routing, MD content, analytics events).
3. Promote preview to production once lint/test/build pass in CI and manual checks finish.

## Rollback

1. Open Vercel Deployments.
2. Select last known-good build → “Promote to Production”.
3. Tag the corresponding git commit for traceability.

## Observability

- Enable Vercel Analytics or connect external metrics.
- Watch build logs for asset warnings and missing env vars; surface them in PR reviews.
