'use client'

import { useMemo } from 'react'
import { useTacticalBlogContext } from '@/components/tactical-blog-provider'
import { cn } from '@/lib/utils'
import type { MoodFilter } from '@/hooks/use-tactical-blog-experience'

const MOOD_OPTIONS: { id: MoodFilter; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'contemplative', label: 'CONTEMPLATIVE' },
  { id: 'analytical', label: 'ANALYTICAL' },
  { id: 'exploratory', label: 'EXPLORATORY' },
  { id: 'critical', label: 'CRITICAL' },
]

export function Sidebar() {
  const {
    sortedPieces,
    selectedPieceId,
    setSelectedPieceId,
    selectedMood,
    setSelectedMood,
    themeMode,
    setThemeMode,
  } = useTacticalBlogContext()

  const isLight = themeMode === 'light'

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sortedPieces.length }
    for (const piece of sortedPieces) {
      for (const mood of piece.mood) {
        counts[mood] = (counts[mood] ?? 0) + 1
      }
    }
    return counts
  }, [sortedPieces])

  return (
    <aside className="flex flex-col h-full w-[240px] border-r border-border bg-bg overflow-hidden">
      {/* Site mark */}
      <div className="px-[24px] pt-6 pb-2">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-text font-bold">
          TONI.LTD
        </span>
        <div className="mt-2 h-px w-8 bg-accent" />
      </div>

      {/* Piece list */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 mt-2">
        <div className="flex flex-col gap-px">
          {sortedPieces.map((piece, index) => {
            const isActive = piece.id === selectedPieceId
            return (
              <button
                key={piece.id}
                type="button"
                onClick={() => setSelectedPieceId(piece.id)}
                className={cn(
                  'sidebar-item text-left px-3 py-[8px] text-sm leading-[20px] font-sans border-l-[3px]',
                  isActive
                    ? 'border-accent text-text bg-accent-muted'
                    : 'border-transparent text-text-secondary hover:text-text hover:bg-surface/50',
                )}
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] text-text-tertiary/40 tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate">{piece.title}</span>
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mood filters */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex flex-wrap gap-x-3 gap-y-[4px]">
          {MOOD_OPTIONS.map(({ id, label }) => {
            const isActive = selectedMood === id
            const count = moodCounts[id] ?? 0
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedMood(id)}
                className={cn(
                  'font-mono text-[12px] leading-[16px] uppercase tracking-[0.04em] pb-0.5 transition-colors duration-150',
                  isActive
                    ? 'text-accent border-b border-accent'
                    : 'text-text-tertiary hover:text-text-secondary',
                )}
              >
                {label}
                <span className="ml-1 text-text-tertiary">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Theme toggle */}
      <div className="px-4 py-3 border-t border-border">
        <button
          type="button"
          onClick={() => setThemeMode(isLight ? 'dark' : 'light')}
          className="group flex items-center gap-2 font-mono text-[12px] leading-[16px] uppercase tracking-[0.04em] text-text-secondary hover:text-text transition-colors duration-150"
        >
          <span className="inline-block transition-transform duration-200 group-hover:scale-110">
            {isLight ? '☀' : '☾'}
          </span>
          <span>{isLight ? 'LIGHT' : 'DARK'}</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="font-serif italic text-[14px] leading-[20px] text-text-secondary">
          stabilizing the<br />human-AI loop
        </div>
        <div className="mt-2 font-mono text-[10px] leading-[16px] text-text-tertiary tracking-[0.08em] uppercase">
          by Toni Pereira
        </div>
      </div>
    </aside>
  )
}
