# Tactical Blog

A Next.js 15 application styled with a teenage.engineering–inspired interface. Pieces live in Markdown files so content changes are simple, reviewable, and portable.

## Stack

- **Framework:** Next.js App Router on React 19
- **Styling:** Tailwind CSS 4 with custom design tokens
- **Content:** Markdown files in `content/pieces/`, rendered with `react-markdown` + `remark-gfm`
- **Components:** Shadcn/Radix UI primitives bundled under `components/ui`

## Getting Started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` to view the Tactical Blog interface.

### Environment

Copy `.env.example` to `.env.local` and fill in the keys you plan to use.
Set `ENABLE_AI=true` and `NEXT_PUBLIC_ENABLE_AI=true` only if you want to enable chat/agent features.

### AI Chat & Retrieval

1. Export a Hugging Face token with access to `nvidia/NV-Embed-v2` (`HF_TOKEN=...`).
2. Generate embeddings: `pnpm ts-node scripts/embed-pieces.ts` (rerun after content changes).
3. In the chat drawer, pick a provider (Anthropic or OpenAI) and supply your API key. Keys are kept client-side.
4. Ask questions—answers stream live with references to the indexed pieces.

### Research Swarm (PR-Approved)

The daily research pipeline now supports an `autoresearch` provider (recommended) and keeps the legacy OpenAI + Brave scout as fallback.

When `RESEARCH_PROVIDER=autoresearch`, the runner treats `karpathy/autoresearch` as an external dependency and automatically syncs the latest `main` branch into `.cache/deps/autoresearch` before execution.

```bash
# Recommended: autoresearch as managed dependency (auto-sync each run)
export RESEARCH_PROVIDER=autoresearch

# Optional overrides
export AUTORESEARCH_REPO_URL='https://github.com/karpathy/autoresearch.git'
export AUTORESEARCH_REPO_REF='main'
export AUTORESEARCH_ENTRYPOINT='main.py'

# Optional custom command template (vars: {query} {title} {slug} {outputDir} {repoDir} {scriptPath})
# export AUTORESEARCH_COMMAND='python3 "{scriptPath}" --query "{query}" --output-dir "{outputDir}"'

# Fallback to legacy scout
export RESEARCH_PROVIDER=legacy

pnpm tsx scripts/research/run-daily.ts --dry-run
pnpm tsx scripts/research/run-daily.ts
```

### Useful Scripts

| Command        | Description                                  |
| -------------- | -------------------------------------------- |
| `pnpm dev`     | Start the dev server                         |
| `pnpm build`   | Create a production build                    |
| `pnpm start`   | Run the built app                            |
| `pnpm lint`    | Lint the codebase with ESLint                |
| `pnpm tsx scripts/research/run-daily.ts` | Run the daily research swarm |

## Content Workflow

1. Create a new Markdown file in `content/pieces/`.
2. Supply a frontmatter header:

```yaml
---
id: 6
title: Example Piece
date: 2025.02.10
mood:
  - contemplative
  - analytical
excerpt: Short logline displayed in the UI
pinned: true
watch_queries:
  - example keyword
watch_domains:
  - example.com
watch_feeds:
  - https://example.com/rss.xml
---

Write your piece in Markdown here. Lists, code blocks, tables, and blockquotes are supported.
```

The loader validates required fields, parses the date, computes `wordCount`, and exposes pieces sorted newest-first. Only the five most recent pieces surface in Navigation to keep the UI focused.

- Read time is calculated automatically from the prose length (baseline 220 words per minute), so you can skip adding it to frontmatter.
- Add `pinned: true` if you want an piece to stay fixed at the top of navigation regardless of publish date.

## Project Layout

- `app/` — Next.js entrypoints (`layout.tsx`, `page.tsx`, global CSS)
- `components/` — Shared UI; `tactical-blog.tsx` contains the main layout
- `content/pieces/` — Markdown sources for pieces
- `lib/` — Helpers like the Markdown loader (`lib/pieces.ts`)
- `public/` — Static assets

## Agent-First Notes

See the capability map in [docs/capability-map.md](file:///Users/ptoni/Downloads/Projects/ltd/docs/capability-map.md) to keep UI actions and agent actions in parity.

## Contributing

Run `pnpm lint` before pushing changes. If you add dependencies with post-install scripts, remember to run `pnpm approve-builds` to whitelist them when needed.
