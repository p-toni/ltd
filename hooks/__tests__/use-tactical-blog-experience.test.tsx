import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'

import { useTacticalBlogExperience } from '../use-tactical-blog-experience'
import type { Piece } from '../../lib/pieces'

const SAMPLE_PIECES: Piece[] = [
  {
    id: 1,
    title: 'Field Notes',
    date: '2025.01.01',
    mood: ['analytical'],
    excerpt: 'Notes on systems',
    content: 'Content for piece one.',
    wordCount: 120,
    publishedAt: Date.parse('2025-01-01'),
    readTime: '1 min',
    readTimeMinutes: 1,
    pinned: false,
    slug: 'field-notes',
  },
  {
    id: 2,
    title: 'Terminal Dreams',
    date: '2025.02.14',
    mood: ['critical'],
    excerpt: 'Dreaming in monochrome',
    content: 'Content for piece two.',
    wordCount: 340,
    publishedAt: Date.parse('2025-02-14'),
    readTime: '2 min',
    readTimeMinutes: 2,
    pinned: false,
    slug: 'terminal-dreams',
  },
  {
    id: 3,
    title: 'Gesture Theory',
    date: '2025.03.21',
    mood: ['exploratory'],
    excerpt: 'Gestures as language',
    content: 'Content for piece three.',
    wordCount: 560,
    publishedAt: Date.parse('2025-03-21'),
    readTime: '3 min',
    readTimeMinutes: 3,
    pinned: false,
    slug: 'gesture-theory',
  },
]

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('useTacticalBlogExperience navigation', () => {
  it('advances through pieces and respects boundaries', () => {
    const { result } = renderHook(() => useTacticalBlogExperience(SAMPLE_PIECES))

    expect(result.current.selectedPieceId).toBe(1)

    let moved = true
    act(() => {
      moved = result.current.goToPreviousPiece()
    })
    expect(moved).toBe(true)
    expect(result.current.selectedPieceId).toBe(2)

    act(() => {
      moved = result.current.goToPreviousPiece()
    })
    expect(moved).toBe(true)
    expect(result.current.selectedPieceId).toBe(3)

    act(() => {
      moved = result.current.goToPreviousPiece()
    })
    expect(moved).toBe(false)
    expect(result.current.selectedPieceId).toBe(3)

    act(() => {
      moved = result.current.goToNextPiece()
    })
    expect(moved).toBe(true)
    expect(result.current.selectedPieceId).toBe(2)
    expect(result.current.flashMessage).toContain('NEXT_PIECE.exe')

    act(() => {
      moved = result.current.goToNextPiece()
    })
    expect(moved).toBe(true)
    expect(result.current.selectedPieceId).toBe(1)

    act(() => {
      moved = result.current.goToNextPiece()
    })
    expect(moved).toBe(false)
    expect(result.current.selectedPieceId).toBe(1)

    act(() => {
      result.current.goToPiece(3, { announce: 'GOTO' })
    })
    expect(result.current.flashMessage).toContain('OPEN_PIECE.exe')

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.flashMessage).toBeNull()
  })
})

describe('useTacticalBlogExperience chat workflow', () => {
  it('asks for API key before submitting chat', async () => {
    const { result } = renderHook(() => useTacticalBlogExperience(SAMPLE_PIECES))

    act(() => {
      result.current.setChatInput('hello system')
    })

    await act(async () => {
      await result.current.handleChatSubmit()
    })

    const lastMessage = result.current.chatMessages.at(-1)
    expect(lastMessage?.role).toBe('error')
    expect(lastMessage?.content).toContain('Provide an API key')
  })
})
