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
      <div className="px-5 pt-6 pb-4">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-text font-bold">
          TONI.LTD
        </span>
      </div>

      {/* Piece list */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2">
        <div className="flex flex-col">
          {sortedPieces.map((piece) => {
            const isActive = piece.id === selectedPieceId
            return (
              <button
                key={piece.id}
                type="button"
                onClick={() => setSelectedPieceId(piece.id)}
                className={cn(
                  'text-left px-3 py-2.5 text-sm font-sans transition-none border-l-[3px]',
                  isActive
                    ? 'border-accent text-text bg-accent-muted'
                    : 'border-transparent text-text-secondary hover:text-accent',
                )}
              >
                {piece.title}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mood filters */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {MOOD_OPTIONS.map(({ id, label }) => {
            const isActive = selectedMood === id
            const count = moodCounts[id] ?? 0
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedMood(id)}
                className={cn(
                  'font-mono text-[11px] uppercase tracking-[0.04em] pb-0.5 transition-none',
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
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.04em] text-text-secondary hover:text-text transition-none"
        >
          <span>{isLight ? '☀' : '☾'}</span>
          <span>{isLight ? 'LIGHT' : 'DARK'}</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <span className="font-mono text-[10px] text-text-tertiary leading-relaxed">
          stabilizing the human-AI loop
        </span>
      </div>
    </aside>
  )
}
