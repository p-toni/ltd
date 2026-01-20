'use client'

import { useState, useMemo } from 'react'
import type { Piece } from '@/lib/pieces'
import { loadLoopState } from '@/lib/loop-tracking'
import { cn } from '@/lib/utils'

interface PieceMapProps {
  pieces: Piece[]
  activePieceId?: number
  onPieceClick?: (pieceId: number) => void
  className?: string
}

type SortMode = 'id' | 'completion' | 'date' | 'mood'

export function PieceMap({ pieces, activePieceId, onPieceClick, className = '' }: PieceMapProps) {
  const [sortMode, setSortMode] = useState<SortMode>('id')

  // Calculate loop completion for each piece
  const piecesWithCompletion = useMemo(() => {
    return pieces.map((piece) => {
      const loopState = loadLoopState(piece.id)
      const stages = Object.values(loopState.stages)
      const completedCount = stages.filter((s) => s.completed).length
      const completion = Math.round((completedCount / 5) * 100)

      return {
        ...piece,
        loopCompletion: completion,
        loopStages: stages.map((s) => s.completed),
      }
    })
  }, [pieces])

  // Sort pieces
  const sortedPieces = useMemo(() => {
    const sorted = [...piecesWithCompletion]

    switch (sortMode) {
      case 'completion':
        return sorted.sort((a, b) => b.loopCompletion - a.loopCompletion)
      case 'date':
        return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      case 'mood':
        return sorted.sort((a, b) => a.mood[0].localeCompare(b.mood[0]))
      case 'id':
      default:
        return sorted.sort((a, b) => a.id - b.id)
    }
  }, [piecesWithCompletion, sortMode])

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'analytical':
        return 'border-[var(--cluster-analytical)] bg-[var(--cluster-analytical)]'
      case 'exploratory':
        return 'border-[var(--cluster-exploratory)] bg-[var(--cluster-exploratory)]'
      case 'contemplative':
        return 'border-[var(--cluster-contemplative)] bg-[var(--cluster-contemplative)]'
      case 'critical':
        return 'border-[var(--cluster-critical)] bg-[var(--cluster-critical)]'
      default:
        return 'border-muted bg-muted'
    }
  }

  return (
    <div className={`flex h-full flex-col p-8 ${className}`}>
      {/* Header with sort controls */}
      <div className="mb-6">
        <div className="mb-4 font-mono text-sm font-semibold tracking-wider">PIECE MAP</div>
        <div className="flex gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">SORT:</span>
          {(['id', 'completion', 'date', 'mood'] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={cn(
                'rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
                sortMode === mode
                  ? 'border-black bg-black text-white'
                  : 'border-transparent hover:border-black',
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Piece Grid */}
      <div className="grid flex-1 auto-rows-fr grid-cols-4 gap-4 overflow-y-auto">
        {sortedPieces.map((piece) => {
          const isActive = piece.id === activePieceId
          const primaryMood = piece.mood[0]

          return (
            <button
              key={piece.id}
              onClick={() => onPieceClick?.(piece.id)}
              className={cn(
                'group relative flex flex-col rounded-lg border-2 p-4 transition-all hover:scale-105',
                isActive
                  ? 'border-[var(--te-orange)] bg-[var(--te-orange)]/5'
                  : `${getMoodColor(primaryMood)} border-2 hover:border-black`,
              )}
            >
              {/* Piece ID */}
              <div className="mb-2 font-mono text-[10px] font-bold tracking-wider text-muted-foreground">
                #{piece.id.toString().padStart(3, '0')}
              </div>

              {/* Title */}
              <div className="mb-3 flex-1 text-left text-sm font-semibold leading-tight line-clamp-3">
                {piece.title}
              </div>

              {/* Loop Completion Ring */}
              <div className="mb-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-2 w-2 rounded-full border transition-colors',
                        piece.loopStages[i]
                          ? 'border-[var(--te-orange)] bg-[var(--te-orange)]'
                          : 'border-muted bg-transparent',
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Completion Percentage */}
              <div className="font-mono text-[10px] text-muted-foreground">{piece.loopCompletion}%</div>

              {/* Mood Badge */}
              <div className="absolute right-2 top-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
                {primaryMood}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 rounded border border-black p-3">
        <div className="mb-2 font-mono text-[10px] font-semibold tracking-wider">LEGEND</div>
        <div className="space-y-1 font-mono text-[9px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${i < 3 ? 'border border-[var(--te-orange)] bg-[var(--te-orange)]' : 'border border-muted'}`}
                />
              ))}
            </div>
            <span>= 3/5 stages completed (60%)</span>
          </div>
          <div>◉ Filled = READ → EXTRACT → INTEGRATE → DECIDE → FEEDBACK</div>
          <div>○ Empty = Stage not completed</div>
        </div>
      </div>
    </div>
  )
}
