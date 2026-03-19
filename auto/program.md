# Autoresearch: repo-wide speed + efficiency

## Goal
make the research pipeline and build as fast and efficient as possible while keeping all features working

## Metric discovery
Read for this session:
- `README.md`
- `package.json`
- `.github/workflows/ci.yml`
- `.github/workflows/research-daily.yml`
- `.github/workflows/research-rewrite.yml`
- `app/`
- `lib/`
- `scripts/`
- `.env.example`
- `docs/delivery-pipeline.md`
- build/test config files

Repo facts that matter:
- CI runs `pnpm lint`, `pnpm test --run`, and `pnpm build` on every push/PR.
- Daily autoresearch already runs on schedule in `.github/workflows/research-daily.yml`.
- Daily research has a soft budget via `RESEARCH_TIME_BUDGET_MINUTES` and CI sets it to `4`.
- The app build statically touches content-heavy code paths (`getPieces`, piece pages, metadata, OG image routes).
- The research pipeline depends on network + external APIs, which makes it valuable but noisy for a primary local benchmark.

## Candidate metrics considered
1. **`build_ms` ↓** — wall-clock time for `pnpm build`.
   - Pros: deterministic, always runnable locally, exercised by CI and deploys, touches app/lib/content loading.
   - Cons: does not directly time the research swarm.
2. **`ci_ms` ↓** — wall-clock for `pnpm lint && pnpm test --run && pnpm build`.
   - Pros: mirrors merge-readiness.
   - Cons: slower, noisier, harder to iterate quickly.
3. **`research_daily_ms` ↓** — wall-clock for `pnpm research:daily`.
   - Pros: directly targets the scheduled workflow.
   - Cons: requires external APIs/network and source freshness; too noisy/fragile for autonomous local looping.
4. **`vitest_ms` ↓** — wall-clock for `pnpm test --run`.
   - Pros: stable and quick.
   - Cons: smaller real-world win than build for this repo.
5. **`autoresearch_bootstrap_ms` ↓** — time to sync/prepare the embedded autoresearch dependency and launch the provider.
   - Pros: directly targets daily research cold/warm start cost.
   - Cons: narrower than full repo value and less representative than build.

## Selected primary metric
- **Primary:** `build_ms` (ms, lower is better)
- **Direction:** ↓

## Why this is the best primary metric
`pnpm build` is the best repo-wide primary metric because it is:
- the most reliable performance target that runs everywhere,
- part of every CI pass and production packaging flow,
- strongly influenced by app/lib architecture, especially repeated markdown/content loading,
- fast enough to iterate on many times per session,
- broad enough that improvements usually help developer feedback loops immediately.

The daily research pipeline still matters, so experiments should prefer changes that also avoid hurting `scripts/research/*` and should look for wins that simplify both build-time and research-time content handling.

## Benchmark command
- `bash auto/autoresearch.sh`

This script runs a quick precheck, removes `.next` to force a cold production build, and then measures `pnpm build`, emitting:
- `METRIC build_ms=<number>`

## First planned experiment
Memoize content loading in `lib/pieces.ts` so repeated `getPieces()` / `getPieceFragments()` calls during static generation, metadata generation, and OG route rendering do not repeatedly re-read and re-parse the same markdown files.

Why first:
- `app/page.tsx`, `app/pieces/[slug]/page.tsx`, `generateStaticParams`, `generateMetadata`, and OG routes all call `getPieces()`.
- build-time duplication here is a likely broad win with low risk.
- the same content loader is also used by retrieval/embedding scripts, so improvements can compound.

## Constraints
- Keep all existing features working.
- Do not remove research pipeline capabilities.
- Keep CI green: lint, tests, and build must still pass.
- Prefer simple, low-risk changes before complex rewrites.

## Files in scope
- `app/**`
- `lib/**`
- `scripts/**`
- `next.config.mjs`
- `vitest.config.ts`
- `README.md`
- `.github/workflows/**`
- `auto/**`
- `autoresearch.checks.sh`

## Off limits
- Do not remove content pieces or generated reports as a shortcut.
- Do not depend on external paid services for the benchmark.

## Notes for future iterations
- If build wins flatten out, the next best target is likely research-provider startup overhead in `scripts/research/autoresearch.ts`.
- If a research-specific benchmark becomes mockable and deterministic, start a new session with that metric rather than overloading this one.
