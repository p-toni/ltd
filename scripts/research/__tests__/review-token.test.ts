import { describe, it, expect } from 'vitest'
import { signReviewToken, verifyReviewToken } from '../review-token'

const secret = 'test-secret-please-rotate'
const now = 1_700_000_000

const goodPayload = {
  pageId: 'wiki-concept-epiplexity',
  kind: 'concept' as const,
  action: 'publish' as const,
  exp: now + 3600,
}

describe('review-token', () => {
  it('round-trips a valid payload', () => {
    const token = signReviewToken(goodPayload, secret)
    const result = verifyReviewToken(token, secret, now)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.payload).toEqual(goodPayload)
  })

  it('rejects an expired token', () => {
    const token = signReviewToken({ ...goodPayload, exp: now - 1 }, secret)
    const result = verifyReviewToken(token, secret, now)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('expired')
  })

  it('rejects a tampered signature', () => {
    const token = signReviewToken(goodPayload, secret)
    const [head] = token.split('.')
    const tampered = `${head}.AAAA${'A'.repeat(39)}`
    const result = verifyReviewToken(tampered, secret, now)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('bad-signature')
  })

  it('rejects wrong-secret signatures', () => {
    const token = signReviewToken(goodPayload, secret)
    const result = verifyReviewToken(token, 'different-secret', now)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('bad-signature')
  })

  it('rejects malformed tokens', () => {
    const result = verifyReviewToken('not-a-token', secret, now)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('malformed')
  })

  it('rejects invalid action', () => {
    // Manually craft token with bad action
    const badPayload = { ...goodPayload, action: 'delete' as unknown as 'publish' }
    const token = signReviewToken(badPayload, secret)
    const result = verifyReviewToken(token, secret, now)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('invalid-payload')
  })
})
