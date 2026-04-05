#!/usr/bin/env ts-node
/**
 * Process clipped URLs from content/inbox/ into wiki pages.
 * Usage: pnpm inbox:process
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import { config as loadEnv } from 'dotenv'

import { getPieces, type Piece } from '../../lib/pieces'
import { ingestUrl } from './ingest'
import { verifySource } from './verifier'
import { readMarkdownFile } from './file-utils'
import {
  updateWikiFromVerification,
  writeWikiPage,
  sourceSlug,
  appendToLog,
} from './wiki'
import type { InboxItem, WikiPage } from './types'

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: false })
loadEnv({ path: path.resolve(process.cwd(), '.env'), override: false })

const INBOX_DIR = path.join(process.cwd(), 'content', 'inbox')
const MIN_CONFIDENCE = 0.65

function parseInboxFrontmatter(frontmatter: string): InboxItem {
  const get = (key: string): string => {
    const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : ''
  }

  const getList = (key: string): string[] => {
    const lines = frontmatter.split('\n')
    const result: string[] = []
    let collecting = false
    for (const line of lines) {
      if (line.startsWith(`${key}:`)) {
        const inline = line.slice(key.length + 1).trim()
        if (inline && inline !== '[]') {
          return inline
            .replace(/^\[|\]$/g, '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        }
        collecting = true
        continue
      }
      if (collecting) {
        if (line.startsWith('  - ')) {
          result.push(line.replace(/^\s+-\s*/, '').trim())
        } else if (line.match(/^\S/)) {
          break
        }
      }
    }
    return result
  }

  return {
    url: get('url'),
    note: get('note'),
    clippedAt: get('clippedAt'),
    tags: getList('tags'),
    status: (get('status') as InboxItem['status']) || 'pending',
    processedAt: get('processedAt') || undefined,
  }
}

function findRelevantPieces(
  pieces: Piece[],
  contentText: string,
  tags: string[],
): Piece[] {
  // Score pieces by keyword overlap with source content + tag matching
  const contentLower = contentText.toLowerCase()
  const tagSet = new Set(tags.map((t) => t.toLowerCase()))

  const scored = pieces.map((piece) => {
    let score = 0

    // Title words in content
    const titleWords = piece.title.toLowerCase().split(/\s+/)
    for (const word of titleWords) {
      if (word.length > 3 && contentLower.includes(word)) score += 2
    }

    // Watch queries in content
    for (const query of piece.watchQueries) {
      if (contentLower.includes(query.toLowerCase())) score += 5
    }

    // Tags match watch queries
    for (const tag of tagSet) {
      for (const query of piece.watchQueries) {
        if (query.toLowerCase().includes(tag)) score += 3
      }
    }

    return { piece, score }
  })

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ piece }) => piece)
}

async function markInboxItem(
  filePath: string,
  status: 'processed' | 'rejected',
  reason?: string,
): Promise<void> {
  const raw = await fs.readFile(filePath, 'utf8')
  const updated = raw
    .replace(/^status:\s*.+$/m, `status: ${status}`)
    .replace(/^---\n/, `---\nprocessedAt: ${new Date().toISOString()}\n`)

  await fs.writeFile(filePath, updated, 'utf8')
  if (reason) {
    console.log(`  [${status}] ${reason}`)
  }
}

async function main() {
  let entries: string[]
  try {
    entries = await fs.readdir(INBOX_DIR)
  } catch {
    console.log('[inbox] No inbox directory found.')
    return
  }

  const mdFiles = entries.filter((f) => f.endsWith('.md'))
  if (mdFiles.length === 0) {
    console.log('[inbox] No inbox items.')
    return
  }

  const pieces = await getPieces()
  let processed = 0
  let rejected = 0

  for (const file of mdFiles) {
    const filePath = path.join(INBOX_DIR, file)
    console.log(`[inbox] Processing: ${file}`)

    const raw = await readMarkdownFile(filePath)
    const item = parseInboxFrontmatter(raw.frontmatter)

    if (item.status !== 'pending') {
      console.log(`  Skipping (status: ${item.status})`)
      continue
    }

    if (!item.url) {
      await markInboxItem(filePath, 'rejected', 'No URL')
      rejected += 1
      continue
    }

    const ingested = await ingestUrl(item.url)
    if (!ingested) {
      await markInboxItem(filePath, 'rejected', 'Failed to ingest URL')
      rejected += 1
      continue
    }

    // Find relevant pieces
    const relevantPieces = findRelevantPieces(pieces, ingested.contentText, item.tags)
    console.log(`  Matched ${relevantPieces.length} pieces`)

    // Verify against each matched piece and update wiki
    for (const piece of relevantPieces) {
      try {
        const verification = await verifySource(piece, ingested)
        if (verification.confidence >= MIN_CONFIDENCE) {
          await updateWikiFromVerification(piece, ingested, verification, new Date().toISOString().slice(0, 10))
          console.log(`  Updated wiki from piece ${piece.slug} (confidence: ${verification.confidence.toFixed(2)})`)
        }
      } catch (error) {
        console.warn(`  Verification failed for ${piece.slug}:`, (error as Error).message)
      }
    }

    // Always create a source wiki page for manually clipped URLs
    const srcSlug = sourceSlug(item.url)
    const now = new Date().toISOString().slice(0, 10)
    const srcPage: WikiPage = {
      meta: {
        id: srcSlug,
        kind: 'source',
        title: ingested.title,
        aliases: [],
        createdAt: now,
        updatedAt: now,
        pieceRefs: relevantPieces.map((p) => p.slug),
        sourceUrls: [item.url],
        tags: item.tags,
      },
      body: [
        '## Summary',
        '',
        `Clipped from ${ingested.publisher} on ${item.clippedAt.slice(0, 10)}.`,
        item.note ? `\nNote: ${item.note}` : '',
        '',
        '## Connections',
        '',
        ...relevantPieces.map((p) => `- [${p.title}](/pieces/${p.slug})`),
      ]
        .filter(Boolean)
        .join('\n'),
      filePath: '',
    }

    await writeWikiPage(srcPage)
    await appendToLog({
      timestamp: new Date().toISOString(),
      operation: 'created',
      pageId: srcSlug,
      detail: `inbox clip from ${item.url}`,
    })

    await markInboxItem(filePath, 'processed')
    processed += 1
  }

  console.log(`[inbox] Done. Processed: ${processed}, Rejected: ${rejected}`)
}

main().catch((error) => {
  console.error('Inbox processing failed:', error)
  process.exit(1)
})
