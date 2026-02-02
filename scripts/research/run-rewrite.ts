#!/usr/bin/env ts-node
import fs from 'node:fs/promises'
import path from 'node:path'

import { getPieces } from '../../lib/pieces'
import { readMarkdownFile, replaceMarkdownBody } from './file-utils'
import { ingestUrl } from './ingest'
import { loadOrCreatePlan } from './plan'
import { writeRewriteReport } from './report'
import { gatherSearchResults } from './scout'
import { verifySource } from './verifier'
import { buildRewrite } from './rewriter'
import type { IngestedSource } from './types'

const MIN_CONFIDENCE = 0.75
const MIN_SOURCES = 3
const MIN_DOMAINS = 2
const MAX_SOURCES = 6

function isoDateLabel(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function parseIssueFields(body: string) {
  const fields: Record<string, string> = {}
  const lines = body.split('\n')
  for (const line of lines) {
    const match = line.match(/^(pieceSlug|intent|scope|priority)\s*:\s*(.+)$/i)
    if (match) {
      fields[match[1].toLowerCase()] = match[2].trim()
    }
  }
  return fields
}

async function loadIssueContext() {
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH is required to run rewrite flow')
  }

  const raw = await fs.readFile(eventPath, 'utf8')
  const payload = JSON.parse(raw) as { issue?: { body?: string } }
  const body = payload.issue?.body ?? ''
  const fields = parseIssueFields(body)

  return {
    pieceSlug: fields.pieceslug ?? '',
    intent: fields.intent ?? 'Rewrite with new evidence.',
    scope: fields.scope ?? 'Full piece',
    priority: fields.priority ?? 'normal',
  }
}

async function run() {
  const { pieceSlug, intent, scope } = await loadIssueContext()
  if (!pieceSlug) {
    throw new Error('Issue body missing pieceSlug')
  }

  const pieces = await getPieces()
  const piece = pieces.find((entry) => entry.slug === pieceSlug)
  if (!piece) {
    throw new Error(`Unknown piece slug: ${pieceSlug}`)
  }

  const plan = await loadOrCreatePlan(piece, { force: true })
  const candidates = await gatherSearchResults(plan)

  const sources: IngestedSource[] = []
  const domains = new Set<string>()

  for (const candidate of candidates) {
    if (sources.length >= MAX_SOURCES) {
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
    if (verification.confidence < MIN_CONFIDENCE) {
      continue
    }
    if (verification.stance !== 'extend' && verification.stance !== 'contradict') {
      continue
    }

    sources.push(ingested)
    domains.add(new URL(ingested.url).hostname)

    if (sources.length >= MIN_SOURCES && domains.size >= MIN_DOMAINS) {
      break
    }
  }

  if (sources.length < MIN_SOURCES || domains.size < MIN_DOMAINS) {
    console.log('Rewrite criteria not met. Exiting without changes.')
    return
  }

  const rewrite = await buildRewrite(piece, sources, intent, scope)
  if (!rewrite.newContent?.trim()) {
    throw new Error('Rewrite missing content')
  }

  const piecePath = path.join(process.cwd(), 'content', 'pieces', `${piece.slug}.md`)
  const raw = await readMarkdownFile(piecePath)
  const nextRaw = replaceMarkdownBody(raw.raw, rewrite.newContent)
  await fs.writeFile(piecePath, nextRaw, 'utf8')

  const dateLabel = isoDateLabel()
  const reportsDir = path.join(process.cwd(), 'content', 'proposals', dateLabel)
  await writeRewriteReport({
    piece,
    dateLabel,
    outputDir: reportsDir,
    sources: sources.map((source) => source.url),
    rewrite,
  })

  console.log('Rewrite proposal generated.')
}

run().catch((error) => {
  console.error('Rewrite flow failed:', error)
  process.exit(1)
})
