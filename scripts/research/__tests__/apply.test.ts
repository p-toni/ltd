import { describe, expect, it } from 'vitest'

import { applyInsertion, validateInsertion } from '../apply'

const BASE_CONTENT = `First paragraph.

This is the anchor sentence we want.

Final paragraph.`

const VALID_PROPOSAL = {
  anchor: 'This is the anchor sentence we want.',
  insertion: 'Update (2026-02-01): Added a short update. (Source: https://example.com/post)',
  citationUrl: 'https://example.com/post',
  citationTitle: 'Example Post',
  stance: 'extend' as const,
}

describe('applyInsertion', () => {
  it('applies a valid insertion after a unique anchor', () => {
    const result = applyInsertion(BASE_CONTENT, VALID_PROPOSAL)
    expect(result.applied).toBe(true)
    expect(result.content).toContain(VALID_PROPOSAL.insertion)
  })

  it('rejects when anchor is missing', () => {
    const result = applyInsertion(BASE_CONTENT, {
      ...VALID_PROPOSAL,
      anchor: 'Missing anchor',
    })
    expect(result.applied).toBe(false)
    expect(result.reason).toBe('Anchor not found')
  })

  it('rejects when anchor is not unique', () => {
    const content = 'Anchor here. Anchor here.'
    const result = applyInsertion(content, {
      ...VALID_PROPOSAL,
      anchor: 'Anchor here.',
    })
    expect(result.applied).toBe(false)
    expect(result.reason).toBe('Anchor is not unique')
  })

  it('rejects when insertion exceeds max words', () => {
    const longInsertion = `Update (2026-02-01): ${Array.from({ length: 130 }, () => 'word').join(' ')} (Source: https://example.com/post)`
    const validation = validateInsertion(BASE_CONTENT, {
      ...VALID_PROPOSAL,
      insertion: longInsertion,
    })
    expect(validation.valid).toBe(false)
    expect(validation.reason).toBe('Insertion exceeds word limit')
  })

  it('rejects when insertion adds a heading', () => {
    const validation = validateInsertion(BASE_CONTENT, {
      ...VALID_PROPOSAL,
      insertion: 'Update (2026-02-01):\n# Heading',
    })
    expect(validation.valid).toBe(false)
    expect(validation.reason).toBe('Insertion contains heading markup')
  })
})
