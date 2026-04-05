#!/usr/bin/env ts-node
import fs from 'node:fs/promises'
import path from 'node:path'

import { getPieces } from '../../lib/pieces'
import { applyInsertions, type InsertionProposal } from './apply'
import { readMarkdownFile, replaceMarkdownBody } from './file-utils'
import { ingestUrl } from './ingest'
import { loadOrCreatePlan } from './plan'
import { writeDailyReport } from './report'
import { gatherSearchResults } from './scout'
import { gatherAutoResearchResults } from './autoresearch'
import { verifySource } from './verifier'
import { buildInsertionProposal } from './editor'
import { updateWikiFromVerification } from './wiki'

const MAX_SOURCES_PER_PIECE = 6
const MIN_CONFIDENCE = 0.65
const DEFAULT_TIME_BUDGET_MINUTES = 6
const RESEARCH_PROVIDER = process.env.RESEARCH_PROVIDER ?? 'autoresearch'

function isoDateLabel(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

interface ResearchStatus {
  lastRunAt: string
  lastAppliedUpdateAt: string | null
  proposals: number
  updatesApplied: number
  piecesReviewed: number
}

async function loadPreviousStatus(statusPath: string): Promise<ResearchStatus | null> {
  try {
    const raw = await fs.readFile(statusPath, 'utf8')
    return JSON.parse(raw) as ResearchStatus
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

async function run() {
  const dryRun = process.argv.includes('--dry-run')
  const timeBudgetMinutes = Number(process.env.RESEARCH_TIME_BUDGET_MINUTES ?? DEFAULT_TIME_BUDGET_MINUTES)
  const timeBudgetMs = Number.isFinite(timeBudgetMinutes) && timeBudgetMinutes > 0
    ? timeBudgetMinutes * 60 * 1000
    : null
  const startTime = Date.now()
  console.log(`Starting research run. Budget=${timeBudgetMs ? `${timeBudgetMinutes}m` : 'none'}`)
  const pieces = await getPieces()
  const dateLabel = isoDateLabel()
  const proposalsDir = path.join(process.cwd(), 'content', 'proposals', dateLabel)

  let updatesApplied = 0
  let proposalsCount = 0
  let piecesReviewed = 0
  let abortedEarly = false

  const isBudgetExceeded = () => {
    if (!timeBudgetMs) {
      return false
    }
    return Date.now() - startTime >= timeBudgetMs
  }

  for (const piece of pieces) {
    if (isBudgetExceeded()) {
      abortedEarly = true
      break
    }
    console.log(`\n[Piece ${piece.slug}] Gathering sources...`)
    piecesReviewed += 1
    const plan = await loadOrCreatePlan(piece)
    const candidates = RESEARCH_PROVIDER === 'autoresearch'
      ? await gatherAutoResearchResults(piece, plan)
      : await gatherSearchResults(plan)

    if (!candidates.length) {
      console.log(`[Piece ${piece.slug}] No candidates found.`)
      continue
    }
    console.log(`[Piece ${piece.slug}] Candidates: ${candidates.length}`)

    const proposals: InsertionProposal[] = []

    for (const candidate of candidates) {
      if (isBudgetExceeded()) {
        abortedEarly = true
        break
      }
      if (proposals.length >= MAX_SOURCES_PER_PIECE) {
        break
      }
      if (!candidate.url) {
        continue
      }
      if (piece.content.includes(candidate.url)) {
        continue
      }

      const ingested = await ingestUrl(candidate.url)
      if (!ingested) {
        continue
      }

      const verification = await verifySource(piece, ingested)
      if (verification.recommendedUpdate !== 'insert' || verification.confidence < MIN_CONFIDENCE) {
        continue
      }

      const insertion = await buildInsertionProposal(piece, ingested, verification, dateLabel)

      // Feed wiki from verified source
      try {
        await updateWikiFromVerification(piece, ingested, verification, dateLabel)
      } catch (wikiError) {
        console.warn(`[wiki] Update failed for ${candidate.url}:`, (wikiError as Error).message)
      }

      proposals.push(insertion)
    }

    if (abortedEarly) {
      break
    }

    if (!proposals.length) {
      console.log(`[Piece ${piece.slug}] No proposals generated.`)
      continue
    }

    const piecePath = path.join(process.cwd(), 'content', 'pieces', `${piece.slug}.md`)
    const raw = await readMarkdownFile(piecePath)
    const { content, results } = applyInsertions(piece.content, proposals)

    proposalsCount += proposals.length

    const appliedCount = results.filter((result) => result.applied).length
    updatesApplied += appliedCount

    if (!dryRun && appliedCount > 0) {
      const nextRaw = replaceMarkdownBody(raw.raw, content)
      await fs.writeFile(piecePath, nextRaw, 'utf8')
    }

    await writeDailyReport({
      piece,
      dateLabel,
      outputDir: proposalsDir,
      proposals,
      results,
    })
    console.log(`[Piece ${piece.slug}] Proposals=${proposals.length}, Applied=${appliedCount}`)
  }

  if (!dryRun) {
    const statusPath = path.join(process.cwd(), 'public', 'research', 'status.json')
    await fs.mkdir(path.dirname(statusPath), { recursive: true })
    const previousStatus = await loadPreviousStatus(statusPath)
    const statusPayload: ResearchStatus = {
      lastRunAt: new Date().toISOString(),
      lastAppliedUpdateAt:
        updatesApplied > 0 ? dateLabel : previousStatus?.lastAppliedUpdateAt ?? null,
      proposals: proposalsCount,
      updatesApplied,
      piecesReviewed,
    }
    await fs.writeFile(statusPath, JSON.stringify(statusPayload, null, 2), 'utf8')
  }

  if (abortedEarly) {
    console.warn('Research run stopped early due to time budget.')
  }
  console.log(
    `Research run complete. Pieces=${piecesReviewed}, Proposals=${proposalsCount}, Applied=${updatesApplied}`,
  )
}

run().catch((error) => {
  console.error('Daily research run failed:', error)
  process.exit(1)
})
