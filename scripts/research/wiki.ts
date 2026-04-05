import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

import { readMarkdownFile } from './file-utils'
import { completeJson } from './openai'
import type {
  ExtractedEntity,
  IngestedSource,
  VerificationResult,
  WikiLogEntry,
  WikiPage,
  WikiPageKind,
  WikiPageMeta,
  WikiPageStatus,
} from './types'

const WIKI_STATUSES: WikiPageStatus[] = ['draft', 'published', 'rejected']

const WIKI_ROOT = path.join(process.cwd(), 'content', 'wiki')
const WIKI_KINDS: WikiPageKind[] = ['concept', 'entity', 'source']
const INDEX_PATH = path.join(WIKI_ROOT, 'index.md')
const LOG_PATH = path.join(WIKI_ROOT, 'log.md')

// ── In-memory index ─────────────────────────────────────────

interface IndexEntry {
  kind: WikiPageKind
  filePath: string
  title: string
  pieceRefCount: number
  status: WikiPageStatus
}

let indexCache: Map<string, IndexEntry> | null = null

function invalidateIndex() {
  indexCache = null
}

async function ensureIndex(): Promise<Map<string, IndexEntry>> {
  if (indexCache) return indexCache
  indexCache = new Map()

  for (const kind of WIKI_KINDS) {
    const dir = path.join(WIKI_ROOT, `${kind}s`)
    let entries: string[]
    try {
      entries = await fs.readdir(dir)
    } catch {
      continue
    }
    for (const file of entries) {
      if (!file.endsWith('.md')) continue
      const filePath = path.join(dir, file)
      try {
        const raw = await readMarkdownFile(filePath)
        const meta = parseFrontmatter(raw.frontmatter, filePath)
        if (meta) {
          indexCache.set(meta.id, {
            kind: meta.kind,
            filePath,
            title: meta.title,
            pieceRefCount: meta.pieceRefs.length,
            status: meta.status,
          })
        }
      } catch {
        // skip malformed files
      }
    }
  }

  return indexCache
}

// ── Frontmatter parsing ─────────────────────────────────────

function parseYamlValue(raw: string): string | string[] {
  const trimmed = raw.trim()
  // inline array: [a, b, c]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
  }
  return trimmed.replace(/^['"]|['"]$/g, '')
}

function parseYamlList(frontmatter: string, key: string): string[] {
  const lines = frontmatter.split('\n')
  const result: string[] = []
  let collecting = false

  for (const line of lines) {
    if (line.startsWith(`${key}:`)) {
      const inline = line.slice(key.length + 1).trim()
      if (inline) {
        const parsed = parseYamlValue(inline)
        return Array.isArray(parsed) ? parsed : [parsed]
      }
      collecting = true
      continue
    }
    if (collecting) {
      if (line.startsWith('  - ') || line.startsWith('  -\t')) {
        result.push(line.replace(/^\s+-\s*/, '').replace(/^['"]|['"]$/g, '').trim())
      } else if (line.match(/^\S/) || (line.trim() && !line.startsWith('  '))) {
        break
      }
    }
  }

  return result
}

function parseYamlScalar(frontmatter: string, key: string): string {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : ''
}

function parseFrontmatter(frontmatter: string, filePath: string): WikiPageMeta | null {
  const id = parseYamlScalar(frontmatter, 'id')
  const kind = parseYamlScalar(frontmatter, 'kind') as WikiPageKind
  if (!id || !WIKI_KINDS.includes(kind)) return null

  const rawStatus = parseYamlScalar(frontmatter, 'status') as WikiPageStatus
  // Pages written before the review flow default to published
  // (the seed pass is hand-curated, and unreviewed pipeline pages
  // must explicitly carry status: draft to show up in the digest)
  const status = WIKI_STATUSES.includes(rawStatus) ? rawStatus : 'published'

  return {
    id,
    kind,
    title: parseYamlScalar(frontmatter, 'title'),
    aliases: parseYamlList(frontmatter, 'aliases'),
    createdAt: parseYamlScalar(frontmatter, 'createdAt'),
    updatedAt: parseYamlScalar(frontmatter, 'updatedAt'),
    pieceRefs: parseYamlList(frontmatter, 'pieceRefs'),
    sourceUrls: parseYamlList(frontmatter, 'sourceUrls'),
    tags: parseYamlList(frontmatter, 'tags'),
    status,
  }
}

// ── Serialization ───────────────────────────────────────────

function serializeStringArray(arr: string[]): string {
  if (arr.length === 0) return '[]'
  return `[${arr.join(', ')}]`
}

function serializeWikiPage(page: WikiPage): string {
  const m = page.meta
  const lines = [
    '---',
    `id: ${m.id}`,
    `kind: ${m.kind}`,
    `title: "${m.title.replace(/"/g, '\\"')}"`,
    `aliases: ${serializeStringArray(m.aliases)}`,
    `createdAt: ${m.createdAt}`,
    `updatedAt: ${m.updatedAt}`,
    `pieceRefs: ${serializeStringArray(m.pieceRefs)}`,
    `sourceUrls: ${serializeStringArray(m.sourceUrls)}`,
    `tags: ${serializeStringArray(m.tags)}`,
    `status: ${m.status}`,
    '---',
    '',
    page.body.trim(),
    '',
  ]
  return lines.join('\n')
}

// ── CRUD ────────────────────────────────────────────────────

export async function loadWikiPage(id: string, kind?: WikiPageKind): Promise<WikiPage | null> {
  // Fast path: kind is known
  if (kind) {
    const filePath = path.join(WIKI_ROOT, `${kind}s`, `${id}.md`)
    try {
      const raw = await readMarkdownFile(filePath)
      const meta = parseFrontmatter(raw.frontmatter, filePath)
      if (!meta) return null
      return { meta, body: raw.body, filePath }
    } catch {
      return null
    }
  }

  // Consult index
  const index = await ensureIndex()
  const entry = index.get(id)
  if (entry) {
    try {
      const raw = await readMarkdownFile(entry.filePath)
      const meta = parseFrontmatter(raw.frontmatter, entry.filePath)
      if (!meta) return null
      return { meta, body: raw.body, filePath: entry.filePath }
    } catch {
      return null
    }
  }

  // Fallback: scan all directories
  for (const k of WIKI_KINDS) {
    const result = await loadWikiPage(id, k)
    if (result) return result
  }
  return null
}

export async function writeWikiPage(page: WikiPage): Promise<string> {
  const dir = path.join(WIKI_ROOT, `${page.meta.kind}s`)
  await fs.mkdir(dir, { recursive: true })
  const filePath = path.join(dir, `${page.meta.id}.md`)
  page.filePath = filePath
  await fs.writeFile(filePath, serializeWikiPage(page), 'utf8')
  invalidateIndex()
  return filePath
}

export async function listWikiPages(kind?: WikiPageKind): Promise<WikiPageMeta[]> {
  const results: WikiPageMeta[] = []
  const kinds = kind ? [kind] : WIKI_KINDS

  for (const k of kinds) {
    const dir = path.join(WIKI_ROOT, `${k}s`)
    let entries: string[]
    try {
      entries = await fs.readdir(dir)
    } catch {
      continue
    }
    for (const file of entries) {
      if (!file.endsWith('.md')) continue
      try {
        const raw = await readMarkdownFile(path.join(dir, file))
        const meta = parseFrontmatter(raw.frontmatter, path.join(dir, file))
        if (meta) results.push(meta)
      } catch {
        // skip
      }
    }
  }

  return results
}

// ── Status queries ──────────────────────────────────────────

/**
 * Set of wiki record IDs (as emitted by embed-pieces.ts) whose pages
 * are currently published. Callers filter wiki embeddings against this
 * set to suppress drafts/rejected from retrieval without re-embedding.
 */
export async function loadPublishedWikiSlugs(): Promise<Set<string>> {
  const index = await ensureIndex()
  const slugs = new Set<string>()
  for (const [id, entry] of index) {
    if (entry.status === 'published') {
      slugs.add(`wiki-${entry.kind}-${id}`)
    }
  }
  return slugs
}

/**
 * Flip a wiki page's status and persist it. Returns null if the page
 * cannot be found. Used by the digest review route.
 */
export async function setWikiPageStatus(
  id: string,
  kind: WikiPageKind,
  status: WikiPageStatus,
): Promise<WikiPage | null> {
  const page = await loadWikiPage(id, kind)
  if (!page) return null
  page.meta.status = status
  page.meta.updatedAt = new Date().toISOString().slice(0, 10)
  await writeWikiPage(page)
  return page
}

// ── Log ─────────────────────────────────────────────────────

export async function appendToLog(entry: WikiLogEntry): Promise<void> {
  const line = `- ${entry.timestamp} | ${entry.operation} | ${entry.pageId} | ${entry.detail}\n`
  await fs.appendFile(LOG_PATH, line, 'utf8')
}

// ── Index ───────────────────────────────────────────────────

export async function rebuildIndex(): Promise<void> {
  const allPages = await listWikiPages()
  invalidateIndex()

  const grouped: Record<WikiPageKind, WikiPageMeta[]> = {
    concept: [],
    entity: [],
    source: [],
  }

  for (const page of allPages) {
    grouped[page.kind].push(page)
  }

  const lines = [
    '# Wiki Index',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
  ]

  for (const kind of WIKI_KINDS) {
    const pages = grouped[kind].sort((a, b) => a.title.localeCompare(b.title))
    lines.push(`## ${kind.charAt(0).toUpperCase() + kind.slice(1)}s (${pages.length})`)
    for (const p of pages) {
      lines.push(`- [${p.title}](/wiki/${kind}s/${p.id}) — ${p.pieceRefs.length} piece refs`)
    }
    lines.push('')
  }

  await fs.writeFile(INDEX_PATH, lines.join('\n'), 'utf8')
}

// ── Entity extraction ───────────────────────────────────────

export async function extractEntities(text: string): Promise<ExtractedEntity[]> {
  const systemPrompt =
    'You are a knowledge extraction engine. Extract concepts, entities, and sources from the given text. Output JSON only.'

  const userPrompt = `Text (excerpt):
${text.slice(0, 2000)}

Return a JSON object with key "entities": an array of objects, each with:
- name: the canonical name
- kind: one of "concept", "entity", "source"
- slug: kebab-case identifier (lowercase, hyphens, no special chars)
- aliases: array of alternative names (can be empty)
- summary: 1-2 sentence description

Rules:
- "concept" = abstract ideas, theories, principles, frameworks
- "entity" = named people, papers, tools, projects, organizations
- "source" = specific articles, papers, or URLs referenced
- Extract 5-15 items, focus on the most important/distinctive ones
- Avoid generic terms like "introduction" or "conclusion"
- Slugs must be unique and descriptive`

  const result = await completeJson<{ entities: ExtractedEntity[] }>({
    systemPrompt,
    userPrompt,
    maxTokens: 1200,
    temperature: 0.1,
  })

  return (result.entities ?? []).filter(
    (e) => e.name && e.kind && e.slug && WIKI_KINDS.includes(e.kind),
  )
}

// ── Find or create ──────────────────────────────────────────

export async function findOrCreateWikiPage(
  entity: ExtractedEntity,
  pieceSlug: string,
  status: WikiPageStatus = 'draft',
): Promise<WikiPage> {
  const existing = await loadWikiPage(entity.slug, entity.kind)
  if (existing) {
    // Merge: add pieceRef if missing. Never re-draft a page the user
    // has already reviewed — new evidence appends silently.
    if (!existing.meta.pieceRefs.includes(pieceSlug)) {
      existing.meta.pieceRefs.push(pieceSlug)
      existing.meta.updatedAt = new Date().toISOString().slice(0, 10)
      await writeWikiPage(existing)
    }
    return existing
  }

  const now = new Date().toISOString().slice(0, 10)
  const page: WikiPage = {
    meta: {
      id: entity.slug,
      kind: entity.kind,
      title: entity.name,
      aliases: entity.aliases,
      createdAt: now,
      updatedAt: now,
      pieceRefs: [pieceSlug],
      sourceUrls: [],
      tags: [],
      status,
    },
    body: `## Summary\n\n${entity.summary}\n\n## Connections\n\n- [${pieceSlug}](/pieces/${pieceSlug})\n`,
    filePath: '',
  }

  await writeWikiPage(page)
  await appendToLog({
    timestamp: new Date().toISOString(),
    operation: 'created',
    pageId: entity.slug,
    detail: `from piece ${pieceSlug}`,
  })

  return page
}

// ── Update from source ──────────────────────────────────────

export async function updateWikiFromSource(
  page: WikiPage,
  source: IngestedSource,
  verification: VerificationResult,
  pieceSlug: string,
): Promise<WikiPage> {
  const url = source.url

  if (!page.meta.sourceUrls.includes(url)) {
    page.meta.sourceUrls.push(url)
  }
  if (!page.meta.pieceRefs.includes(pieceSlug)) {
    page.meta.pieceRefs.push(pieceSlug)
  }
  page.meta.updatedAt = new Date().toISOString().slice(0, 10)

  // Append source reference to connections if not present
  if (!page.body.includes(url)) {
    const sourceNote = `- [${source.title}](${url}) — ${verification.stance}, confidence ${verification.confidence.toFixed(2)}`
    if (page.body.includes('## Connections')) {
      page.body = page.body.replace(
        '## Connections',
        `## Connections\n\n${sourceNote}`,
      )
    } else {
      page.body += `\n## Connections\n\n${sourceNote}\n`
    }
  }

  await writeWikiPage(page)
  await appendToLog({
    timestamp: new Date().toISOString(),
    operation: 'updated',
    pageId: page.meta.id,
    detail: `added source ${url}`,
  })

  return page
}

// ── Source page slug ─────────────────────────────────────────

export function sourceSlug(url: string): string {
  const hostname = new URL(url).hostname.replace(/\./g, '-')
  const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 6)
  return `${hostname}-${hash}`
}

// ── Pipeline integration: update wiki from verification ─────

export async function updateWikiFromVerification(
  piece: { slug: string; content: string },
  source: IngestedSource,
  verification: VerificationResult,
  _dateLabel: string,
): Promise<void> {
  // 1. Create/update source wiki page
  const srcSlug = sourceSlug(source.url)
  let srcPage = await loadWikiPage(srcSlug, 'source')

  if (!srcPage) {
    const now = new Date().toISOString().slice(0, 10)
    srcPage = {
      meta: {
        id: srcSlug,
        kind: 'source',
        title: source.title,
        aliases: [],
        createdAt: now,
        updatedAt: now,
        pieceRefs: [piece.slug],
        sourceUrls: [source.url],
        tags: [],
        status: 'draft',
      },
      body: [
        '## Summary',
        '',
        verification.summary,
        '',
        '## Stance',
        '',
        `**${verification.stance.charAt(0).toUpperCase() + verification.stance.slice(1)}** (confidence: ${verification.confidence.toFixed(2)})`,
        '',
        '## Evidence',
        '',
        `"${verification.evidence}" — why it matters: ${verification.whyItMatters}`,
        '',
        '## Connections',
        '',
        `- [${piece.slug}](/pieces/${piece.slug})`,
      ].join('\n'),
      filePath: '',
    }
    await writeWikiPage(srcPage)
    await appendToLog({
      timestamp: new Date().toISOString(),
      operation: 'created',
      pageId: srcSlug,
      detail: `source from ${source.url}`,
    })
  } else {
    await updateWikiFromSource(srcPage, source, verification, piece.slug)
  }

  // 2. Extract entities from source content and link to wiki
  try {
    const entities = await extractEntities(source.contentText)
    for (const entity of entities) {
      const wikiPage = await findOrCreateWikiPage(entity, piece.slug)
      await updateWikiFromSource(wikiPage, source, verification, piece.slug)
    }
  } catch (error) {
    // Entity extraction is best-effort — don't fail the pipeline
    console.warn(`[wiki] Entity extraction failed for ${source.url}:`, (error as Error).message)
  }
}
