# Tactical Blog

A Next.js 15 application styled with a teenage.engineering–inspired interface. Essays live in Markdown files so content changes are simple, reviewable, and portable.

## Stack

- **Framework:** Next.js App Router on React 19
- **Styling:** Tailwind CSS 4 with custom design tokens
- **Content:** Markdown files in `content/essays/`, rendered with `react-markdown` + `remark-gfm`
- **Components:** Shadcn/Radix UI primitives bundled under `components/ui`

## Getting Started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` to view the Tactical Blog interface.

### Useful Scripts

| Command        | Description                                  |
| -------------- | -------------------------------------------- |
| `pnpm dev`     | Start the dev server                         |
| `pnpm build`   | Create a production build                    |
| `pnpm start`   | Run the built app                            |
| `pnpm lint`    | Lint the codebase with ESLint                |

## Content Workflow

1. Create a new Markdown file in `content/essays/`.
2. Supply a frontmatter header:

```yaml
---
id: 6
title: Example Essay
date: 2025.02.10
mood:
  - contemplative
  - analytical
excerpt: Short logline displayed in the UI
---

Write your essay in Markdown here. Lists, code blocks, tables, and blockquotes are supported.
```

The loader validates required fields, parses the date, computes `wordCount`, and exposes essays sorted newest-first. Only the five most recent pieces surface in Navigation to keep the UI focused.

- Read time is calculated automatically from the prose length (baseline 220 words per minute), so you can skip adding it to frontmatter.

## Project Layout

- `app/` — Next.js entrypoints (`layout.tsx`, `page.tsx`, global CSS)
- `components/` — Shared UI; `tactical-blog.tsx` contains the main layout
- `content/essays/` — Markdown sources for essays
- `lib/` — Helpers like the Markdown loader (`lib/essays.ts`)
- `public/` — Static assets

## Contributing

Run `pnpm lint` before pushing changes. If you add dependencies with post-install scripts, remember to run `pnpm approve-builds` to whitelist them when needed.
