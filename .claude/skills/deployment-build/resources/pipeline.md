# Lint → Test → Build Pipeline

## Command Reference

```bash
pnpm install --frozen-lockfile        # ensure lockfile parity
pnpm lint                             # ESLint + TypeScript
pnpm test --run                       # Vitest (batch mode)
pnpm build                            # Next.js production build
```

### Notes

- `pnpm test` defaults to watch mode; `--run` or `CI=1` makes it exit in CI.
- `pnpm build` already runs SWC/TypeScript. Run `pnpm exec tsc --noEmit` only for pure type checks.
- Cache `.pnpm-store` and `.next/cache` between CI runs for speed.

## Environment Verification

1. Copy `.env.example` → `.env.local` locally; configure Vercel env groups for preview/prod.
2. Capture machine info with `pnpm exec envinfo --system --binaries` when diagnosing drift.
3. Keep secrets server-side; only expose `NEXT_PUBLIC_` vars meant for the browser.

## Incremental Hardening

| Stage | Addition | Purpose |
|-------|----------|---------|
| Dev | `pnpm lint --max-warnings=0` | block noisy warnings |
| CI | `pnpm test --coverage` | catch untested paths |
| Build | `pnpm exec next build --profiling` | analyze slow routes |

## Troubleshooting Quick Hits

- ESLint fails instantly → remove `.next`, reinstall deps.
- Vitest hangs → ensure `--run`, set `CI=1`, mock Next APIs.
- `next build` OOM → `NODE_OPTIONS="--max_old_space_size=4096" pnpm build` temporarily.
