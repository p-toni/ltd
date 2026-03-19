# Autoresearch: repo-wide speed + efficiency

## Objective
Make the research pipeline and build as fast and efficient as possible while keeping all features working.

Current session benchmark focuses on **cold `pnpm build`** because it is stable, local, and part of CI/deploys. The daily research workflow matters too, but `pnpm research:daily` is currently too network/API noisy to use as the primary loop metric.

## Metrics
- **Primary**: `build_ms` (ms, lower is better)
- **Secondary**: checks pass/fail via `autoresearch.checks.sh` (`pnpm lint` and `pnpm test --run`)

## How to Run
- `bash auto/autoresearch.sh`
- The script clears `.next`, runs `pnpm build`, and prints `METRIC build_ms=<number>`.

## Files in Scope
- `app/**`
- `lib/**`
- `scripts/**`
- `next.config.mjs`
- `vitest.config.ts`
- `README.md`
- `.github/workflows/**`
- `auto/**`
- `autoresearch.*`

## Off Limits
- Do not remove features to win the benchmark.
- Do not cheat by weakening the benchmark workload.
- Do not make network/API-heavy research behavior the primary metric in this session.
- Do not remove content or reports as a shortcut.

## Constraints
- Keep CI green.
- Keep research pipeline behavior intact.
- Prefer broad wins over benchmark-specific hacks.
- Be careful about Next.js cache effects; benchmark is a cold build and must stay honest.

## Current Best Baseline
- Current kept best in this cold-build segment: **8352ms** at commit `b7312fc`

## What's Been Tried
### Kept
- `84d42a6`: memoized `getPieces()` and `getPieceFragments()` in `lib/pieces.ts`
- `7e9e6a7`: corrected the benchmark to clear `.next` before timing cold builds
- `b7312fc`: enabled `experimental.optimizePackageImports` for `lucide-react`

### Discarded / learned
- Removing the CSS `@import` for Google Fonts in `app/globals.css` regressed the benchmark.
- Excluding `__tests__` from `tsconfig.json` regressed the benchmark.
- Reverting `optimizePackageImports` regressed, so the change is probably directionally good, though confidence is still modest.
- Replacing `getPieces()` callers with targeted helpers (`getPieceSlugs` / `getPieceBySlug`) was slower than the cached full-load approach.
- Removing `lib/pieces.ts` memoization made cold builds slightly slower.

## Current Hypotheses
1. Metadata/OG/static-param routes may still be doing more markdown work than needed, especially if Next isolates route workers enough to reduce the value of module-local caches.
2. A lighter metadata/index path may help more than ad hoc per-slug helpers.
3. Future sessions should use a deterministic mock benchmark if we want to optimize `scripts/research/*` directly.
