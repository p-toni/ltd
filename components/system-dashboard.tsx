'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import Image from 'next/image'
import type { Piece } from '@/lib/pieces'
import { Markdown } from '@/components/markdown'
import { ActivityTicker } from '@/components/activity-ticker'
import PiecePoster from '@/components/piece-poster'
import { LocalGeometryScene } from '@/components/local-geometry-scene'
import { cn } from '@/lib/utils'
import { X } from '@phosphor-icons/react'

type MoodFilter = 'all' | 'contemplative' | 'analytical' | 'exploratory' | 'critical'

interface SystemDashboardProps {
  pieces: Piece[]
  contextById?: Record<number, number>
  initialPieceId?: number | null
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export default function SystemDashboard({ pieces, contextById = {}, initialPieceId }: SystemDashboardProps) {
  const [selectedEngine, setSelectedEngine] = useState<'discover' | 'focus'>('discover')
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(() => {
    if (typeof initialPieceId === 'number') {
      return pieces.find((piece) => piece.id === initialPieceId) ?? pieces[0] ?? null
    }

    return pieces[0] ?? null
  })
  const [moodFilter, setMoodFilter] = useState<MoodFilter>('all')
  const [showExcerpts, setShowExcerpts] = useState(true)
  const [compactView, setCompactView] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [isLightMode, setIsLightMode] = useState(true)
  const panelBorder = isLightMode ? 'rgba(28, 19, 13, 0.12)' : 'rgba(255, 255, 255, 0.1)'
  const panelOutline = isLightMode ? 'rgba(28, 19, 13, 0.08)' : 'rgba(255, 255, 255, 0.08)'
  const panelDot = isLightMode ? 'rgba(28, 19, 13, 0.08)' : '#1a1a1a'

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', !isLightMode)
    root.style.colorScheme = isLightMode ? 'light' : 'dark'
    return () => {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    }
  }, [isLightMode])

  const filteredPieces = useMemo(() => (
    moodFilter === 'all'
      ? pieces
      : pieces.filter(piece => piece.mood.includes(moodFilter))
  ), [pieces, moodFilter])

  useEffect(() => {
    if (!selectedPiece) return

    const stillVisible = filteredPieces.some((piece) => piece.id === selectedPiece.id)
    if (!stillVisible) {
      setSelectedPiece(filteredPieces[0] ?? null)
    }
  }, [filteredPieces, selectedPiece])

  const handlePanelClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (selectedEngine === 'focus') {
      setSelectedEngine('discover')
    }
  }

  const boundedMetrics = useMemo(() => {
    if (!selectedPiece) {
      return {
        esi: 0,
        timeLoad: 0,
        energyLoad: 0,
        contextLoad: 0,
        daysSince: 0,
        recencyScore: 0,
      }
    }

    const daysSince = Math.max(0, (Date.now() - selectedPiece.publishedAt) / (1000 * 60 * 60 * 24))
    const timeLoad = clamp(selectedPiece.readTimeMinutes / 10, 0, 1)
    const energyLoad = clamp(selectedPiece.wordCount / 1800, 0, 1)
    const embeddedContext = contextById[selectedPiece.id]
    const contextLoad = typeof embeddedContext === 'number'
      ? clamp(embeddedContext, 0, 1)
      : clamp(selectedPiece.mood.length / 3, 0, 1)
    const recencyScore = clamp(1 - daysSince / 120, 0, 1)
    const pinnedScore = selectedPiece.pinned ? 0.1 : 0
    const timeEase = 1 - timeLoad
    const energyEase = 1 - energyLoad
    const contextEase = 1 - contextLoad
    const esi = Math.round(
      (timeEase * 0.35 + energyEase * 0.25 + contextEase * 0.15 + recencyScore * 0.15 + pinnedScore) * 100
    )

    return {
      esi,
      timeLoad,
      energyLoad,
      contextLoad,
      daysSince,
      recencyScore,
    }
  }, [selectedPiece, contextById])

  const moodCounts = useMemo(() => {
    const counts = {
      all: pieces.length,
      contemplative: 0,
      analytical: 0,
      exploratory: 0,
      critical: 0,
    }

    pieces.forEach((piece) => {
      piece.mood.forEach((mood) => {
        counts[mood] += 1
      })
    })

    const maxCount = Math.max(1, counts.all, counts.contemplative, counts.analytical, counts.exploratory, counts.critical)

    return { counts, maxCount }
  }, [pieces])

  const geometryNeighbors = useMemo(() => {
    if (!selectedPiece) return []

    return filteredPieces
      .filter((piece) => piece.id !== selectedPiece.id)
      .map((piece) => {
        const sharedMood = piece.mood.filter((m) => selectedPiece.mood.includes(m)).length
        const moodScore = selectedPiece.mood.length ? sharedMood / selectedPiece.mood.length : 0
        const wordScore = 1 - clamp(Math.abs(piece.wordCount - selectedPiece.wordCount) / 1500, 0, 1)
        const recencyScore = 1 - clamp(Math.abs(piece.publishedAt - selectedPiece.publishedAt) / (1000 * 60 * 60 * 24 * 180), 0, 1)
        const score = moodScore * 0.45 + wordScore * 0.35 + recencyScore * 0.2

        return { piece, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }, [filteredPieces, selectedPiece])

  const loopStages = useMemo(() => {
    if (!selectedPiece) {
      return [
        { label: 'INSIGHT', status: 'idle' },
        { label: 'DECISION', status: 'idle' },
        { label: 'ACTION', status: 'idle' },
        { label: 'FEEDBACK', status: 'idle' },
      ]
    }

    const hasDecision = selectedPiece.wordCount >= 600 || selectedPiece.mood.includes('analytical')
    const hasAction = selectedPiece.mood.includes('critical') || selectedPiece.mood.includes('exploratory')
    const hasFeedback = selectedPiece.pinned || boundedMetrics.recencyScore > 0.6

    return [
      { label: 'INSIGHT', status: 'complete' },
      { label: 'DECISION', status: hasDecision ? 'complete' : 'partial' },
      { label: 'ACTION', status: hasAction ? 'partial' : 'pending' },
      { label: 'FEEDBACK', status: hasFeedback ? 'partial' : 'pending' },
    ]
  }, [selectedPiece, boundedMetrics.recencyScore])

  return (
    <div
      className={cn(
        'min-h-screen bg-background-light dark:bg-background-dark text-[#1c130d] dark:text-white selection:bg-primary selection:text-white relative overflow-x-hidden custom-scrollbar',
        isLightMode ? 'dashboard-light' : 'dark',
      )}
    >
      {/* Scanline Overlay */}
      <div className="scanline-overlay" />
      
      <div className="flex h-screen max-h-screen flex-col relative z-10">
        {/* Top Navigation Bar */}
        <header className="flex flex-wrap sm:flex-nowrap items-center justify-between px-5 py-3 bg-background-dark shadow-lg" style={{ outline: `1px solid ${panelBorder}` }}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="size-6">
                <Image
                  src={isLightMode ? '/images/toni-ltd-logo-light.svg' : '/images/toni-ltd-logo.svg'}
                  alt="Toni Ltd logo"
                  width={24}
                  height={24}
                  className="size-6"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <h2 className="text-white text-xs font-black leading-none tracking-tighter">TONI.LIMITED</h2>
                <span className="text-[9px] text-primary/80 font-mono">OP_MODE: ACTIVE</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-border-dark"></div>
          </div>
            <div className="flex items-center gap-4">
            <div className="flex flex-col items-end px-3 border-r" style={{ borderColor: panelBorder }}>
              <span className="text-[9px] text-[#666]">BLOG_LOAD</span>
              <span className="text-[11px] font-bold text-primary">{pieces.length} PIECES</span>
            </div>
            <ActivityTicker className="max-w-xs" />
            <div className="flex gap-2">
              <div className="flex h-10 items-center justify-center px-4" role="timer" aria-live="polite" aria-label="Current time">
                <span className="text-white text-[11px] font-mono tabular-nums">{currentTime}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightMode((prev) => !prev)}
                className="flex h-10 items-center gap-2 px-3 bg-panel-dark border border-border-dark text-[9px] font-bold tracking-[0.2em] transition-colors"
                aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
                aria-pressed={isLightMode}
              >
                <span className="text-[#666]">MODE</span>
                <span className="text-white">{isLightMode ? 'LIGHT' : 'DARK'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 grid grid-cols-12 gap-px bg-border-dark min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* BLOCK A: CORE */}
          <section className={cn(
            "col-span-12 lg:col-span-3 bg-background-dark p-4 flex flex-col gap-4 overflow-hidden transition-all duration-500 cursor-pointer relative shadow-lg",
            selectedEngine === 'focus' && "opacity-40",
          )} style={{
            backgroundImage: `radial-gradient(circle, ${panelDot} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            ...(selectedEngine === 'focus' && {
              backdropFilter: 'blur(12px) saturate(0.8)',
              WebkitBackdropFilter: 'blur(12px) saturate(0.8)',
            })
          }}
          onClick={handlePanelClick}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white text-sm font-black tracking-tighter flex items-center gap-2">
                <span className="w-1 h-4 bg-primary"></span>
                CORE
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#666]">LTD</span>
                <div className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)] animate-pulse"></div>
              </div>
            </div>
            {/* Engine Toggle */}
            <div className="p-1 bg-panel-dark rounded-sm flex h-10 shadow-md shrink-0" style={{ outline: `1px solid ${panelOutline}` }}>
              <label className="flex-1 flex items-center justify-center cursor-pointer group">
                <input
                  checked={selectedEngine === 'discover'}
                  onChange={() => setSelectedEngine('discover')}
                  className="hidden peer"
                  name="engine"
                  type="radio"
                />
                <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#666] peer-checked:bg-white peer-checked:text-black transition-all">
                  DISCOVER
                </span>
              </label>
              <label className="flex-1 flex items-center justify-center cursor-pointer group">
                <input
                  checked={selectedEngine === 'focus'}
                  onChange={() => setSelectedEngine('focus')}
                  className="hidden peer"
                  name="engine"
                  type="radio"
                />
                <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#666] peer-checked:bg-white peer-checked:text-black transition-all">
                  FOCUS
                </span>
              </label>
            </div>

            {/* Article List - scrollable middle section */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
              <div className={cn("space-y-2", compactView && "space-y-1")}>
                {filteredPieces.slice(0, 5).map((piece) => (
                  <div
                    key={piece.id}
                    onClick={() => setSelectedPiece(piece)}
                    className={cn(
                      "bg-panel-dark rounded-sm cursor-pointer transition-all hover:border-primary shadow-md",
                      compactView ? "p-2" : "p-3",
                      selectedPiece?.id === piece.id && "border-primary bg-primary/10"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h4 className={cn("text-white font-bold mb-1", compactView ? "text-[10px]" : "text-[11px]")}>{piece.title}</h4>
                        <p className={cn("text-[#666] font-mono", compactView ? "text-[7px]" : "text-[8px]")}>{piece.date} • {piece.readTime}</p>
                        {showExcerpts && (
                          <p
                            className={cn(
                              "text-[#777] font-mono leading-snug overflow-hidden",
                              compactView ? "text-[7px] max-h-4" : "text-[8px] max-h-8"
                            )}
                          >
                            {piece.excerpt}
                          </p>
                        )}
                      </div>
                      {piece.pinned && (
                        <span className={cn("font-semibold tracking-[0.2em] text-primary", compactView ? "text-[6px]" : "text-[7px]")}>
                          PIN
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Piece Data Poster - fixed at bottom */}
            <div className="shrink-0">
              <PiecePoster pieces={filteredPieces} selectedPiece={selectedPiece} theme={isLightMode ? 'paper' : 'data_visual'} />
            </div>
          </section>

          {/* BLOCK B: ARTICLE_DISPLAY */}
          <section className="col-span-12 lg:col-span-6 bg-background-dark p-4 flex flex-col gap-4 overflow-hidden shadow-lg border-r" style={{ 
            backgroundImage: `radial-gradient(circle, ${panelDot} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            borderColor: panelBorder,
          }}>
            {selectedPiece ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-sm font-black tracking-tighter flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary"></span>
                    {selectedPiece.title}
                  </h3>
                  <button 
                    onClick={() => setSelectedPiece(null)}
                    className="text-[#666] hover:text-white transition-colors"
                    aria-label="Close article view"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>
                
                <div className="flex items-center gap-4 text-[9px] text-[#666] font-mono pb-3 border-b" style={{ borderColor: panelBorder }}>
                  <span>{selectedPiece.date}</span>
                  <span>•</span>
                  <span>{selectedPiece.readTime}</span>
                  <span>•</span>
                  <span>{selectedPiece.wordCount} words</span>
                  <span>•</span>
                  <div className="flex gap-1">
                    {selectedPiece.mood.map((m) => (
                      <span key={m} className="text-primary font-bold">{m.toUpperCase()}</span>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  <div className="max-w-none px-3">
                    <Markdown content={selectedPiece.content} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="material-symbols-outlined text-6xl text-[#666] mb-4">article</span>
                <h3 className="text-white text-lg font-black tracking-tighter mb-2">NO_ARTICLE_SELECTED</h3>
                <p className="text-[#666] text-sm font-mono">SELECT_AN_ARTICLE_FROM_THE_LEFT_PANEL_TO_BEGIN_READING</p>
              </div>
            )}
          </section>

          {/* BLOCK C: BLOG_FILTERS */}
          <section className={cn(
            "col-span-12 lg:col-span-3 bg-background-dark p-4 flex flex-col gap-4 overflow-hidden transition-all duration-500 cursor-pointer relative",
            selectedEngine === 'focus' && "opacity-40",
          )} style={{
            backgroundImage: `radial-gradient(circle, ${panelDot} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            ...(selectedEngine === 'focus' && {
              backdropFilter: 'blur(12px) saturate(0.8)',
              WebkitBackdropFilter: 'blur(12px) saturate(0.8)',
            })
          }}
          onClick={handlePanelClick}
          >
            <h3 className="text-white text-sm font-black tracking-tighter flex items-center gap-2">
              <span className="w-1 h-4 bg-primary"></span>
              BOUNDARY
            </h3>
            <div className="flex flex-col gap-4 py-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-[#666]">EXTRACTABLE_STRUCTURE</span>
                    <span className="text-xs font-black text-white font-mono">
                      {selectedPiece ? String(boundedMetrics.esi).padStart(2, '0') : '00'}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-primary">
                    {selectedPiece ? `${Math.round(boundedMetrics.recencyScore * 100)}% REENTRY` : 'NO SIGNAL'}
                  </span>
                </div>
                <div className="w-full h-1 bg-panel-dark">
                  <div className="h-full bg-primary" style={{ width: `${boundedMetrics.esi}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="bg-panel-dark p-2 border-l-2 border-primary">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-[#666]">TIME</span>
                      <span className="text-[8px] font-bold text-white">{selectedPiece ? selectedPiece.readTime : '0 min'}</span>
                    </div>
                    <div className="mt-2 h-1 bg-border-dark">
                      <div className="h-full bg-primary" style={{ width: `${Math.round(boundedMetrics.timeLoad * 100)}%` }} />
                    </div>
                  </div>
                  <div className="bg-panel-dark p-2 border-l-2 border-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-[#666]">ENERGY</span>
                      <span className="text-[8px] font-bold text-white">{selectedPiece ? selectedPiece.wordCount.toLocaleString() : '0'}</span>
                    </div>
                    <div className="mt-2 h-1 bg-border-dark">
                      <div className="h-full bg-white" style={{ width: `${Math.round(boundedMetrics.energyLoad * 100)}%` }} />
                    </div>
                  </div>
                  <div className="bg-panel-dark p-2 border-l-2 border-accent">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-[#666]">CONTEXT</span>
                      <span className="text-[8px] font-bold text-white">{selectedPiece ? `${Math.round(boundedMetrics.contextLoad * 100)}%` : '0%'}</span>
                    </div>
                    <div className="mt-2 h-1 bg-border-dark">
                      <div className="h-full bg-accent" style={{ width: `${Math.round(boundedMetrics.contextLoad * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3" style={{ borderColor: panelBorder }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white">LOOP_INTEGRITY</span>
                  <span className="text-[9px] font-mono text-primary">
                    {selectedPiece ? (boundedMetrics.esi >= 60 ? 'CONVERGENT' : 'SENSITIVE') : 'IDLE'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {loopStages.map((stage) => {
                    const indicatorClass = stage.status === 'complete'
                      ? 'bg-primary shadow-[0_0_6px_var(--color-primary)]'
                      : stage.status === 'partial'
                        ? 'bg-white/70'
                        : stage.status === 'pending'
                          ? 'bg-[#444]'
                          : 'bg-[#333]'

                    return (
                      <div key={stage.label} className="flex flex-col gap-1 bg-panel-dark p-2 border-l-2 border-border-dark">
                        <span className={`size-2 rounded-full ${indicatorClass}`} />
                        <span className="text-[7px] text-[#666]">{stage.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 border-t pt-3" style={{ borderColor: panelBorder }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white">LOCAL_GEOMETRY</span>
                  <span className="text-[8px] text-[#666]">3D_FIELD</span>
                </div>
                {selectedPiece ? (
                  <div className="space-y-2">
                    <div className="bg-panel-dark border border-border-dark rounded-sm p-2">
                      <LocalGeometryScene
                        neighbors={geometryNeighbors.map(({ piece, score }) => ({
                          id: piece.id,
                          title: piece.title,
                          score,
                        }))}
                        originTitle={selectedPiece.title}
                        variant={isLightMode ? 'light' : 'dark'}
                      />
                    </div>
                    {geometryNeighbors.length ? (
                      <div className="grid grid-cols-3 gap-1">
                        {geometryNeighbors.map(({ piece, score }) => (
                          <div key={piece.id} className="bg-panel-dark px-2 py-1 border-l-2 border-border-dark">
                            <div className="text-[7px] text-[#666]">NEAR</div>
                            <div className="text-[8px] font-bold text-white truncate">{piece.title}</div>
                            <div className="text-[7px] font-mono text-primary">{Math.round(score * 100)}%</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[8px] text-[#666]">NO_ADJACENT_NODES</div>
                    )}
                  </div>
                ) : (
                  <div className="text-[8px] text-[#666]">SELECT_A_PIECE_TO_MAP_GEOMETRY</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 border-t pt-3" style={{ borderColor: panelBorder }}>
                <div className="flex items-center justify-between px-2 py-2 bg-panel-dark shadow-md" style={{ outline: `1px solid ${panelOutline}` }}>
                  <span className="text-[9px] font-bold text-white">EXCERPTS</span>
                  <button
                    onClick={() => setShowExcerpts(!showExcerpts)}
                    className={`w-10 h-5 ${showExcerpts ? 'bg-primary' : 'bg-border-dark'} rounded-sm relative flex items-center px-1 transition-colors`}
                    aria-label={showExcerpts ? 'Hide excerpts' : 'Show excerpts'}
                    aria-pressed={showExcerpts}
                  >
                    <div className={`size-3 ${showExcerpts ? 'bg-black translate-x-5' : 'bg-white translate-x-0'} rounded-sm transition-all`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between px-2 py-2 bg-panel-dark shadow-md" style={{ outline: `1px solid ${panelOutline}` }}>
                  <span className="text-[9px] font-bold text-white">COMPACT</span>
                  <button
                    onClick={() => setCompactView(!compactView)}
                    className={`w-10 h-5 ${compactView ? 'bg-primary' : 'bg-border-dark'} rounded-sm relative flex items-center px-1 transition-colors`}
                    aria-label={compactView ? 'Disable compact view' : 'Enable compact view'}
                    aria-pressed={compactView}
                  >
                    <div className={`size-3 ${compactView ? 'bg-black translate-x-5' : 'bg-white translate-x-0'} rounded-sm transition-all`}></div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white">MOOD_FILTER</span>
                  <span className="text-[8px] text-[#666]">{filteredPieces.length}/{pieces.length} ACTIVE</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMoodFilter('all')}
                    className={cn(
                      "col-span-2 rounded-sm border border-border-dark bg-panel-dark px-3 py-2 text-left transition-colors",
                      moodFilter === 'all' ? 'border-primary text-white' : 'text-[#666] hover:text-white'
                    )}
                    aria-label="Show all articles"
                    aria-pressed={moodFilter === 'all'}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold">ALL</span>
                      <span className="text-[9px] font-mono">{moodCounts.counts.all}</span>
                    </div>
                    <div className="mt-2 h-1 bg-border-dark">
                      <div className="h-full bg-primary" style={{ width: '100%' }} />
                    </div>
                  </button>
                  {([
                    { id: 'contemplative', label: 'CALM' },
                    { id: 'analytical', label: 'LOGIC' },
                    { id: 'exploratory', label: 'QUEST' },
                    { id: 'critical', label: 'THINK' },
                  ] as const).map(({ id, label }) => {
                    const count = moodCounts.counts[id]
                    const width = Math.round((count / moodCounts.maxCount) * 100)
                    return (
                      <button
                        key={id}
                        onClick={() => setMoodFilter(id)}
                        className={cn(
                          "rounded-sm border border-border-dark bg-panel-dark px-3 py-2 text-left transition-colors",
                          moodFilter === id ? 'border-primary text-white' : 'text-[#666] hover:text-white'
                        )}
                        aria-label={`Show ${label.toLowerCase()} articles`}
                        aria-pressed={moodFilter === id}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold">{label}</span>
                          <span className="text-[9px] font-mono">{count}</span>
                        </div>
                        <div className="mt-2 h-1 bg-border-dark">
                          <div
                            className={cn("h-full", moodFilter === id ? 'bg-primary' : 'bg-white/60')}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

        </main>

        {/* Quick Access Dock */}
        <footer className="bg-background-dark h-8 flex items-center justify-center border-t border-black select-none shrink-0">
          <div className="flex items-center gap-8">
            <div className="group relative">
              <svg 
                viewBox="10 40 45 50"
                className="w-[24px] h-[24px] text-[#CA3F16] opacity-50 group-hover:opacity-100 transition-opacity duration-300"
              >
                <rect x="20" y="50" width="4" height="10" fill="currentColor">
                  <animateTransform 
                    attributeName="transform" 
                    type="translate" 
                    values="0 0; 0 10; 0 0" 
                    begin="0" 
                    dur="2s" 
                    repeatCount="indefinite"
                  />
                </rect>
                <rect x="30" y="50" width="4" height="10" fill="currentColor">
                  <animateTransform 
                    attributeName="transform" 
                    type="translate" 
                    values="0 0; 0 10; 0 0" 
                    begin="0.4s" 
                    dur="2s" 
                    repeatCount="indefinite"
                  />
                </rect>
                <rect x="40" y="50" width="4" height="10" fill="currentColor">
                  <animateTransform 
                    attributeName="transform" 
                    type="translate" 
                    values="0 0; 0 10; 0 0" 
                    begin="0.8s" 
                    dur="2s" 
                    repeatCount="indefinite"
                  />
                </rect>
              </svg>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
