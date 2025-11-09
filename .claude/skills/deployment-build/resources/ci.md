# CI / CD Reference

## GitHub Actions Template

```yaml
name: build

on:
  pull_request:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 10.10.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test --run
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: next-build
          path: .next
```

## Best Practices

- Cache `.pnpm-store` and `.next/cache` for faster reruns.
- Fail fast; do not `continue-on-error` for lint/test/build.
- Upload `.next` as an artifact so you can deploy or debug later.
- Separate deploy workflow that consumes the artifact and runs `vercel deploy --prod --prebuilt` with `VERCEL_TOKEN`.

## Smoke Tests

- Hit `/` and any touched routes via Playwright or `curl` before promoting.
- Monitor Vita/perf budgets using Vercel Analytics or Lighthouse CI.
