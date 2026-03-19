import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { getPieces } from '../lib/pieces'
import { gatherAutoResearchResults } from '../scripts/research/autoresearch'
import type { DiscoveryPlan } from '../scripts/research/types'

const execFileAsync = promisify(execFile)
const ROOT = process.cwd()
const FIXTURE_ROOT = path.join(ROOT, '.cache', 'bench-fixtures', 'mock-autoresearch-src')
const DEFAULT_REPO_CACHE = path.join(ROOT, '.cache', 'deps', 'autoresearch')
const DEFAULT_OUTPUT_CACHE = path.join(ROOT, '.cache', 'autoresearch')

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n)
}

async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function runGit(args: string[], cwd?: string) {
  await execFileAsync('git', args, { cwd })
}

async function ensureFixtureRepo() {
  const hasGit = await pathExists(path.join(FIXTURE_ROOT, '.git'))
  if (hasGit) {
    return FIXTURE_ROOT
  }

  await fs.rm(FIXTURE_ROOT, { recursive: true, force: true })
  await fs.mkdir(FIXTURE_ROOT, { recursive: true })
  await fs.writeFile(
    path.join(FIXTURE_ROOT, 'mock-autoresearch.sh'),
    `#!/usr/bin/env bash
set -euo pipefail
slug="$1"
outdir="$2"
query="$3"
mkdir -p "$outdir/nested"
printf 'query=%s\n' "$query" > "$outdir/run.txt"
printf 'https://example.com/%s\nhttps://research.example/%s\n' "$slug" "$slug" > "$outdir/nested/urls.txt"
`,
    'utf8',
  )
  await fs.chmod(path.join(FIXTURE_ROOT, 'mock-autoresearch.sh'), 0o755)
  await fs.writeFile(path.join(FIXTURE_ROOT, 'README.md'), '# mock autoresearch fixture\n', 'utf8')

  await runGit(['init', '--initial-branch=main'], FIXTURE_ROOT)
  await runGit(['config', 'user.name', 'autoresearch-bench'], FIXTURE_ROOT)
  await runGit(['config', 'user.email', 'autoresearch@example.com'], FIXTURE_ROOT)
  await runGit(['add', '.'], FIXTURE_ROOT)
  await runGit(['commit', '-m', 'init fixture'], FIXTURE_ROOT)

  return FIXTURE_ROOT
}

function buildPlan(piece: Awaited<ReturnType<typeof getPieces>>[number]): DiscoveryPlan {
  return {
    version: 1,
    pieceId: piece.id,
    pieceSlug: piece.slug,
    createdAt: '2026-03-19T00:00:00.000Z',
    contentHash: `bench-${piece.slug}`,
    focusAreas: [
      {
        id: 'fa-01',
        label: 'bench',
        rationale: 'benchmark research provider overhead',
        queries: [...piece.watchQueries.slice(0, 2), piece.title].filter(Boolean),
        stanceTargets: ['extend'],
      },
    ],
    sourcePolicy: {
      domains: piece.watchDomains,
      feeds: piece.watchFeeds,
      recencyDays: 14,
      maxResultsPerQuery: 5,
    },
  }
}

async function main() {
  const repoUrl = await ensureFixtureRepo()

  process.env.AUTORESEARCH_REPO_URL = repoUrl
  process.env.AUTORESEARCH_REPO_REF = 'main'
  process.env.AUTORESEARCH_COMMAND = 'bash "{repoDir}/mock-autoresearch.sh" "{slug}" "{outputDir}" "{query}"'

  await fs.rm(DEFAULT_REPO_CACHE, { recursive: true, force: true })
  await fs.rm(DEFAULT_OUTPUT_CACHE, { recursive: true, force: true })

  const startMs = nowMs()
  const pieces = await getPieces()
  let totalUrls = 0

  for (const piece of pieces) {
    const results = await gatherAutoResearchResults(piece, buildPlan(piece))
    totalUrls += results.length
  }

  const elapsedMs = nowMs() - startMs
  console.log(`research benchmark: pieces=${pieces.length} urls=${totalUrls} ms=${elapsedMs}`)
  console.log(`METRIC research_ms=${elapsedMs}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
