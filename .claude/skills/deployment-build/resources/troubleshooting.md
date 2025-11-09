# Build Troubleshooting

## ESLint / TypeScript

- Missing types? Run `pnpm exec tsc --noEmit` for detailed output.
- Path alias errors? Verify `tsconfig.json` `paths` + `next.config.mjs` `experimental.tsconfigBase` if set.
- Lint crashes instantly? Delete `.next`, reinstall dependencies.

## Vitest

- Hanging tests → add `--run` or set `CI=1`.
- JSX compilation errors → ensure `vitest.config.ts` defines `test.environment = "jsdom"` and mocks `next/navigation` when needed.
- Snapshot drift → update snapshots locally but gate them in PR description.

## `pnpm build`

- Dynamic import errors → confirm Markdown frontmatter and `contentlayer` (if used) parse correctly.
- Memory pressure → `NODE_OPTIONS=--max_old_space_size=4096 pnpm build` temporarily.
- Large assets → compress images / use `next/image`.

## Env Vars

- Run `pnpm exec env-cmd -f .env.local -- pnpm build` to ensure all vars exist.
- For CI/Vercel, add a tiny `env.mjs` that throws when required vars are missing so failures happen early.
