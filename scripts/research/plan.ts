import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

import type { Piece } from '../../lib/pieces'
import { completeJson } from './openai'
import type { DiscoveryPlan } from './types'

const PLAN_DIR = path.join(process.cwd(), 'content', 'research-plans')
const PLAN_VERSION = 1

function computeContentHash(piece: Piece) {
  const payload = JSON.stringify({
    title: piece.title,
    content: piece.content,
    watchQueries: piece.watchQueries,
    watchDomains: piece.watchDomains,
    watchFeeds: piece.watchFeeds,
  })
  return crypto.createHash('sha256').update(payload).digest('hex')
}

function buildFallbackPlan(piece: Piece, nowIso: string, contentHash: string): DiscoveryPlan {
  const fallbackQuery = piece.watchQueries[0] ?? piece.title

  return {
    version: PLAN_VERSION,
    pieceId: piece.id,
    pieceSlug: piece.slug,
    createdAt: nowIso,
    contentHash,
    focusAreas: [
      {
        id: 'fa-01',
        label: 'Primary updates',
        rationale: 'Track direct extensions or contradictions to the piece.',
        queries: [fallbackQuery],
        stanceTargets: ['extend', 'contradict'],
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

async function generatePlan(piece: Piece, nowIso: string, contentHash: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required to generate discovery plans.')
  }

  const systemPrompt =
    'You are the editor-in-chief. Create a discovery plan for a research swarm. Output JSON only.'

  const userPrompt = `Piece ID: ${piece.id}
Title: ${piece.title}
Mood: ${piece.mood.join(', ')}
Excerpt: ${piece.excerpt}
Watch queries: ${piece.watchQueries.join('; ') || 'none'}
Watch domains: ${piece.watchDomains.join('; ') || 'none'}
Watch feeds: ${piece.watchFeeds.join('; ') || 'none'}

Piece content (excerpt):
${piece.content.slice(0, 1800)}

Return JSON with keys:
- version (number)
- pieceId (number)
- pieceSlug (string)
- createdAt (ISO string)
- contentHash (string)
- focusAreas: array of 3-5 items, each with { id, label, rationale, queries, stanceTargets }
- sourcePolicy: { domains, feeds, recencyDays, maxResultsPerQuery }

Constraints:
- Use recencyDays=14 and maxResultsPerQuery=5.
- Include watch domains/feeds as provided.
- Queries must be short, specific, and anchored to the piece content.
- Each query must include at least one concrete noun phrase or named entity from the piece (avoid generic methodology/intro guides).
- If the piece is personal or reflective, focus on named people, projects, tools, or claims mentioned in the piece.
- stanceTargets uses: support, extend, contradict.
`

  const plan = await completeJson<DiscoveryPlan>({
    apiKey,
    systemPrompt,
    userPrompt,
    maxTokens: 900,
  })

  if (!plan.focusAreas?.length) {
    throw new Error('Discovery plan missing focus areas')
  }

  const focusAreas = [...plan.focusAreas]
  if (piece.watchQueries.length) {
    focusAreas.push({
      id: `fa-watch-${piece.id}`,
      label: 'Watchlist queries',
      rationale: 'Explicit queries supplied in frontmatter.',
      queries: piece.watchQueries,
      stanceTargets: ['extend', 'contradict'],
    })
  }

  return {
    ...plan,
    version: PLAN_VERSION,
    pieceId: piece.id,
    pieceSlug: piece.slug,
    createdAt: nowIso,
    contentHash,
    focusAreas,
    sourcePolicy: {
      domains: piece.watchDomains,
      feeds: piece.watchFeeds,
      recencyDays: 14,
      maxResultsPerQuery: 5,
      ...(plan.sourcePolicy ?? {}),
    },
  }
}

export async function loadOrCreatePlan(piece: Piece, options?: { force?: boolean }) {
  const nowIso = new Date().toISOString()
  const contentHash = computeContentHash(piece)
  const planPath = path.join(PLAN_DIR, `${piece.slug}.json`)

  if (!options?.force) {
    try {
      const raw = await fs.readFile(planPath, 'utf8')
      const existing = JSON.parse(raw) as DiscoveryPlan
      if (existing.contentHash === contentHash) {
        return existing
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  await fs.mkdir(PLAN_DIR, { recursive: true })

  try {
    const plan = await generatePlan(piece, nowIso, contentHash)
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2), 'utf8')
    return plan
  } catch (error) {
    const fallback = buildFallbackPlan(piece, nowIso, contentHash)
    await fs.writeFile(planPath, JSON.stringify(fallback, null, 2), 'utf8')
    return fallback
  }
}
