# Autoresearch: research pipeline + build speed

## Goal
Make the daily research pipeline (`pnpm research:daily`) and cold build even faster — target the `RESEARCH_TIME_BUDGET_MINUTES` soft limit and embedding generation throughput.

## Metric discovery
This repo has two major performance surfaces:
1. **Cold build** (`pnpm build`) — already improved in the prior session and still important for CI/dev loops.
2. **Daily research pipeline** (`pnpm research:daily`) — the scheduled workflow has a soft budget (`RESEARCH_TIME_BUDGET_MINUTES`, CI currently sets `4`) and does repeated content loading, per-piece planning, provider setup, output scanning, ingestion, verification, and report work.
3. **Embedding generation** (`scripts/embed-pieces.ts`) — real throughput depends on remote model latency, but local prep/batching/merge overhead is still worth minimizing.

## Candidate metrics considered
1. **`research_ms` ↓** — deterministic local benchmark of the daily research provider/core loop using a local mock autoresearch repo/command.
   - Pros: directly targets the scheduled pipeline’s local overhead, avoids network/API noise, fast enough for many experiments.
   - Cons: does not include real LLM/search latency.
2. **`build_ms` ↓** — cold `pnpm build`.
   - Pros: stable, broad, already proven valuable.
   - Cons: only indirectly targets daily research.
3. **`embedding_prep_ms` ↓** — deterministic local embedding preparation/batching/merge benchmark.
   - Pros: stable and directly tied to embedding-script local overhead.
   - Cons: excludes remote model latency, so incomplete as a primary metric.
4. **Composite `pipeline_ms` ↓** — sum of research + embedding + build.
   - Pros: broad.
   - Cons: slower benchmark and harder attribution.

## Selected primary metric
- **Primary:** `research_ms` (ms, lower is better)
- **Direction:** ↓

## Why this is the best primary metric
The biggest remaining real-world win is reducing the deterministic local overhead inside the scheduled research pipeline. The workflow already has a strict-ish time budget, and unlike external API latency, local overhead is fully under our control and can be optimized safely and repeatedly.

We still monitor:
- `embedding_prep_ms`
- `build_ms`

via the benchmark script, but `research_ms` is the primary keep/discard metric.

## Benchmark command
- `bash auto/autoresearch.sh`

This benchmark:
1. runs a deterministic local research-pipeline benchmark with a mock local autoresearch repo/command,
2. runs a deterministic local embedding-preparation benchmark,
3. runs a cold `pnpm build`,
4. emits:
   - `METRIC research_ms=<number>`
   - `METRIC embedding_prep_ms=<number>`
   - `METRIC build_ms=<number>`

## Constraints
- Keep all existing features working.
- Do not weaken the benchmark workload.
- Do not replace real work with fake no-ops unless the benchmark is explicitly modeling local deterministic overhead that is otherwise dominated by network/API noise.
- Any benchmark-local mocks must preserve the real control-flow shape of the code being optimized.

## First planned experiment
Cache the autoresearch dependency setup across per-piece calls in `scripts/research/autoresearch.ts`, because `gatherAutoResearchResults()` currently pays repo setup costs repeatedly during a single run.
