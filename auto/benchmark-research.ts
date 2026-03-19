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
const OUTPUT_CACHE = path.join(ROOT, '.cache', 'autoresearch')
const ITERATIONS = 5

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n)
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle]
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
        rationale: 'benchmark deterministic research-core overhead',
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

async function primeRepoSetup(pieces: Awaited<ReturnType<typeof getPieces>>) {
  const firstPiece = pieces[0]
  if (!firstPiece) {
    return
  }
  await fs.rm(OUTPUT_CACHE, { recursive: true, force: true })
  await gatherAutoResearchResults(firstPiece, buildPlan(firstPiece))
  await fs.rm(OUTPUT_CACHE, { recursive: true, force: true })
}

async function runIteration(pieces: Awaited<ReturnType<typeof getPieces>>) {
  await fs.rm(OUTPUT_CACHE, { recursive: true, force: true })
  const startMs = nowMs()
  let totalUrls = 0
  let peakRssBytes = process.memoryUsage().rss

  for (const piece of pieces) {
    const results = await gatherAutoResearchResults(piece, buildPlan(piece))
    totalUrls += results.length
    const rss = process.memoryUsage().rss
    if (rss > peakRssBytes) {
      peakRssBytes = rss
    }
  }

  return {
    elapsedMs: nowMs() - startMs,
    peakRssMb: Math.round(peakRssBytes / (1024 * 1024)),
    totalUrls,
  }
}

async function main() {
  const repoUrl = await ensureFixtureRepo()
  process.env.AUTORESEARCH_REPO_URL = repoUrl
  process.env.AUTORESEARCH_REPO_REF = 'main'
  process.env.AUTORESEARCH_COMMAND = 'bash "{repoDir}/mock-autoresearch.sh" "{slug}" "{outputDir}" "{query}"'

  const pieces = await getPieces()
  await primeRepoSetup(pieces)

  const researchRuns: number[] = []
  let maxPeakRssMb = 0
  let totalUrls = 0

  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
    const result = await runIteration(pieces)
    researchRuns.push(result.elapsedMs)
    totalUrls = result.totalUrls
    if (result.peakRssMb > maxPeakRssMb) {
      maxPeakRssMb = result.peakRssMb
    }
  }

  const researchCoreMs = median(researchRuns)
  console.log(`research core benchmark: runs=${researchRuns.join(',')} median=${researchCoreMs} peak_rss_mb=${maxPeakRssMb} pieces=${pieces.length} urls=${totalUrls}`)
  console.log(`METRIC research_core_ms=${researchCoreMs}`)
  console.log(`METRIC research_peak_rss_mb=${maxPeakRssMb}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
