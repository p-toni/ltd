# Hardening Backlog (Initial)

Date: 2025-11-09

## TypeScript Failures (`pnpm exec tsc --noEmit`)

1. `components/markdown.tsx`
   - Multiple props (`children`, `node`) missing on the inferred types for heading components.
   - `ComponentPropsWithoutRef<Tag>` union does not align with `LibraryManagedAttributes<Tag,...>`.
   - Likely needs explicit typing for `node`/`children` from `react-markdown` AST nodes.

2. `components/tactical-blog-mobile.tsx`
   - `RefObject<HTMLDivElement | null>` passed where `RefObject<HTMLElement>` is required (two call sites).
   - Consider tightening the ref type (`RefObject<HTMLElement>`) or guarding against null values before passing downstream.

3. `hooks/__tests__/use-tactical-blog-experience.test.tsx`
   - Two unused `@ts-expect-error` directives (lines ~159 and ~188).

These failures currently block the Stop hook and CI workflow. Address them before enabling required status checks.

## Next Targets

- Add unit coverage for Markdown components once the type issues are fixed.
- Audit refs/hooks that rely on `document`/`window` to ensure they work in SSR/Edge runtimes.
