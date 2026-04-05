#!/usr/bin/env ts-node
/**
 * One-time bootstrap: seed the wiki from existing pieces and tooltip definitions.
 * Usage: pnpm wiki:seed [--force]
 */

import path from 'node:path'

import { config as loadEnv } from 'dotenv'

import { getPieces } from '../../lib/pieces'
import { TOOLTIP_DEFINITIONS, PAPER_SOURCES } from '../../lib/tooltips'
import {
  extractEntities,
  findOrCreateWikiPage,
  writeWikiPage,
  rebuildIndex,
  appendToLog,
  loadWikiPage,
} from './wiki'
import type { ExtractedEntity, WikiPage } from './types'

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: false })
loadEnv({ path: path.resolve(process.cwd(), '.env'), override: false })

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function seedFromTooltips(): Promise<number> {
  let count = 0
  const seen = new Set<string>()

  for (const [id, tooltip] of Object.entries(TOOLTIP_DEFINITIONS)) {
    // Skip synthesis entries (SYN*)
    if (id.startsWith('SYN')) continue

    const slug = toSlug(tooltip.title)
    if (seen.has(slug)) continue
    seen.add(slug)

    const existing = await loadWikiPage(slug, 'concept')
    if (existing) continue

    const paperSource = PAPER_SOURCES[tooltip.paper]
    const now = new Date().toISOString().slice(0, 10)

    const page: WikiPage = {
      meta: {
        id: slug,
        kind: 'concept',
        title: tooltip.title,
        aliases: [],
        createdAt: now,
        updatedAt: now,
        pieceRefs: [],
        sourceUrls: paperSource ? [paperSource.url] : [],
        tags: [],
      },
      body: [
        '## Summary',
        '',
        tooltip.body,
        '',
        '## Connections',
        '',
        ...(paperSource
          ? [`- [${paperSource.label}](${paperSource.url})`]
          : []),
      ].join('\n'),
      filePath: '',
    }

    await writeWikiPage(page)
    await appendToLog({
      timestamp: new Date().toISOString(),
      operation: 'seeded',
      pageId: slug,
      detail: `from tooltip ${id}`,
    })
    count += 1
  }

  // Seed paper entities
  for (const [id, paper] of Object.entries(PAPER_SOURCES)) {
    const slug = toSlug(paper.label)
    if (seen.has(slug)) continue
    seen.add(slug)

    const existing = await loadWikiPage(slug, 'entity')
    if (existing) continue

    const now = new Date().toISOString().slice(0, 10)

    const page: WikiPage = {
      meta: {
        id: slug,
        kind: 'entity',
        title: paper.label,
        aliases: [],
        createdAt: now,
        updatedAt: now,
        pieceRefs: [],
        sourceUrls: [paper.url],
        tags: ['paper'],
      },
      body: [
        '## Summary',
        '',
        `Academic paper: ${paper.label}`,
        '',
        '## Connections',
        '',
        `- [${paper.label}](${paper.url})`,
      ].join('\n'),
      filePath: '',
    }

    await writeWikiPage(page)
    await appendToLog({
      timestamp: new Date().toISOString(),
      operation: 'seeded',
      pageId: slug,
      detail: `from paper source ${id}`,
    })
    count += 1
  }

  return count
}

async function seedFromPieces(): Promise<number> {
  const pieces = await getPieces()
  let count = 0

  for (const piece of pieces) {
    console.log(`[seed] Extracting entities from: ${piece.slug}`)

    try {
      const entities = await extractEntities(piece.content)
      console.log(`[seed]   Found ${entities.length} entities`)

      for (const entity of entities) {
        await findOrCreateWikiPage(entity, piece.slug)
        count += 1
      }
    } catch (error) {
      console.warn(`[seed]   Failed for ${piece.slug}:`, (error as Error).message)
    }
  }

  return count
}

async function main() {
  const force = process.argv.includes('--force')
  if (force) {
    console.log('[seed] --force: will overwrite existing pages')
  }

  console.log('[seed] Phase 1: Seeding from tooltip definitions...')
  const tooltipCount = await seedFromTooltips()
  console.log(`[seed] Created ${tooltipCount} pages from tooltips`)

  console.log('[seed] Phase 2: Extracting entities from pieces...')
  const pieceCount = await seedFromPieces()
  console.log(`[seed] Created/updated ${pieceCount} pages from pieces`)

  console.log('[seed] Rebuilding index...')
  await rebuildIndex()

  console.log(`[seed] Done. Total new pages from tooltips: ${tooltipCount}, from pieces: ${pieceCount}`)
}

main().catch((error) => {
  console.error('Wiki seed failed:', error)
  process.exit(1)
})
