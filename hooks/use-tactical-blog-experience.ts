'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Piece } from '@/lib/pieces'
import type { RetrievalResult } from '@/lib/retrieval'

export type MoodFilter = Piece['mood'][number] | 'all'

export type ChatRole = 'system' | 'user' | 'assistant' | 'error'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: number
}

export const CHAT_ROLE_LABEL: Record<ChatRole, string> = {
  system: 'SYSTEM',
  user: 'USER',
  assistant: 'AI',
  error: 'ERROR',
}

export const CHAT_ROLE_CLASSNAME: Record<ChatRole, string> = {
  system: 'text-white/60',
  user: 'text-white',
  assistant: 'text-white/60',
  error: 'text-[color:var(--te-orange,#ff6600)]',
}

export const CHAT_CONTENT_CLASSNAME: Record<ChatRole, string> = {
  system: 'text-white/70',
  user: 'text-white',
  assistant: 'text-white/70',
  error: 'text-[color:var(--te-orange,#ff6600)]',
}

export const CITATION_REGEX = /\[#(\d{3})(?:-F(\d{3}))?]/g

type NavigationAnnouncement = 'NEXT' | 'PREV' | 'GOTO'

function createMessageId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatRetrievalSummary(retrieval: RetrievalResult) {
  const lines: string[] = []

  if (retrieval.pieces.length === 0 && retrieval.fragments.length === 0) {
    lines.push('No indexed context matched this query. Try broadening your prompt.')
    return lines.join('\n')
  }

  if (retrieval.pieces.length) {
    lines.push('Pieces:')
    retrieval.pieces.forEach(({ piece, score }) => {
      lines.push(
        `- [#${String(piece.id).padStart(3, '0')}] ${piece.title} (${piece.readTime}) · score ${score.toFixed(2)}`,
      )
    })
  }

  if (retrieval.fragments.length) {
    if (lines.length) {
      lines.push('')
    }
    lines.push('Fragments:')
    retrieval.fragments.forEach(({ fragment, score }) => {
      const snippet = fragment.text.replace(/\s+/g, ' ').slice(0, 140)
      lines.push(`- ${fragment.pieceTitle} › …${snippet}${snippet.length >= 140 ? '…' : ''} · ${score.toFixed(2)}`)
    })
  }

  lines.push('\nCitations coming soon – these results will seed the model response.')
  return lines.join('\n')
}

function formatNavigationFlash(piece: Piece, mode: NavigationAnnouncement) {
  const pieceLabel = String(piece.id).padStart(3, '0')
  const hexLabel = piece.id.toString(16).padStart(2, '0').toUpperCase()
  const command = mode === 'GOTO' ? 'OPEN' : mode
  return `> ${command}_PIECE.exe\n> SUCCESS: Loaded piece #${pieceLabel} [0x${hexLabel}]`
}

export interface TacticalBlogExperience {
  pieces: Piece[]
  currentTime: string
  isChatOpen: boolean
  isChatDetached: boolean
  showChatShortcutHint: boolean
  chatMessages: ChatMessage[]
  chatInput: string
  isChatLoading: boolean
  chatProvider: 'anthropic' | 'openai'
  chatApiKey: string
  selectedMood: MoodFilter
  selectedPieceId: number | null
  pendingFragmentAnchor: string | null
  filteredPieces: Piece[]
  sortedPieces: Piece[]
  pinnedCount: number
  selectedPiece: Piece | null
  currentPieceId: number | null
  flashMessage: string | null
  showFlash: (message: string, duration?: number) => void
  clearFlash: () => void
  goToPiece: (pieceId: number, options?: { announce?: NavigationAnnouncement | string }) => boolean
  goToNextPiece: () => boolean
  goToPreviousPiece: () => boolean
  registerChatContainer: (node: HTMLDivElement | null) => void
  registerChatInput: (node: HTMLTextAreaElement | null) => void
  focusChatInput: () => void
  setChatInput: (value: string) => void
  setChatProvider: (provider: 'anthropic' | 'openai') => void
  setChatApiKey: (value: string) => void
  setIsChatOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  setIsChatDetached: (value: boolean | ((prev: boolean) => boolean)) => void
  setShowChatShortcutHint: (value: boolean) => void
  setSelectedMood: (value: MoodFilter) => void
  setSelectedPieceId: (value: number | null | ((prev: number | null) => number | null)) => void
  handleChatSubmit: () => Promise<void>
  handleCitationClick: (pieceNumber: number, fragmentOrder?: number) => void
  setPendingFragmentAnchor: (value: string | null) => void
}

export function useTacticalBlogExperience(pieces: Piece[]): TacticalBlogExperience {
  const [currentTime, setCurrentTime] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isChatDetached, setIsChatDetached] = useState(false)
  const [showChatShortcutHint, setShowChatShortcutHint] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'system-welcome',
      role: 'system',
      content: 'Connected. Retrieval ready. Type `/help` for commands.',
      createdAt: Date.now(),
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatProvider, setChatProvider] = useState<'anthropic' | 'openai'>('anthropic')
  const [chatApiKey, setChatApiKey] = useState('')
  const [selectedMood, setSelectedMood] = useState<MoodFilter>('all')
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(() => pieces[0]?.id ?? null)
  const [pendingFragmentAnchor, setPendingFragmentAnchor] = useState<string | null>(null)
  const [flashMessage, setFlashMessage] = useState<string | null>(null)
  const flashTimeoutRef = useRef<number | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null)

  const registerChatContainer = useCallback((node: HTMLDivElement | null) => {
    chatContainerRef.current = node
  }, [])

  const registerChatInput = useCallback((node: HTMLTextAreaElement | null) => {
    chatInputRef.current = node
  }, [])

  const focusChatInput = useCallback(() => {
    const input = chatInputRef.current
    if (!input) {
      return
    }
    input.focus({ preventScroll: true })
    const length = input.value.length
    try {
      input.setSelectionRange(length, length)
    } catch (error) {
      // selection not supported (e.g., on some mobile browsers)
    }
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}:${seconds}`)
    }

    updateTime()
    const interval = window.setInterval(updateTime, 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (pieces.length === 0) {
      setSelectedPieceId(null)
      return
    }

    if (!pieces.some((piece) => piece.id === selectedPieceId)) {
      setSelectedPieceId(pieces[0].id)
    }
  }, [pieces, selectedPieceId])

  const filteredPieces = useMemo(() => {
    if (selectedMood === 'all') {
      return pieces
    }

    return pieces.filter((piece) => piece.mood.includes(selectedMood))
  }, [pieces, selectedMood])

  const sortedPieces = useMemo(() => {
    const list = [...filteredPieces]
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1
      }

      if (a.publishedAt !== b.publishedAt) {
        return b.publishedAt - a.publishedAt
      }

      return b.id - a.id
    })
    return list
  }, [filteredPieces])

  const pinnedCount = useMemo(() => sortedPieces.filter((piece) => piece.pinned).length, [sortedPieces])

  const selectedPieceFromState =
    selectedPieceId !== null ? sortedPieces.find((piece) => piece.id === selectedPieceId) ?? null : null

  const fallbackPiece = sortedPieces[0] ?? null
  const selectedPiece = selectedPieceFromState ?? fallbackPiece
  const currentPieceId = selectedPiece?.id ?? null

  const clearFlash = useCallback(() => {
    if (flashTimeoutRef.current !== null) {
      window.clearTimeout(flashTimeoutRef.current)
      flashTimeoutRef.current = null
    }
    setFlashMessage(null)
  }, [setFlashMessage])

  const showFlash = useCallback(
    (message: string, duration = 1500) => {
      if (!message) {
        return
      }

      clearFlash()
      setFlashMessage(message)

      if (duration > 0) {
        flashTimeoutRef.current = window.setTimeout(() => {
          setFlashMessage(null)
          flashTimeoutRef.current = null
        }, duration)
      }
    },
    [clearFlash, setFlashMessage],
  )

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current)
        flashTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const container = chatContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [chatMessages, isChatLoading, isChatDetached, isChatOpen])

  useEffect(() => {
    if (!isChatOpen) {
      return
    }
    const handle = window.requestAnimationFrame(() => focusChatInput())
    return () => window.cancelAnimationFrame(handle)
  }, [focusChatInput, isChatOpen])

  const goToPiece = useCallback(
    (pieceId: number, options?: { announce?: NavigationAnnouncement | string }) => {
      const target = sortedPieces.find((piece) => piece.id === pieceId)
      if (!target) {
        return false
      }

      const changed = selectedPieceId !== target.id
      if (changed) {
        setSelectedPieceId(target.id)
      }

      if (options?.announce && target) {
        const { announce } = options
        if (announce === 'NEXT' || announce === 'PREV' || announce === 'GOTO') {
          showFlash(formatNavigationFlash(target, announce))
        } else {
          showFlash(announce)
        }
      }

      return changed
    },
    [selectedPieceId, setSelectedPieceId, showFlash, sortedPieces],
  )

  const goToNextPiece = useCallback(() => {
    if (selectedPieceId === null) {
      return false
    }

    const index = sortedPieces.findIndex((piece) => piece.id === selectedPieceId)
    if (index === -1 || index >= sortedPieces.length - 1) {
      return false
    }

    const target = sortedPieces[index + 1]
    goToPiece(target.id, { announce: 'NEXT' })
    return true
  }, [goToPiece, selectedPieceId, sortedPieces])

  const goToPreviousPiece = useCallback(() => {
    if (selectedPieceId === null) {
      return false
    }

    const index = sortedPieces.findIndex((piece) => piece.id === selectedPieceId)
    if (index <= 0) {
      return false
    }

    const target = sortedPieces[index - 1]
    goToPiece(target.id, { announce: 'PREV' })
    return true
  }, [goToPiece, selectedPieceId, sortedPieces])

  const handleChatSubmit = useCallback(async () => {
    if (isChatLoading) {
      return
    }

    const trimmed = chatInput.trim()
    if (!trimmed) {
      return
    }

    const apiKey = chatApiKey.trim()
    if (!apiKey) {
      const errorMessage: ChatMessage = {
        id: createMessageId('error'),
        role: 'error',
        content: '⚠️ Provide an API key before querying the model.',
        createdAt: Date.now(),
      }
      setChatMessages((previous) => [...previous, errorMessage])
      return
    }

    const timestamp = Date.now()
    const userMessage: ChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: trimmed,
      createdAt: timestamp,
    }
    const assistantId = createMessageId('assistant')
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }

    setChatMessages((previous) => [...previous, userMessage, assistantMessage])
    setChatInput('')
    setIsChatLoading(true)

    let assistantAccumulator = ''
    const appendToAssistant = (delta: string) => {
      assistantAccumulator += delta
      setChatMessages((previous) =>
        previous.map((message) => (message.id === assistantId ? { ...message, content: assistantAccumulator } : message)),
      )
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          pieceId: selectedPiece?.id,
          provider: chatProvider,
          apiKey,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error ?? 'Unexpected response from chat API')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Streaming response not available in this environment')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let finished = false

      const processBuffer = (packet: string) => {
        const lines = packet.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data:')) {
            continue
          }

          const data = line.slice(5).trim()
          if (!data || data === '[DONE]') {
            continue
          }

          let payload: { type: string; [key: string]: unknown }
          try {
            payload = JSON.parse(data)
          } catch (error) {
            console.error('Failed to parse SSE payload', error)
            continue
          }

          if (payload.type === 'meta') {
            const retrieval = payload.retrieval as RetrievalResult
            appendToAssistant(`${formatRetrievalSummary(retrieval)}\n\n`)
          } else if (payload.type === 'token') {
            appendToAssistant(String(payload.delta ?? ''))
          } else if (payload.type === 'error') {
            const message = String(payload.message ?? 'Model error')
            appendToAssistant(`\n\n⚠️ ${message}`)
            finished = true
          } else if (payload.type === 'done') {
            finished = true
          }
        }
      }

      while (!finished) {
        const { value, done } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })

        let boundary
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const packet = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          processBuffer(packet)
        }
      }

      if (buffer.trim().length) {
        processBuffer(buffer)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      const errorMessage: ChatMessage = {
        id: createMessageId('error'),
        role: 'error',
        content: `⚠️ ${message}`,
        createdAt: Date.now(),
      }
      setChatMessages((previous) => [...previous, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }, [chatApiKey, chatInput, chatProvider, isChatLoading, selectedPiece?.id])

  const handleCitationClick = useCallback(
    (pieceNumber: number, fragmentOrder?: number) => {
      const pieceId = Number(pieceNumber)
      const fragmentId = fragmentOrder ? String(fragmentOrder).padStart(3, '0') : '001'
      const anchorId = `piece-${String(pieceId).padStart(3, '0')}-fragment-${fragmentId}`

      goToPiece(pieceId)
      setPendingFragmentAnchor(anchorId)
      setIsChatOpen(true)
      requestAnimationFrame(focusChatInput)
    },
    [focusChatInput, goToPiece, setIsChatOpen, setPendingFragmentAnchor],
  )

  useEffect(() => {
    if (!sortedPieces.length) {
      setSelectedPieceId(null)
      return
    }

    if (selectedPieceId === null || !sortedPieces.some((piece) => piece.id === selectedPieceId)) {
      setSelectedPieceId(sortedPieces[0].id)
    }
  }, [sortedPieces, selectedPieceId])

  useEffect(() => {
    if (!pendingFragmentAnchor) {
      return
    }

    const match = pendingFragmentAnchor.match(/^piece-(\d{3})/)
    const expectedPieceId = match ? Number(match[1]) : null

    if (expectedPieceId !== null && currentPieceId !== expectedPieceId) {
      return
    }

    let attempts = 0
    let rafHandle: number | null = null

    const tryScroll = () => {
      const target = document.getElementById(pendingFragmentAnchor)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        target.classList.add('fragment-highlight')
        window.setTimeout(() => target.classList.remove('fragment-highlight'), 1200)
        setPendingFragmentAnchor(null)
        return
      }

      attempts += 1
      if (attempts < 12) {
        rafHandle = window.requestAnimationFrame(tryScroll)
      } else {
        setPendingFragmentAnchor(null)
      }
    }

    rafHandle = window.requestAnimationFrame(tryScroll)

    return () => {
      if (rafHandle !== null) {
        window.cancelAnimationFrame(rafHandle)
      }
    }
  }, [pendingFragmentAnchor, currentPieceId])

  return {
    pieces,
    currentTime,
    isChatOpen,
    isChatDetached,
    showChatShortcutHint,
    chatMessages,
    chatInput,
    isChatLoading,
    chatProvider,
    chatApiKey,
    selectedMood,
    selectedPieceId,
    pendingFragmentAnchor,
    filteredPieces,
    sortedPieces,
    pinnedCount,
    selectedPiece,
    currentPieceId,
    flashMessage,
    showFlash,
    clearFlash,
    goToPiece,
    goToNextPiece,
    goToPreviousPiece,
    registerChatContainer,
    registerChatInput,
    focusChatInput,
    setChatInput,
    setChatProvider,
    setChatApiKey,
    setIsChatOpen,
    setIsChatDetached,
    setShowChatShortcutHint,
    setSelectedMood,
    setSelectedPieceId,
    handleChatSubmit,
    handleCitationClick,
    setPendingFragmentAnchor,
  }
}
