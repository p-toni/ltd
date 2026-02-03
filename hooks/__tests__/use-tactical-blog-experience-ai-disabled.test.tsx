import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Piece } from '../../lib/pieces'

vi.mock('@/lib/feature-flags', () => ({
  ENABLE_AI: false,
  ENABLE_MOBILE_LAYOUT: true,
}))

const SAMPLE_PIECES: Piece[] = [
  {
    id: 1,
    title: 'Fallback',
    date: '2025.01.01',
    mood: ['analytical'],
    excerpt: 'Notes on systems',
    content: 'Content for piece one.',
    wordCount: 120,
    publishedAt: Date.parse('2025-01-01'),
    readTime: '1 min',
    readTimeMinutes: 1,
    pinned: false,
    slug: 'fallback',
    watchQueries: [],
    watchDomains: [],
    watchFeeds: [],
    updateCount: 0,
    latestUpdateAt: null,
  },
]

const loadHook = async () => (await import('../use-tactical-blog-experience')).useTacticalBlogExperience

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useTacticalBlogExperience AI disabled', () => {
  it('blocks chat submit when AI is disabled', async () => {
    const useTacticalBlogExperience = await loadHook()
    const { result } = renderHook(() => useTacticalBlogExperience(SAMPLE_PIECES))

    expect(result.current.aiEnabled).toBe(false)

    act(() => {
      result.current.setChatInput('Hello AI')
    })

    await act(async () => {
      await result.current.handleChatSubmit()
    })

    expect(result.current.flashMessage).toBe('AI_DISABLED')
  })

  it('blocks agent submit when AI is disabled', async () => {
    const useTacticalBlogExperience = await loadHook()
    const { result } = renderHook(() => useTacticalBlogExperience(SAMPLE_PIECES))

    act(() => {
      result.current.setAgentInput('Open piece 001')
    })

    await act(async () => {
      await result.current.handleAgentSubmit()
    })

    expect(result.current.flashMessage).toBe('AI_DISABLED')
  })
})
