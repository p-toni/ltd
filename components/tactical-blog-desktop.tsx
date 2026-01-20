'use client'

import type { ReactNode } from 'react'
import { memo, useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react'

import { useTacticalBlogContext } from '@/components/tactical-blog-provider'
import { ActivityTicker } from '@/components/activity-ticker'
import { Markdown } from '@/components/markdown'
import { LoopStatusBar } from '@/components/loop-indicators/LoopStatusBar'
import { ConceptGraph } from '@/components/concept-graph/ConceptGraph'

// Lazy load heavy components
const LoopDiagnostics = lazy(() => import('@/components/loop-indicators/LoopDiagnostics').then(m => ({ default: m.LoopDiagnostics })))
const FlowVisualization = lazy(() => import('@/components/loop-indicators/FlowVisualization').then(m => ({ default: m.FlowVisualization })))
const CitationNetworkGraph = lazy(() => import('@/components/concept-graph/CitationNetworkGraph').then(m => ({ default: m.CitationNetworkGraph })))
const MoodEnergyMatrix = lazy(() => import('@/components/hyperparams/MoodEnergyMatrix').then(m => ({ default: m.MoodEnergyMatrix })))
const ContextSwitchMonitor = lazy(() => import('@/components/hyperparams/ContextSwitchMonitor').then(m => ({ default: m.ContextSwitchMonitor })))
const TrainabilityWarning = lazy(() => import('@/components/hyperparams/TrainabilityWarning').then(m => ({ default: m.TrainabilityWarning })))
const CompoundingIndicators = lazy(() => import('@/components/hyperparams/CompoundingIndicators').then(m => ({ default: m.CompoundingIndicators })))
const ReentryFrequency = lazy(() => import('@/components/hyperparams/ReentryFrequency').then(m => ({ default: m.ReentryFrequency })))
const ExtractionMetrics = lazy(() => import('@/components/extraction/ExtractionMetrics').then(m => ({ default: m.ExtractionMetrics })))
const ExtractionSessionTimer = lazy(() => import('@/components/extraction/ExtractionSessionTimer').then(m => ({ default: m.ExtractionSessionTimer })))
const BoundedReader = lazy(() => import('@/components/extraction/BoundedReader').then(m => ({ default: m.BoundedReader })))
const PieceMap = lazy(() => import('@/components/pieces/PieceMap').then(m => ({ default: m.PieceMap })))
import {
  CHAT_CONTENT_CLASSNAME,
  CHAT_ROLE_CLASSNAME,
  CHAT_ROLE_LABEL,
  CITATION_REGEX,
  type ChatMessage,
  type MoodFilter,
} from '@/hooks/use-tactical-blog-experience'
import { cn } from '@/lib/utils'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

const NAV_VISIBLE_LIMIT = 5
const NAV_ITEM_HEIGHT = 48
const NAV_ITEM_GAP = 4
const STATUS_BAR_HEIGHT = 32
const MOOD_FILTERS: MoodFilter[] = ['all', 'contemplative', 'analytical', 'exploratory', 'critical']
const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], [data-cursor-interactive], input, textarea, select, summary, label'
const OFFSCREEN_CURSOR = { x: -100, y: -100 }
 
interface CustomCursorProps {
  position: { x: number; y: number }
  moving: boolean
  interactive: boolean
  speed: number
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

export function TacticalBlogDesktop() {
  const {
    pieces,
    currentTime,
    isChatOpen,
    setIsChatOpen,
    isChatDetached,
    setIsChatDetached,
    showChatShortcutHint,
    setShowChatShortcutHint,
    chatMessages,
    chatInput,
    setChatInput,
    isChatLoading,
    chatProvider,
    setChatProvider,
    chatApiKey,
    setChatApiKey,
    selectedMood,
    setSelectedMood,
    selectedPiece,
    selectedPieceId,
    setSelectedPieceId,
    sortedPieces,
    pinnedCount,
    handleChatSubmit,
    handleCitationClick,
    registerChatContainer,
    registerChatInput,
    focusChatInput,
  } = useTacticalBlogContext()

  const [cursorPos, setCursorPos] = useState(OFFSCREEN_CURSOR)
  const [cursorVisible, setCursorVisible] = useState(false)
  const [isFinePointer, setIsFinePointer] = useState(false)
  const [isCursorMoving, setIsCursorMoving] = useState(false)
  const [isCursorInteractive, setIsCursorInteractive] = useState(false)
  const [cursorSpeed, setCursorSpeed] = useState(0)
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('list')
  const [contentViewMode, setContentViewMode] = useState<'reading' | 'flow' | 'map' | 'citations'>('reading')
  const [readerMode, setReaderMode] = useState<'continuous' | 'fragment'>('continuous')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [checkpointsPassed, setCheckpointsPassed] = useState(0)
  const [totalCheckpoints, setTotalCheckpoints] = useState(0)

  const movementTimeoutRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const latestPointerRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastSampleRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const latestInteractiveRef = useRef(false)
  const cursorVisibleRef = useRef(false)
  const navListMaxHeight =
    NAV_VISIBLE_LIMIT * NAV_ITEM_HEIGHT + (NAV_VISIBLE_LIMIT - 1) * NAV_ITEM_GAP + NAV_ITEM_GAP * 2
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
    const openChat = () => {
      setIsChatOpen(true)
      setShowChatShortcutHint(false)
      requestAnimationFrame(() => focusChatInput())
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
            requestAnimationFrame(() => focusChatInput())
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
  }, [focusChatInput, isChatDetached, isChatOpen, setIsChatDetached, setIsChatOpen, setShowChatShortcutHint])

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


  const renderChatMessageContent = (message: ChatMessage) => {
    const nodes: ReactNode[] = []
    const text = message.content
    let lastIndex = 0
    const regex = new RegExp(CITATION_REGEX.source, 'g')
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
      <div className="flex h-7 items-center justify-between border-b border-black px-4 font-mono text-[9px] tracking-[0.1em]">
        <div className="flex items-center gap-6">
          <span className="font-semibold tracking-[0.2em]">TONI.LIMITED</span>
          <span className="text-muted-foreground">STATUS: ACTIVE</span>
        </div>

        {/* Center: Loop Status */}
        <div className="absolute left-1/2 -translate-x-1/2">
          {FEATURE_FLAGS.ENABLE_LOOP_TRACKING ? (
            <LoopStatusBar totalPieces={pieces.length} />
          ) : (
            <ActivityTicker />
          )}
        </div>

        <div className="flex items-center gap-6">
          <span className="text-muted-foreground">TIME: {currentTime}</span>
          <span className="tabular-nums text-muted-foreground">
            MODE: {contentViewMode === 'reading' ? readerMode.toUpperCase() : contentViewMode.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Grid - 3 Column Layout: Graph | Content | Dashboard */}
      <div className="relative grid h-[calc(100vh-1.75rem)] grid-cols-[400px_1fr_320px] gap-0">
        {/* Left Sidebar - Concept Graph (Hero Element) */}
        <div className="relative flex flex-col overflow-hidden border-r border-black bg-black">
          {FEATURE_FLAGS.ENABLE_CONCEPT_GRAPH && (
            <>
              {/* Full-height graph */}
              <div className="flex-1 overflow-hidden">
                <ConceptGraph
                  pieces={pieces}
                  activePieceId={selectedPieceId ?? undefined}
                  onPieceClick={setSelectedPieceId}
                  className="h-full w-full"
                />
              </div>

              {/* Bottom overlay with gradient fade - MapToPoster style */}
              <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                {/* Gradient fade */}
                <div
                  className="h-32 w-full"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0.8) 40%, transparent 100%)'
                  }}
                />

                {/* Piece navigation overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
                  {/* Compact horizontal piece selector */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {pieces.map((piece) => {
                      const isSelected = piece.id === selectedPieceId
                      const isPinned = piece.pinned

                      return (
                        <button
                          key={piece.id}
                          onClick={() => setSelectedPieceId(piece.id)}
                          className={cn(
                            'flex-shrink-0 rounded border px-2 py-1 transition-all duration-200',
                            isSelected
                              ? 'border-[var(--te-orange)] bg-[var(--te-orange)] text-black'
                              : 'border-white/30 bg-black/60 text-white hover:border-white hover:bg-black',
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[8px] font-semibold tabular-nums">
                              #{piece.id.toString().padStart(3, '0')}
                            </span>
                            {isPinned && (
                              <span className="font-mono text-[7px]">★</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Selected piece title */}
                  {selectedPiece && (
                    <div className="mt-2 text-center">
                      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                        {selectedPiece.title}
                      </div>
                      <div className="mt-0.5 font-mono text-[8px] text-white/60">
                        {selectedPiece.date} · {selectedPiece.readTime}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Center - Main Content */}
        <div className="flex flex-col overflow-hidden">
          {/* View Mode Toggle */}
          <div className="flex gap-2 border-b border-black px-4 py-2">
            {/* Reader Mode Toggle (reading view only) */}
            {contentViewMode === 'reading' && FEATURE_FLAGS.ENABLE_BOUNDED_READER && (
              <div className="flex gap-2 border-r border-black pr-3">
                {(['continuous', 'fragment'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setReaderMode(mode)}
                    className={cn(
                      'rounded border px-3 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors',
                      readerMode === mode
                        ? 'border-black bg-black text-white'
                        : 'border-transparent hover:border-black',
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}

            {/* Content View Modes */}
            {(['reading', 'flow', 'map', 'citations'] as const).map((mode) => {
              // Hide modes based on feature flags
              if (mode === 'flow' && !FEATURE_FLAGS.ENABLE_FLOW_VISUALIZATION) return null
              if (mode === 'map' && !FEATURE_FLAGS.ENABLE_PIECE_MAP) return null
              if (mode === 'citations' && !FEATURE_FLAGS.ENABLE_CITATION_NETWORK) return null

              return (
                <button
                  key={mode}
                  onClick={() => setContentViewMode(mode)}
                  className={cn(
                    'rounded border px-4 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
                    contentViewMode === mode
                      ? 'border-black bg-black text-white'
                      : 'border-transparent hover:border-black',
                  )}
                >
                  {mode}
                </button>
              )
            })}
          </div>

          {/* Content Area with smooth transitions */}
          <div className="relative flex-1 overflow-y-auto">
            {/* Flow Visualization */}
            {contentViewMode === 'flow' ? (
              <div className="animate-in fade-in duration-300">
                <Suspense fallback={<div className="flex h-full items-center justify-center font-mono text-[9px] text-muted-foreground">Loading...</div>}>
                  <FlowVisualization pieceId={selectedPiece.id} />
                </Suspense>
              </div>
            ) : /* Piece Map */
            contentViewMode === 'map' ? (
              <div className="animate-in fade-in duration-300">
                <Suspense fallback={<div className="flex h-full items-center justify-center font-mono text-[9px] text-muted-foreground">Loading...</div>}>
                  <PieceMap pieces={pieces} activePieceId={selectedPiece.id} onPieceClick={setSelectedPieceId} />
                </Suspense>
              </div>
            ) : /* Citation Network */
            contentViewMode === 'citations' ? (
              <div className="h-full p-8 animate-in fade-in duration-300">
                <Suspense fallback={<div className="flex h-full items-center justify-center font-mono text-[9px] text-muted-foreground">Loading...</div>}>
                  <CitationNetworkGraph pieces={pieces} activePieceId={selectedPiece.id} onPieceClick={setSelectedPieceId} className="h-full" />
                </Suspense>
              </div>
            ) : /* Reading Mode */
            (
              <div className="animate-in fade-in duration-300">
                {/* Fragment Reader or Continuous Reader */}
                {FEATURE_FLAGS.ENABLE_BOUNDED_READER && readerMode === 'fragment' ? (
                  <Suspense fallback={<div className="p-6"><div className="font-mono text-[9px] text-muted-foreground">Loading...</div></div>}>
                    <BoundedReader
                      content={selectedPiece.content}
                      pieceId={selectedPiece.id}
                      onFragmentChange={(current, total) => {
                        setCheckpointsPassed(current + 1)
                        setTotalCheckpoints(total)
                      }}
                    />
                  </Suspense>
                ) : (
                  <div className="p-6">
                    <div className="mx-auto max-w-2xl">
                      <div className="mb-2 font-mono text-[9px] tracking-wider text-muted-foreground">
                        PIECE #{String(selectedPiece.id).padStart(3, '0')}
                      </div>

                      <h1 className="mb-3 text-3xl font-bold leading-tight">{selectedPiece.title}</h1>

                      <div className="mb-6 text-sm italic text-muted-foreground">{selectedPiece.excerpt}</div>

                      <Markdown content={selectedPiece.content} pieceId={selectedPiece.id} />

                      <div className="mt-8 border-t border-black pt-4">
                        <div className="font-mono text-[9px] tracking-wider text-muted-foreground">END OF TRANSMISSION</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Hyperparameter Dashboard */}
        <div className="flex flex-col gap-3 overflow-y-auto border-l border-black p-3">
          <Suspense fallback={<div className="font-mono text-[9px] text-muted-foreground">Loading metrics...</div>}>
            {/* Extraction Metrics (Phase 2) - Current piece focus */}
            {FEATURE_FLAGS.ENABLE_EXTRACTION_METRICS && FEATURE_FLAGS.ENABLE_EPIPLEXITY_ESTIMATION && (
              <ExtractionMetrics
                piece={selectedPiece}
                scrollProgress={scrollProgress}
                checkpointsPassed={checkpointsPassed}
                totalCheckpoints={totalCheckpoints}
              />
            )}

            {/* Loop Diagnostics - System health */}
            {FEATURE_FLAGS.ENABLE_HYPERPARAM_DASHBOARD && FEATURE_FLAGS.ENABLE_LOOP_TRACKING && (
              <LoopDiagnostics totalPieces={pieces.length} />
            )}

            {/* Trainability Warning (Phase 2) - Critical alerts */}
            {FEATURE_FLAGS.ENABLE_TRAINABILITY_WARNING && (
              <TrainabilityWarning pieces={pieces} currentPieceId={selectedPiece?.id} />
            )}

            {/* Context Switch Monitor - Session tracking */}
            {FEATURE_FLAGS.ENABLE_HYPERPARAM_DASHBOARD && (
              <ContextSwitchMonitor currentPieceId={selectedPiece?.id} />
            )}

            {/* Mood-Energy Matrix - Navigation aid */}
            {FEATURE_FLAGS.ENABLE_HYPERPARAM_DASHBOARD && (
              <MoodEnergyMatrix pieces={pieces} onPieceClick={setSelectedPieceId} />
            )}

            {/* Re-entry Frequency (Phase 3) - Usage patterns */}
            {FEATURE_FLAGS.ENABLE_REENTRY_FREQUENCY && (
              <ReentryFrequency pieces={pieces} onPieceClick={setSelectedPieceId} />
            )}

            {/* Compounding Indicators (Phase 3) - Knowledge velocity */}
            {FEATURE_FLAGS.ENABLE_COMPOUNDING_INDICATORS && (
              <CompoundingIndicators pieces={pieces} onPieceClick={setSelectedPieceId} />
            )}
          </Suspense>
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
          transform: isChatOpen ? 'translateY(0%)' : 'translateY(100%)',
        }}
      >
        <div
          className={cn(
            'mx-auto flex w-full flex-col border-t border-black bg-black text-white shadow-[0_-8px_40px_rgba(0,0,0,0.25)] transition-all duration-300',
            isChatDetached ? 'h-[60vh]' : 'h-[260px]',
          )}
        >
          <div
            className="flex items-center justify-between border-b border-white/10 px-4 text-[10px] tracking-[0.3em]"
            style={{ height: `${STATUS_BAR_HEIGHT}px` }}
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
            ref={registerChatContainer}
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
                ref={registerChatInput}
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
