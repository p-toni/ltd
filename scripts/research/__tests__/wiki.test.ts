import { describe, it, expect, afterAll } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  writeWikiPage,
  loadWikiPage,
  listWikiPages,
  loadPublishedWikiSlugs,
  setWikiPageStatus,
  sourceSlug,
} from '../wiki'
import type { WikiPage } from '../types'

const TEST_PREFIX = 'ztest-crud-'
const WIKI_ROOT = path.join(process.cwd(), 'content', 'wiki')

function makePage(id: string, status: 'draft' | 'published' | 'rejected'): WikiPage {
  return {
    meta: {
      id,
      kind: 'concept',
      title: `Test ${id}`,
      aliases: ['tst'],
      createdAt: '2026-04-05',
      updatedAt: '2026-04-05',
      pieceRefs: ['01-on-digital-minimalism'],
      sourceUrls: [],
      tags: ['test'],
      status,
    },
    body: '## Summary\n\nA test page body.\n',
    filePath: '',
  }
}

async function cleanup() {
  for (const kind of ['concept', 'entity', 'source']) {
    const dir = path.join(WIKI_ROOT, `${kind}s`)
    try {
      const files = await fs.readdir(dir)
      for (const f of files) {
        if (f.startsWith(TEST_PREFIX)) await fs.unlink(path.join(dir, f))
      }
    } catch {
      // dir may not exist
    }
  }
}

afterAll(cleanup)

describe('wiki CRUD', () => {
  it('round-trips a wiki page', async () => {
    const id = `${TEST_PREFIX}roundtrip`
    const page = makePage(id, 'draft')
    const writtenPath = await writeWikiPage(page)
    expect(writtenPath).toContain(`${id}.md`)

    const loaded = await loadWikiPage(id, 'concept')
    expect(loaded).not.toBeNull()
    expect(loaded!.meta.id).toBe(id)
    expect(loaded!.meta.status).toBe('draft')
    expect(loaded!.meta.aliases).toEqual(['tst'])
    expect(loaded!.meta.pieceRefs).toEqual(['01-on-digital-minimalism'])
    expect(loaded!.body).toContain('A test page body')
  })

  it('finds page via index (no kind hint)', async () => {
    const id = `${TEST_PREFIX}noindex`
    await writeWikiPage(makePage(id, 'published'))
    const loaded = await loadWikiPage(id)
    expect(loaded).not.toBeNull()
    expect(loaded!.meta.id).toBe(id)
  })

  it('lists pages and filters by kind', async () => {
    const id = `${TEST_PREFIX}listed`
    await writeWikiPage(makePage(id, 'published'))
    const all = await listWikiPages()
    expect(all.some((p) => p.id === id)).toBe(true)
    const concepts = await listWikiPages('concept')
    expect(concepts.some((p) => p.id === id)).toBe(true)
  })

  it('loadPublishedWikiSlugs includes published and excludes drafts', async () => {
    const draftId = `${TEST_PREFIX}draft-filter`
    const pubId = `${TEST_PREFIX}pub-filter`
    await writeWikiPage(makePage(draftId, 'draft'))
    await writeWikiPage(makePage(pubId, 'published'))

    const published = await loadPublishedWikiSlugs()
    expect(published.has(`wiki-concept-${pubId}`)).toBe(true)
    expect(published.has(`wiki-concept-${draftId}`)).toBe(false)
  })

  it('setWikiPageStatus flips status on disk', async () => {
    const id = `${TEST_PREFIX}flip`
    await writeWikiPage(makePage(id, 'draft'))

    const flipped = await setWikiPageStatus(id, 'concept', 'published')
    expect(flipped).not.toBeNull()
    expect(flipped!.meta.status).toBe('published')

    const reloaded = await loadWikiPage(id, 'concept')
    expect(reloaded!.meta.status).toBe('published')
  })
})

describe('sourceSlug', () => {
  it('produces stable hostname-hash slugs', () => {
    const s1 = sourceSlug('https://arxiv.org/abs/2601.03220')
    expect(s1).toMatch(/^arxiv-org-[a-f0-9]{6}$/)
    const s2 = sourceSlug('https://arxiv.org/abs/2601.03220')
    expect(s2).toBe(s1)
  })

  it('differs for same host different path', () => {
    const a = sourceSlug('https://example.com/a')
    const b = sourceSlug('https://example.com/b')
    expect(a).not.toBe(b)
    expect(a.startsWith('example-com-')).toBe(true)
    expect(b.startsWith('example-com-')).toBe(true)
  })
})
