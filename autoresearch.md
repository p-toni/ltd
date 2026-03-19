# Autoresearch: round 3 — research pipeline, embeddings, determinism

## Objective
Make the entire research pipeline and embedding generation even faster and more stable — specifically target embedding throughput, memory usage during `research:daily`, and make the benchmark fully deterministic across machines (no timing variance from git/network).

## Metrics
- **Primary**: `research_core_ms` (ms, lower is better)
- **Secondary**:
  - `research_peak_rss_mb` (lower is better)
  - `embedding_items_per_s` (higher is better)
  - `embedding_peak_rss_mb` (lower is better)

## How to Run
- `bash auto/autoresearch.sh`
- Benchmark is deterministic by design:
  - local mock autoresearch fixture
  - git/repo setup performed outside the timed section
  - repeated runs for the fast research-core metric
  - no network timing in the measured section

## Files in Scope
- `scripts/research/**`
- `scripts/embed-pieces.ts`
- `lib/**`
- `auto/**`
- `autoresearch.*`

## Off Limits
- Do not weaken benchmark work.
- Do not fake throughput by removing real prep/merge work.
- Do not replace real pipeline structure with a benchmark-only path that would not help the actual repo.

## Constraints
- Keep correctness intact.
- Keep the benchmark deterministic and honest.
- Prefer wins that also plausibly help real `pnpm research:daily` and embedding generation.

## Candidate metrics considered
1. `research_core_ms` ↓
2. `embedding_items_per_s` ↑
3. `research_peak_rss_mb` ↓
4. `provider_cold_start_ms` ↓
5. composite score

## Selected primary metric
`research_core_ms` ↓, because it is the best deterministic proxy for remaining repo-controlled daily-pipeline cost under the `RESEARCH_TIME_BUDGET_MINUTES` pressure.

## First two planned experiments
1. Cache stable env-derived command configuration in `scripts/research/autoresearch.ts` so per-piece runs do less repeated setup.
2. Reduce local object/allocation churn in `scripts/embed-pieces.ts` prep/merge paths to improve `embedding_items_per_s` and memory behavior.

## Notes
Previous round already found two major wins in `scripts/research/autoresearch.ts`:
- cache dependency setup across pieces
- iterative + parallel URL collection

Round 3 starts from that improved baseline and now focuses on determinism, memory, and embedding throughput.
