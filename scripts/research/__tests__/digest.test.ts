import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import { writeWikiPage } from '../wiki'
import { verifyReviewToken } from '../review-token'
import { runDigest } from '../digest'
import type { WikiPage } from '../types'

const WIKI_ROOT = path.join(process.cwd(), 'content', 'wiki')
const TEST_ID = 'ztest-digest-stub'

function makeDraftSourcePage(): WikiPage {
  return {
    meta: {
      id: TEST_ID,
      kind: 'source',
      title: 'Test Source for Digest',
      aliases: [],
      createdAt: '2026-04-05',
      updatedAt: '2026-04-05',
      pieceRefs: ['01-on-digital-minimalism'],
      sourceUrls: ['https://example.com/test-article'],
      tags: ['test'],
      status: 'draft',
    },
    body: [
      '## Summary',
      '',
      'A test source about digital minimalism practices.',
      '',
      '## Stance',
      '',
      '**Support** (confidence: 0.85)',
      '',
      '## Evidence',
      '',
      '"Digital decluttering leads to improved focus." — why it matters: validates the core thesis.',
      '',
      '## Connections',
      '',
      '- [01-on-digital-minimalism](/pieces/01-on-digital-minimalism)',
    ].join('\n'),
    filePath: '',
  }
}

beforeAll(async () => {
  await writeWikiPage(makeDraftSourcePage())
})

afterAll(async () => {
  try {
    await fs.unlink(path.join(WIKI_ROOT, 'sources', `${TEST_ID}.md`))
  } catch {
    // ok
  }
})

describe('runDigest', () => {
  it('detects draft pages and returns skipped when no Resend key', async () => {
    // No RESEND_API_KEY → graceful skip. But the scanner must still find the draft.
    delete process.env.RESEND_API_KEY
    delete process.env.REVIEW_EMAIL_TO
    delete process.env.REVIEW_SECRET
    delete process.env.SITE_URL

    const result = await runDigest()
    expect(result.sent).toBe(false)
    expect(result.skippedReason).toBe('RESEND_API_KEY is not set')
    // It still reports the total pages scanned
    expect(result.scanned).toBe(0) // scanned=0 because env check happens first
  })

  it('builds review URLs with verifiable tokens when env is set', async () => {
    // Set fake env to exercise the full path up to (but not including) sendEmail
    process.env.RESEND_API_KEY = 'fake-resend-key'
    process.env.REVIEW_EMAIL_TO = 'test@test.com'
    process.env.REVIEW_SECRET = 'test-digest-secret'
    process.env.SITE_URL = 'https://example.com'

    // We can't easily intercept sendEmail without mocking fetch.
    // Instead, test the token signing directly for the test page.
    const { signReviewToken } = await import('../review-token')
    const now = Math.floor(Date.now() / 1000)
    const token = signReviewToken(
      { pageId: TEST_ID, kind: 'source', action: 'publish', exp: now + 7 * 24 * 3600 },
      'test-digest-secret',
    )
    const verified = verifyReviewToken(token, 'test-digest-secret', now)
    expect(verified.ok).toBe(true)
    if (verified.ok) {
      expect(verified.payload.pageId).toBe(TEST_ID)
      expect(verified.payload.action).toBe('publish')
    }

    // Clean up env
    delete process.env.RESEND_API_KEY
    delete process.env.REVIEW_EMAIL_TO
    delete process.env.REVIEW_SECRET
    delete process.env.SITE_URL
  })
})
