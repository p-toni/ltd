# Wiki + Inbox — Remaining Milestones

## Done

- [x] M1: Wiki foundation (types, CRUD, seed, index, log)
- [x] M2: Pipeline integration (updateWikiFromVerification in run-daily)
- [x] M3: Lint pass (contradiction, orphaned, stale, broken-link rules)
- [x] M4A+4B: Embed wiki fragments + retrieval filter (atomic)
- [x] M5A: Inbox file format
- [x] M5B: iOS Shortcut guide
- [x] M5C: Web clip page + API (/clip, /api/clip)
- [x] M5D: Inbox processor (scripts/research/inbox.ts)
- [x] Review flow: digest email, HMAC tokens, /api/wiki/review, draft→published→rejected
- [x] Anthropic provider switch (openai.ts → provider-aware)

## Remaining

### M4C: Wiki context in LLM prompt
- In `lib/llm.ts` → `buildContextPrompt`, add a WIKI section after existing CONTEXT
- Format: `[W:concepts/epiplexity] Structural information for bounded observers . score 0.91`
- In `buildSystemPrompt`, add: "When citing wiki pages, use [W:page-id] format."

### M4E: Citation rendering
- Extend `CITATION_REGEX` in `hooks/use-tactical-blog-experience.ts` to match `[W:concepts/slug]`
- On click, navigate to `/wiki/{slug}`

### M4F: missing-connection lint rule
- Load wiki embeddings, call cosineSimilarity on piece pairs
- Pairs with similarity > 0.7 but zero shared wiki concepts → info-level finding
- Add to `scripts/research/lint.ts`

### Nice to have
- [ ] Automate `pnpm inbox:process` (GHA workflow or Vercel cron)
- [ ] Wiki index page route (`/wiki` listing all pages)
- [ ] Cross-piece connection notes when a wiki page has 2+ pieceRefs
