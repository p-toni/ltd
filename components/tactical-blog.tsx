'use client'

import { useEffect, useMemo, useState } from 'react'

import { Markdown } from '@/components/markdown'
import type { Essay } from '@/lib/essays'

type MoodFilter = Essay['mood'][number] | 'all'

const MAX_VISIBLE_ESSAYS = 5
const MOOD_FILTERS: MoodFilter[] = ['all', 'contemplative', 'analytical', 'exploratory', 'critical']

interface TacticalBlogProps {
  essays: Essay[]
}

export default function TacticalBlog({ essays }: TacticalBlogProps) {
  const [currentTime, setCurrentTime] = useState('')
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [selectedMood, setSelectedMood] = useState<MoodFilter>('all')
  const [selectedEssayId, setSelectedEssayId] = useState<number | null>(() => essays[0]?.id ?? null)

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
    const handleMouseMove = (event: MouseEvent) => {
      setCursorPos({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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
    <div className="h-screen w-screen overflow-hidden bg-white font-mono text-black">
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
    </div>
  )
}
