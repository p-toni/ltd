# toni.ltd

`toni.ltd` is a Next.js 15 app for publishing markdown pieces, with a desktop reading UI, a mobile interface, optional AI chat controls, and an automated research pipeline.

## Stack

- **Framework:** Next.js App Router + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 with custom design tokens
- **Content:** Markdown files in `content/pieces/`, rendered with `react-markdown` + `remark-gfm`
- **UI:** Radix/Shadcn primitives in `components/ui`
- **AI/Retrieval (optional):** Hugging Face embeddings + OpenAI/Anthropic chat providers

## Requirements

- Node.js 20+
- pnpm 10.10+

## Getting Started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

## Environment Variables

Core keys from `.env.example`:

- `OPENAI_API_KEY` - required by research scripts (`plan`, `verify`, `editor`, `rewrite`)
- `BRAVE_API_KEY` - required by legacy research search
- `HF_TOKEN` - required for embeddings generation and query-time retrieval
- `ENABLE_AI` - enables `/api/chat` on the server (`true` to enable)
- `NEXT_PUBLIC_ENABLE_AI` - enables AI controls in the client (`true` to enable)

Additional optional keys:

- `NEXT_PUBLIC_SITE_URL` - canonical site URL used for metadata and OG links
- `RESEARCH_PROVIDER` - `autoresearch` (default) or `legacy`
- `RESEARCH_TIME_BUDGET_MINUTES` - soft time budget for daily research run
- `RESEARCH_MAX_DOMAIN_QUERIES` - domain-scoped query fanout in legacy scout mode
- `AUTORESEARCH_REPO_URL`, `AUTORESEARCH_REPO_REF`, `AUTORESEARCH_ENTRYPOINT`, `AUTORESEARCH_PYTHON_BIN`, `AUTORESEARCH_COMMAND` - overrides for autoresearch provider execution

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start local dev server |
| `pnpm build` | Build production bundle |
| `pnpm start` | Run production server |
| `pnpm lint` | Lint with ESLint |
| `pnpm test` | Run Vitest |
| `pnpm research:daily` | Run daily research pipeline |
| `pnpm research:rewrite` | Run rewrite flow (GitHub issue-driven) |

Embeddings command:

```bash
pnpm ts-node scripts/embed-pieces.ts
```

Use `--force` to regenerate all vectors when needed.

## AI Chat & Retrieval (Optional)

1. Set both AI flags:
   - `ENABLE_AI=true`
   - `NEXT_PUBLIC_ENABLE_AI=true`
2. Set `HF_TOKEN` and generate embeddings.
3. In the app command bar (`/`), choose provider (`anthropic` or `openai`) and paste an API key.
4. Ask questions against indexed pieces or use agent-style requests that can trigger UI actions.

Current embedding model in code: `sentence-transformers/all-MiniLM-L6-v2`.

## Research Pipeline

`pnpm research:daily`:

- Loads or creates per-piece plans in `content/research-plans/`
- Gathers candidate sources (default `autoresearch`, fallback `legacy`)
- Verifies and proposes insertions
- Writes per-run reports to `content/proposals/<YYYY-MM-DD>/`
- Updates `public/research/status.json` on non-dry runs

`autoresearch` provider behavior:

- Clones or syncs `karpathy/autoresearch` into `.cache/deps/autoresearch`
- Runs the configured entrypoint or custom command
- Extracts URLs from generated `.md`, `.txt`, or `.json` outputs

Recommended local usage:

```bash
# Recommended: autoresearch as managed dependency
export RESEARCH_PROVIDER=autoresearch

# Optional overrides
export AUTORESEARCH_REPO_URL='https://github.com/karpathy/autoresearch.git'
export AUTORESEARCH_REPO_REF='main'
export AUTORESEARCH_ENTRYPOINT='main.py'

# Optional custom command template (vars: {query} {title} {slug} {outputDir} {repoDir} {scriptPath})
# export AUTORESEARCH_COMMAND='python3 "{scriptPath}" --query "{query}" --output-dir "{outputDir}"'

# Fallback to legacy scout
export RESEARCH_PROVIDER=legacy

pnpm research:daily --dry-run
pnpm research:daily
```

`pnpm research:rewrite`:

- Intended for GitHub issue automation (`rewrite` label workflow)
- Requires `GITHUB_EVENT_PATH`
- Generates a rewrite proposal and report when criteria are met

## Content Workflow

Create a file in `content/pieces/` with frontmatter:

```yaml
---
id: 12
title: Example Piece
date: 2026.03.16
mood:
  - contemplative
excerpt: Short summary shown in UI
pinned: false
watch_queries:
  - example topic
watch_domains:
  - example.com
watch_feeds:
  - https://example.com/rss.xml
---
```

Notes:

- Required fields: `id`, `title`, `date`, `mood`, `excerpt`
- Valid moods: `contemplative`, `analytical`, `exploratory`, `critical`
- Date is parsed from `YYYY.MM.DD` (also accepts `YYYY-MM-DD`)
- Pieces are sorted by `pinned` first, then publish date, then id
- Read time and word count are computed automatically
- Automated update markers use `Update (YYYY-MM-DD): ...`

## Project Layout

- `app/` - routes, API handlers, OG image routes
- `components/` - desktop/mobile layouts and shared UI
- `content/pieces/` - markdown source content
- `content/research-plans/` - generated discovery plans
- `content/proposals/` - generated research and rewrite reports
- `lib/` - loaders, retrieval, agent/chat logic
- `scripts/` - embeddings and research automation scripts
- `public/` - static assets and generated research status or embeddings
- `docs/` - supporting project docs

## CI & Automation

- `ci` workflow runs install, lint, test (`pnpm test --run`), and build
- `research-daily` workflow runs on schedule and can open a PR with updates
- `research-rewrite` workflow runs on labeled issues and can open a PR

## Notes

- Capability parity reference: [`docs/capability-map.md`](docs/capability-map.md)
