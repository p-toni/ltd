import { describe, it, expect } from 'vitest'
import { loadPublishedWikiSlugs } from '../wiki'

describe('retrieval filter', () => {
  it('published slugs exclude drafts and include published', async () => {
    const published = await loadPublishedWikiSlugs()

    // Seeded pages are published
    expect(published.has('wiki-concept-epiplexity')).toBe(true)
    expect(published.has('wiki-concept-coupled-feedback-system')).toBe(true)

    // Inbox-created source page is draft
    expect(published.has('wiki-source-arxiv-org-cb9270')).toBe(false)

    // Format check
    for (const slug of published) {
      expect(slug).toMatch(/^wiki-(concept|entity|source)-.+/)
    }
  })

  it('embedding IDs can be mapped to wiki page keys', async () => {
    // Simulate what retrieval.ts does: strip -fragment-N suffix
    const wikiPageKey = (recordId: string) =>
      recordId.replace(/-fragment-\d+$/, '')

    const testId = 'wiki-concept-epiplexity-fragment-0'
    expect(wikiPageKey(testId)).toBe('wiki-concept-epiplexity')

    const published = await loadPublishedWikiSlugs()
    expect(published.has(wikiPageKey(testId))).toBe(true)

    // Draft source should be filtered out
    const draftId = 'wiki-source-arxiv-org-cb9270-fragment-0'
    expect(published.has(wikiPageKey(draftId))).toBe(false)
  })
})
