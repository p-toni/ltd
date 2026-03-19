# Autoresearch: round 3 — research pipeline, embeddings, determinism

## Goal
Make the entire research pipeline and embedding generation even faster and more stable — specifically target embedding throughput, memory usage during `research:daily`, and make the benchmark fully deterministic across machines (no timing variance from git/network).

## Metric discovery
Key repo realities:
- `pnpm research:daily` has a soft budget via `RESEARCH_TIME_BUDGET_MINUTES` and CI sets it to `4`.
- The biggest recent wins came from `scripts/research/autoresearch.ts`: caching repo setup across pieces and making URL scanning more efficient.
- Real daily runs are dominated by network/API latency, so a useful optimization loop must isolate deterministic local overhead.
- `scripts/embed-pieces.ts` still does meaningful local work before remote embedding calls: content loading, fragment generation, batching, item shaping, and merging.
- The next high-value step is a benchmark with **zero git/network timing in the measured section** while still exercising the real code paths as much as possible.

## Candidate metrics considered
1. **`research_core_ms` ↓** — deterministic per-run local overhead of the research provider/core loop, with git/network removed from the timed section.
   - Pros: best proxy for remaining repo-controlled daily-pipeline cost; directly tied to the `RESEARCH_TIME_BUDGET_MINUTES` goal.
   - Cons: excludes true external latency.
2. **`embedding_items_per_s` ↑** — deterministic local embedding-prep throughput.
   - Pros: directly targets embedding generation speed.
   - Cons: narrower than total research-pipeline impact.
3. **`research_peak_rss_mb` ↓** — deterministic peak RSS during research benchmark.
   - Pros: directly targets stability / memory usage.
   - Cons: memory is important but usually subordinate to large time wins unless usage is pathological.
4. **`provider_cold_start_ms` ↓** — deterministic time to prepare the autoresearch dependency and first invocation.
   - Pros: useful cold-start metric.
   - Cons: previous round already captured the major win here; narrower than full remaining core-loop cost.
5. **`pipeline_score` composite** — weighted combination of time, memory, and embedding throughput.
   - Pros: broad.
   - Cons: harder to reason about and easy to overfit.

## Selected primary metric
- **Primary:** `research_core_ms` (ms, lower is better)
- **Direction:** ↓

## Why this is the best primary metric
This is now the single best metric because it captures the remaining repo-controlled cost inside the daily research loop after removing machine-specific git/network variance. It targets the real operational pain point — the scheduled run’s time budget — while staying deterministic enough for high-confidence autonomous optimization.

## Secondary metrics to monitor
- `research_peak_rss_mb` ↓
- `embedding_items_per_s` ↑
- `embedding_peak_rss_mb` ↓
- `build_ms` ↓ (monitor only; not primary in round 3)

## Benchmark command
- `bash auto/autoresearch.sh`

The benchmark:
1. prepares a local mock autoresearch fixture outside the timed section,
2. primes repo setup outside the timed section,
3. measures median deterministic research-core time across repeated runs,
4. measures deterministic embedding-prep throughput and peak RSS across repeated runs,
5. optionally measures cold build as a monitored secondary metric,
6. emits `METRIC` lines.

## Constraints
- Keep all existing features working.
- Do not weaken the benchmark workload.
- Timed sections must exclude git/network variance only when that variance is explicitly outside the targeted local-overhead metric.
- Avoid benchmark-only hacks that do not translate to real `research:daily` / embedding generation wins.

## First planned experiments
1. Cache stable env-derived command configuration inside `scripts/research/autoresearch.ts` (repo command template, entrypoint, python bin) so per-piece runs do less repeated setup.
2. Reduce temporary object/allocation churn in `scripts/embed-pieces.ts` local prep and merge paths, aiming to improve `embedding_items_per_s` without hurting `research_core_ms`.
