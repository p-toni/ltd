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
import { verifySource } from './verifier'
import { buildInsertionProposal } from './editor'

const MAX_SOURCES_PER_PIECE = 6
const MIN_CONFIDENCE = 0.65

function isoDateLabel(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

async function run() {
  const dryRun = process.argv.includes('--dry-run')
  const pieces = await getPieces()
  const dateLabel = isoDateLabel()
  const proposalsDir = path.join(process.cwd(), 'content', 'proposals', dateLabel)

  let updatesApplied = 0
  let proposalsCount = 0
  let piecesReviewed = 0

  for (const piece of pieces) {
    piecesReviewed += 1
    const plan = await loadOrCreatePlan(piece)
    const candidates = await gatherSearchResults(plan)

    if (!candidates.length) {
      continue
    }

    const proposals: InsertionProposal[] = []

    for (const candidate of candidates) {
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
      proposals.push(insertion)
    }

    if (!proposals.length) {
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
  }

  if (!dryRun && (updatesApplied > 0 || proposalsCount > 0)) {
    const statusPath = path.join(process.cwd(), 'public', 'research', 'status.json')
    await fs.mkdir(path.dirname(statusPath), { recursive: true })
    const statusPayload = {
      lastRunAt: new Date().toISOString(),
      proposals: proposalsCount,
      updatesApplied,
      piecesReviewed,
    }
    await fs.writeFile(statusPath, JSON.stringify(statusPayload, null, 2), 'utf8')
  }

  console.log(
    `Research run complete. Pieces=${piecesReviewed}, Proposals=${proposalsCount}, Applied=${updatesApplied}`,
  )
}

run().catch((error) => {
  console.error('Daily research run failed:', error)
  process.exit(1)
})
