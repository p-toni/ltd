'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Markdown } from '@/components/markdown'
import type { Essay } from '@/lib/essays'

type MoodFilter = Essay['mood'][number] | 'all'

const MAX_VISIBLE_ESSAYS = 5
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

interface TacticalBlogProps {
  essays: Essay[]
}

export default function TacticalBlog({ essays }: TacticalBlogProps) {
  const [currentTime, setCurrentTime] = useState('')
  const [cursorPos, setCursorPos] = useState(OFFSCREEN_CURSOR)
  const [cursorVisible, setCursorVisible] = useState(false)
  const [selectedMood, setSelectedMood] = useState<MoodFilter>('all')
  const [selectedEssayId, setSelectedEssayId] = useState<number | null>(() => essays[0]?.id ?? null)
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
    if (essays.length === 0) {
      setSelectedEssayId(null)
      return
    }

    if (!essays.some((essay) => essay.id === selectedEssayId)) {
      setSelectedEssayId(essays[0].id)
    }
  }, [essays, selectedEssayId])

  const filteredEssays = useMemo(() => {
    if (selectedMood === 'all') {
      return essays
    }

    return essays.filter((essay) => essay.mood.includes(selectedMood))
  }, [essays, selectedMood])

  const visibleEssays = useMemo(() => filteredEssays.slice(0, MAX_VISIBLE_ESSAYS), [filteredEssays])

  const selectedEssayFromState =
    selectedEssayId !== null ? essays.find((essay) => essay.id === selectedEssayId) ?? null : null

  const fallbackEssay =
    visibleEssays.length > 0 ? essays.find((essay) => essay.id === visibleEssays[0].id) ?? null : null

  const selectedEssay =
    selectedEssayFromState && visibleEssays.some((essay) => essay.id === selectedEssayFromState.id)
      ? selectedEssayFromState
      : fallbackEssay

  useEffect(() => {
    if (!visibleEssays.length) {
      setSelectedEssayId(null)
      return
    }

    if (!visibleEssays.some((essay) => essay.id === selectedEssayId)) {
      setSelectedEssayId(visibleEssays[0].id)
    }
  }, [visibleEssays, selectedEssayId])

  if (!essays.length || !selectedEssay) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white font-mono text-black">
        <span className="text-xs tracking-[0.4em] uppercase">No essays available</span>
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
            <div className="mb-4 text-sm font-bold">ESSAYS</div>
            <div className="space-y-1">
              {visibleEssays.map((essay) => (
                <button
                  key={essay.id}
                  onClick={() => setSelectedEssayId(essay.id)}
                  className={`relative w-full overflow-hidden border py-2 px-2 text-left text-xs transition-all ${
                    selectedEssay.id === essay.id
                      ? 'border-black bg-black text-white'
                      : 'border-transparent hover:border-black'
                  }`}
                  style={
                    selectedEssay.id === essay.id
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
                      : {}
                  }
                >
                  <div className="relative z-10 font-bold">{essay.title}</div>
                  <div className="relative z-10 mt-1 text-[10px] opacity-60">{essay.date}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-black pt-6">
            <div className="mb-3 text-[10px] tracking-wider text-muted-foreground">METADATA</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">DATE</span>
                <span className="font-bold">{selectedEssay.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">READ TIME</span>
                <span className="font-bold">{selectedEssay.readTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WORDS</span>
                <span className="font-bold">{selectedEssay.wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MOOD</span>
                <span className="text-[10px] font-bold uppercase">{selectedEssay.mood[0]}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto border-t border-black pt-6">
            <div className="mb-3 text-[10px] tracking-wider text-muted-foreground">SYSTEM INFO</div>
            <div className="space-y-1 text-[10px]">
              <div>ESSAYS: {essays.length}</div>
              <div>VISIBLE: {visibleEssays.length}</div>
              <div>VERSION: 1.0.0</div>
            </div>
          </div>
        </div>

        {/* Center - Main Essay */}
        <div className="overflow-y-auto p-12">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 text-[10px] tracking-wider text-muted-foreground">
              ESSAY #{String(selectedEssay.id).padStart(3, '0')}
            </div>

            <h1 className="mb-4 text-4xl font-bold leading-tight">{selectedEssay.title}</h1>

            <div className="mb-8 text-sm italic text-muted-foreground">{selectedEssay.excerpt}</div>

            <Markdown content={selectedEssay.content} />

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
                  {essays.reduce((sum, essay) => sum + essay.wordCount, 0).toLocaleString()}
                </div>
              </div>
              <div className="border border-black p-3">
                <div className="mb-1 text-[10px] text-muted-foreground">AVG READ TIME</div>
                <div className="font-mono text-2xl font-bold">
                  {Math.round(
                    essays.reduce((sum, essay) => sum + Number.parseInt(essay.readTime, 10), 0) / essays.length,
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
                const count = essays.filter((essay) => essay.mood.includes(mood)).length
                const percentage = (count / essays.length) * 100
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
            ESSAY: {selectedEssay.id}/{essays.length}
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
    </div>
  )
}
