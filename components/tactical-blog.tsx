'use client'

import type { ReactNode } from 'react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Markdown } from '@/components/markdown'
import type { Piece } from '@/lib/pieces'
import type { RetrievalResult } from '@/lib/retrieval'
import { cn } from '@/lib/utils'

type MoodFilter = Piece['mood'][number] | 'all'

const NAV_VISIBLE_LIMIT = 5
const NAV_ITEM_HEIGHT = 48
const NAV_ITEM_GAP = 4
const STATUS_BAR_HEIGHT = 32
const MOOD_FILTERS: MoodFilter[] = ['all', 'contemplative', 'analytical', 'exploratory', 'critical']
const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], [data-cursor-interactive], input, textarea, select, summary, label'
const OFFSCREEN_CURSOR = { x: -100, y: -100 }
const CITATION_REGEX = /\[#(\d{3})(?:-F(\d{3}))?]/g

interface CustomCursorProps {
  position: { x: number; y: number }
  moving: boolean
  interactive: boolean
  speed: number
}

type ChatRole = 'system' | 'user' | 'assistant' | 'error'

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: number
}

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

const CHAT_ROLE_LABEL: Record<ChatRole, string> = {
  system: 'SYSTEM',
  user: 'USER',
  assistant: 'AI',
  error: 'ERROR',
}

const CHAT_ROLE_CLASSNAME: Record<ChatRole, string> = {
  system: 'text-white/60',
  user: 'text-white',
  assistant: 'text-white/60',
  error: 'text-[color:var(--te-orange,#ff6600)]',
}

const CHAT_CONTENT_CLASSNAME: Record<ChatRole, string> = {
  system: 'text-white/70',
  user: 'text-white',
  assistant: 'text-white/70',
  error: 'text-[color:var(--te-orange,#ff6600)]',
}

function isInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false
  }

  return Boolean(target.closest(INTERACTIVE_SELECTOR))
}

const CustomCursor = memo(function CustomCursor({ position, moving, interactive, speed }: CustomCursorProps) {
  const accent = 'var(--te-orange, #ff6600)'
  const baseSize = 24
  const clampedSpeed = Math.min(speed, 48)
  const scale = interactive ? 1.12 : moving ? 1.06 : 1
  const haloScale = 1.25 + Math.min(clampedSpeed / 160, 0.2)
  const haloOpacity = moving ? Math.min(0.24 + clampedSpeed / 220, 0.45) : 0.16
  const dotRadius = interactive ? 3 : moving ? 2.4 : 2.1
  const dotFill = interactive ? '#ffffff' : accent

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        <svg
          width={baseSize}
          height={baseSize}
          viewBox="0 0 24 24"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80 transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${scale * haloScale})`,
            filter: 'blur(0.6px)',
            mixBlendMode: 'screen',
          }}
        >
          <line x1="12" y1="0" x2="12" y2="24" stroke={accent} strokeWidth="1" />
          <line x1="0" y1="12" x2="24" y2="12" stroke={accent} strokeWidth="1" />
          <circle cx="12" cy="12" r={dotRadius + 1.6} fill="none" stroke={accent} strokeWidth="0.8" opacity={haloOpacity} />
        </svg>

        <svg
          width={baseSize}
          height={baseSize}
          viewBox="0 0 24 24"
          className="relative block transition-transform duration-150 ease-out"
          style={{ transform: `scale(${scale})` }}
        >
          <line x1="12" y1="0" x2="12" y2="24" stroke={accent} strokeWidth="1" />
          <line x1="0" y1="12" x2="24" y2="12" stroke={accent} strokeWidth="1" />
          <circle cx="12" cy="12" r={dotRadius} fill={dotFill} stroke={accent} strokeWidth="0.8" />
        </svg>
      </div>
    </div>
  )
})
CustomCursor.displayName = 'CustomCursor'

function getTimestamp() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }

  return Date.now()
}

interface TacticalBlogProps {
  pieces: Piece[]
}

export default function TacticalBlog({ pieces }: TacticalBlogProps) {
  const [currentTime, setCurrentTime] = useState('')
  const [cursorPos, setCursorPos] = useState(OFFSCREEN_CURSOR)
  const [cursorVisible, setCursorVisible] = useState(false)
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
  const [isFinePointer, setIsFinePointer] = useState(false)
  const [isCursorMoving, setIsCursorMoving] = useState(false)
  const [isCursorInteractive, setIsCursorInteractive] = useState(false)
  const [cursorSpeed, setCursorSpeed] = useState(0)

  const movementTimeoutRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const latestPointerRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastSampleRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const latestInteractiveRef = useRef(false)
  const cursorVisibleRef = useRef(false)
  const navListMaxHeight =
    NAV_VISIBLE_LIMIT * NAV_ITEM_HEIGHT + (NAV_VISIBLE_LIMIT - 1) * NAV_ITEM_GAP + NAV_ITEM_GAP * 2
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const hotkeyTimeoutRef = useRef<number | null>(null)

  const resetCursorState = useCallback(() => {
    cursorVisibleRef.current = false
    latestPointerRef.current = null
    lastSampleRef.current = null
    latestInteractiveRef.current = false

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (movementTimeoutRef.current !== null) {
      window.clearTimeout(movementTimeoutRef.current)
      movementTimeoutRef.current = null
    }

    setCursorVisible(false)
    setIsCursorMoving(false)
    setIsCursorInteractive(false)
    setCursorSpeed(0)
    setCursorPos(OFFSCREEN_CURSOR)
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
    const openChat = () => {
      setIsChatOpen(true)
      setShowChatShortcutHint(false)
      requestAnimationFrame(() => chatInputRef.current?.focus())
    }

    const closeChat = () => {
      setIsChatOpen(false)
      setIsChatDetached(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        openChat()
        return
      }

      if ((event.key === '`' || event.key === '~') && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        setIsChatOpen((prev) => {
          const next = !prev
          if (next) {
            requestAnimationFrame(() => chatInputRef.current?.focus())
          }
          return next
        })
        setShowChatShortcutHint(false)
        return
      }

      if (event.key === 'Escape') {
        if (isChatOpen) {
          event.preventDefault()
          if (isChatDetached) {
            setIsChatDetached(false)
          } else {
            closeChat()
          }
        }
        return
      }

      if (event.key === '?' && event.shiftKey) {
        if (hotkeyTimeoutRef.current) {
          window.clearTimeout(hotkeyTimeoutRef.current)
        }
        setShowChatShortcutHint(true)
        hotkeyTimeoutRef.current = window.setTimeout(() => {
          setShowChatShortcutHint(false)
          hotkeyTimeoutRef.current = null
        }, 3000)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (hotkeyTimeoutRef.current) {
        window.clearTimeout(hotkeyTimeoutRef.current)
        hotkeyTimeoutRef.current = null
      }
    }
  }, [isChatDetached, isChatOpen])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(pointer: fine)')
    const handlePointerChange = (event: MediaQueryListEvent) => {
      setIsFinePointer(event.matches)
    }

    setIsFinePointer(mediaQuery.matches)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handlePointerChange)
      return () => mediaQuery.removeEventListener('change', handlePointerChange)
    }

    mediaQuery.addListener(handlePointerChange)
    return () => mediaQuery.removeListener(handlePointerChange)
  }, [])

  useEffect(() => {
    if (!isFinePointer) {
      resetCursorState()
      return
    }

    const updateCursorState = () => {
      animationFrameRef.current = null

      const latestPointer = latestPointerRef.current
      if (!latestPointer) {
        return
      }

      setCursorPos((prev) =>
        prev.x === latestPointer.x && prev.y === latestPointer.y ? prev : { x: latestPointer.x, y: latestPointer.y },
      )

      const previousSample = lastSampleRef.current ?? latestPointer
      const deltaTime = Math.max(latestPointer.time - previousSample.time, 16)
      const deltaX = latestPointer.x - previousSample.x
      const deltaY = latestPointer.y - previousSample.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      const velocity = distance / deltaTime
      const normalizedSpeed = velocity * 16.6667
      setCursorSpeed((prev) => prev * 0.6 + normalizedSpeed * 0.4)

      const moving = normalizedSpeed > 0.45
      setIsCursorMoving((prev) => (prev === moving ? prev : moving))

      const interactive = latestInteractiveRef.current
      setIsCursorInteractive((prev) => (prev === interactive ? prev : interactive))

      lastSampleRef.current = { ...latestPointer }

      if (movementTimeoutRef.current !== null) {
        window.clearTimeout(movementTimeoutRef.current)
      }

      movementTimeoutRef.current = window.setTimeout(() => {
        setIsCursorMoving(false)
        setCursorSpeed((prev) => prev * 0.35)
        movementTimeoutRef.current = null
      }, 130)
    }

    const handleMouseMove = (event: MouseEvent) => {
      latestPointerRef.current = { x: event.clientX, y: event.clientY, time: getTimestamp() }
      latestInteractiveRef.current = isInteractiveElement(event.target)

      if (!cursorVisibleRef.current) {
        cursorVisibleRef.current = true
        setCursorVisible(true)
      }

      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(updateCursorState)
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (movementTimeoutRef.current !== null) {
        window.clearTimeout(movementTimeoutRef.current)
        movementTimeoutRef.current = null
      }
    }
  }, [isFinePointer, resetCursorState])

  useEffect(() => {
    if (!isFinePointer) {
      return
    }

    const handleMouseLeave = (event: MouseEvent) => {
      if (!event.relatedTarget) {
        resetCursorState()
      }
    }

    const handleMouseEnter = (event: MouseEvent) => {
      cursorVisibleRef.current = true
      setCursorVisible(true)
      const timestamp = getTimestamp()
      const pointer = { x: event.clientX, y: event.clientY, time: timestamp }
      latestPointerRef.current = pointer
      lastSampleRef.current = pointer
      setCursorPos({ x: pointer.x, y: pointer.y })
    }

    document.addEventListener('mouseleave', handleMouseLeave, { passive: true })
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true })
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [isFinePointer, resetCursorState])

  useEffect(() => {
    if (!isFinePointer) {
      return
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        resetCursorState()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isFinePointer, resetCursorState])

  useEffect(() => {
    if (pieces.length === 0) {
      setSelectedPieceId(null)
      return
    }

    if (!pieces.some((piece) => piece.id === selectedPieceId)) {
      setSelectedPieceId(pieces[0].id)
    }
  }, [pieces, selectedPieceId])


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, isChatLoading, isChatDetached, isChatOpen])
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

  const handleChatSubmit = async () => {
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
        previous.map((message) =>
          message.id === assistantId ? { ...message, content: assistantAccumulator } : message,
        ),
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
  }

  const handleCitationClick = (pieceNumber: number, fragmentOrder?: number) => {
    const pieceId = Number(pieceNumber)
    const fragmentId = fragmentOrder
      ? String(fragmentOrder).padStart(3, '0')
      : '001'
    const anchorId = `piece-${String(pieceId).padStart(3, '0')}-fragment-${fragmentId}`

    setSelectedPieceId(pieceId)
    setPendingFragmentAnchor(anchorId)
    setIsChatOpen(true)
  }

  const renderChatMessageContent = (message: ChatMessage) => {
    const nodes: ReactNode[] = []
    const text = message.content
    let lastIndex = 0
    const regex = new RegExp(CITATION_REGEX.source, 'g')
    regex.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      const [full, pieceStr, fragmentStr] = match
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index))
      }

      const pieceId = Number(pieceStr)
      const fragmentOrder = fragmentStr ? Number(fragmentStr) : undefined
      const key = `${message.id}-${match.index}`

      nodes.push(
        <button
          key={key}
          type="button"
          onClick={() => handleCitationClick(pieceId, fragmentOrder)}
          className="inline-flex items-center rounded border border-white/20 bg-black/40 px-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--te-orange,#ff6600)] transition hover:border-[color:var(--te-orange,#ff6600)]"
        >
          {full}
        </button>,
      )

      lastIndex = match.index + full.length
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex))
    }

    if (nodes.length === 0) {
      return text
    }

    return nodes
  }

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

  if (!pieces.length || !selectedPiece) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white font-mono text-black">
        <span className="text-xs tracking-[0.4em] uppercase">No pieces available</span>
      </div>
    )
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-white font-mono text-black"
      style={isFinePointer ? { cursor: 'none' } : undefined}
    >
      {/* Top System Bar */}
      <div className="flex h-8 items-center justify-between border-b border-black px-4 text-[10px] tracking-wider">
        <div className="flex items-center gap-6">
          <span className="font-bold">SYSTEM</span>
          <span>STATUS: ACTIVE</span>
        </div>
        <div className="flex items-center gap-6">
          <span>TIME: {currentTime}</span>
          <span>
            CURSOR: [{String(cursorPos.x).padStart(4, '0')}, {String(cursorPos.y).padStart(4, '0')}]
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid h-[calc(100vh-4rem)] grid-cols-[280px_1fr_280px] gap-0">
        {/* Left Sidebar - Metadata & Navigation */}
        <div className="flex flex-col gap-6 overflow-y-auto border-r border-black p-6">
          <div>
            <div className="mb-2 text-[10px] tracking-wider text-muted-foreground">NAVIGATION</div>
            <div className="mb-4 text-sm font-bold">PIECES</div>
            <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: navListMaxHeight }}>
              {sortedPieces.map((piece) => {
                const isSelected = Boolean(selectedPiece && selectedPiece.id === piece.id)
                const isPinned = piece.pinned

                return (
                  <button
                    key={piece.id}
                    onClick={() => setSelectedPieceId(piece.id)}
                    className={cn(
                      'relative w-full overflow-hidden border py-2 px-2 text-left text-xs transition-all',
                      isSelected ? 'border-black bg-black text-white' : 'border-transparent hover:border-black',
                      isPinned && !isSelected ? 'border-dashed border-black/50' : null,
                    )}
                    style={
                      isSelected
                        ? {
                            borderLeftWidth: '3px',
                            borderLeftColor: 'oklch(0.65 0.19 45)',
                            backgroundImage: `
                            repeating-linear-gradient(
                              0deg,
                              transparent,
                              transparent 1px,
                              rgba(255, 255, 255, 0.03) 1px,
                              rgba(255, 255, 255, 0.03) 2px
                            ),
                            repeating-linear-gradient(
                              90deg,
                              transparent,
                              transparent 1px,
                              rgba(255, 255, 255, 0.03) 1px,
                              rgba(255, 255, 255, 0.03) 2px
                            )
                            `,
                            backgroundSize: '2px 2px',
                          }
                        : undefined
                    }
                  >
                    <div className="relative z-10 font-bold">{piece.title}</div>
                    <div className="relative z-10 mt-1 text-[10px] opacity-60">{piece.date}</div>
                    {isPinned && (
                      <span className="absolute right-2 top-2 text-[8px] font-semibold tracking-[0.2em] text-[color:var(--te-orange,#ff6600)]">
                        PIN
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-black pt-6">
            <div className="mb-3 text-[10px] tracking-wider text-muted-foreground">METADATA</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">DATE</span>
                <span className="font-bold">{selectedPiece.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">READ TIME</span>
                <span className="font-bold">{selectedPiece.readTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WORDS</span>
                <span className="font-bold">{selectedPiece.wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MOOD</span>
                <span className="text-[10px] font-bold uppercase">{selectedPiece.mood[0]}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto border-t border-black pt-6">
            <div className="mb-3 text-[10px] tracking-wider text-muted-foreground">SYSTEM INFO</div>
            <div className="space-y-1 text-[10px]">
              <div>PIECES: {pieces.length}</div>
              <div>LISTED: {sortedPieces.length}</div>
              <div>PINNED: {pinnedCount}</div>
              <div>VERSION: 1.0.0</div>
            </div>
          </div>
        </div>

        {/* Center - Main Piece */}
        <div className="overflow-y-auto p-12">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 text-[10px] tracking-wider text-muted-foreground">
              PIECE #{String(selectedPiece.id).padStart(3, '0')}
            </div>

            <h1 className="mb-4 text-4xl font-bold leading-tight">{selectedPiece.title}</h1>

            <div className="mb-8 text-sm italic text-muted-foreground">{selectedPiece.excerpt}</div>

            <Markdown content={selectedPiece.content} pieceId={selectedPiece.id} />

            <div className="mt-12 border-t border-black pt-6">
              <div className="text-[10px] tracking-wider text-muted-foreground">END OF TRANSMISSION</div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Mood Filter & Supporting Modules */}
        <div className="flex flex-col gap-6 overflow-y-auto border-l border-black p-6">
          <div>
            <div className="mb-3 text-[10px] tracking-wider text-muted-foreground">MOOD FILTER</div>
            <div className="space-y-1">
              {MOOD_FILTERS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`relative w-full overflow-hidden border py-2 px-2 text-left text-xs uppercase tracking-wide transition-all ${
                    selectedMood === mood ? 'border-black bg-black text-white' : 'border-transparent hover:border-black'
                  }`}
                  style={
                    selectedMood === mood
                      ? {
                          backgroundImage: `
                            repeating-linear-gradient(
                              45deg,
                              transparent,
                              transparent 2px,
                              rgba(255, 255, 255, 0.02) 2px,
                              rgba(255, 255, 255, 0.02) 4px
                            )
                          `,
                        }
                      : {}
                  }
                >
                  <span className="relative z-10">{mood}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-black pt-6">
            <div className="mb-3 text-[10px] tracking-wider text-muted-foreground">READING STATS</div>
            <div className="space-y-3">
              <div className="border border-black p-3">
                <div className="mb-1 text-[10px] text-muted-foreground">TOTAL WORDS</div>
                <div className="font-mono text-2xl font-bold">
                  {pieces.reduce((sum, piece) => sum + piece.wordCount, 0).toLocaleString()}
                </div>
              </div>
              <div className="border border-black p-3">
                <div className="mb-1 text-[10px] text-muted-foreground">AVG READ TIME</div>
                <div className="font-mono text-2xl font-bold">
                  {Math.round(
                    pieces.reduce((sum, piece) => sum + piece.readTimeMinutes, 0) / pieces.length,
                  )}{' '}
                  min
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-black pt-6">
            <div className="mb-3 text-[10px] tracking-wider text-muted-foreground">MOOD DISTRIBUTION</div>
            <div className="space-y-2">
              {(['contemplative', 'analytical', 'exploratory', 'critical'] as const).map((mood) => {
                const count = pieces.filter((piece) => piece.mood.includes(mood)).length
                const percentage = (count / pieces.length) * 100
                return (
                  <div key={mood} className="text-xs">
                    <div className="mb-1 flex justify-between">
                      <span className="uppercase">{mood}</span>
                      <span className="font-mono">{count}</span>
                    </div>
                    <div className="h-1 bg-black/10">
                      <div className="h-full bg-black transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-auto border-t border-black pt-6">
            <div className="mb-3 text-[10px] tracking-wider text-muted-foreground">ABOUT</div>
            <p className="text-xs leading-relaxed">
              A personal blog interface inspired by teenage.engineering&apos;s design philosophy: maximum function, minimum
              form. Every element serves a purpose.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex h-8 items-center justify-between border-t border-black px-4 text-[10px] tracking-wider">
        <div className="flex items-center gap-6">
          <span>MODE: READ</span>
          <span>FILTER: {selectedMood.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-6">
          <span>
            PIECE: {selectedPiece.id}/{pieces.length}
          </span>
          <span>READY</span>
        </div>
      </div>

      {isFinePointer && cursorVisible && (
        <CustomCursor
          position={cursorPos}
          moving={isCursorMoving}
          interactive={isCursorInteractive}
          speed={cursorSpeed}
        />
      )}

      {/* Chat Drawer */}
      <div
        className={cn(
          'pointer-events-none fixed bottom-0 left-0 right-0 flex justify-center transition-all duration-300 lg:left-[279px] lg:right-[279px]',
          isChatOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        style={{
          transform: isChatOpen ? 'translateY(0%)' : `translateY(calc(100% - ${STATUS_BAR_HEIGHT}px))`,
        }}
      >
        <div
          className={cn(
            'mx-auto flex w-full flex-col border-t border-black bg-black text-white shadow-[0_-8px_40px_rgba(0,0,0,0.25)] transition-all duration-300',
            isChatDetached ? 'h-[60vh]' : 'h-[260px]',
          )}
        >
          <div 
            className={cn(
              'flex items-center justify-between border-b border-white/10 px-4 text-[10px] tracking-[0.3em]',
              !isChatOpen && 'cursor-pointer hover:bg-white/5 transition-colors',
            )}
            style={{ height: `${STATUS_BAR_HEIGHT}px` }}
            onClick={() => !isChatOpen && setIsChatOpen(true)}
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold">CHAT</span>
              <span className="text-white/60">{isChatDetached ? 'SPLIT' : 'DRAWER'}</span>
              {showChatShortcutHint && (
                <span className="rounded border border-white/20 px-1 py-[1px] text-[8px] uppercase text-white/60">
                  `/` to open · `Esc` to close
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChatDetached((prev) => !prev)}
                className="rounded border border-white/20 px-2 py-[2px] text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
              >
                {isChatDetached ? 'ATTACH' : 'DETACH'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChatOpen(false)
                  setIsChatDetached(false)
                }}
                className="rounded border border-white/20 px-2 py-[2px] text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/40 hover:text-white"
              >
                CLOSE
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
            <label className="flex items-center gap-2">
              <span>Provider</span>
              <select
                value={chatProvider}
                onChange={(event) => setChatProvider(event.target.value as 'anthropic' | 'openai')}
                className="rounded border border-white/20 bg-black px-2 py-1 text-white/80 focus:border-white/40 focus:outline-none"
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
              </select>
            </label>
            <label className="flex flex-1 min-w-[220px] items-center gap-2">
              <span>API Key</span>
              <input
                type="password"
                value={chatApiKey}
                onChange={(event) => setChatApiKey(event.target.value)}
                placeholder="sk-..."
                className="flex-1 rounded border border-white/20 bg-black px-2 py-1 text-white/80 focus:border-white/40 focus:outline-none"
              />
            </label>
          </div>

          <div
            ref={chatContainerRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-xs leading-relaxed"
          >
            {chatMessages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <div
                  className={cn(
                    'w-20 shrink-0 text-[10px] uppercase tracking-[0.2em]',
                    CHAT_ROLE_CLASSNAME[message.role],
                  )}
                >
                  {CHAT_ROLE_LABEL[message.role]}
                </div>
                <div className={cn('flex-1 whitespace-pre-wrap', CHAT_CONTENT_CLASSNAME[message.role])}>
                  {renderChatMessageContent(message)}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex gap-3">
                <div className="w-20 shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/60">
                  AI
                </div>
                <div className="flex-1 text-white/60">
                  <span className="inline-block animate-pulse">█</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 px-4 py-3">
            <div className="rounded border border-white/20 bg-black/60 focus-within:border-white/40">
              <textarea
                ref={chatInputRef}
                rows={isChatDetached ? 3 : 2}
                className="h-full w-full resize-none bg-transparent px-3 py-2 text-xs text-white outline-none placeholder:text-white/30"
                placeholder=">_ Ask the system (Shift+Enter for newline)"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                disabled={isChatLoading}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault()
                    handleChatSubmit()
                    return
                  }

                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    handleChatSubmit()
                  }
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/40">
              <span>
                {isChatDetached
                  ? 'Esc to return drawer · Enter to submit · Shift+Enter for newline'
                  : 'Esc to close · Enter to submit · Shift+Enter for newline'}
              </span>
              <span>/help · /summarize · /connect</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
