'use client'

import { useEffect, useState, memo } from 'react'
import type { Piece } from '@/lib/pieces'
import { loadAllLoopStates } from '@/lib/loop-tracking'
import { getAsciiProgressBar } from '@/lib/loop-tracking'

interface ReentryFrequencyProps {
  pieces: Piece[]
  onPieceClick?: (pieceId: number) => void
}

interface ReentryData {
  pieceId: number
  visits: number
  title: string
  mood: string
}

export const ReentryFrequency = memo(function ReentryFrequency({ pieces, onPieceClick }: ReentryFrequencyProps) {
  const [reentryData, setReentryData] = useState<ReentryData[]>([])
  const [maxVisits, setMaxVisits] = useState(0)

  useEffect(() => {
    const allStates = loadAllLoopStates()
    const data: ReentryData[] = []

    for (const piece of pieces) {
      const state = allStates.find((s) => s.pieceId === piece.id)
      const visits = state ? state.stages.feedback.returnVisits + 1 : 0 // +1 for initial visit

      data.push({
        pieceId: piece.id,
        visits,
        title: piece.title,
        mood: piece.mood[0],
      })
    }

    // Sort by visits (descending)
    data.sort((a, b) => b.visits - a.visits)

    const max = Math.max(...data.map((d) => d.visits), 1)
    setMaxVisits(max)
    setReentryData(data)
  }, [pieces])

  // Calculate mental map centers
  const mentalMapCenters = reentryData.filter((d) => d.visits >= maxVisits * 0.7).slice(0, 2)

  // Calculate stable loops (pieces with high re-entry in specific moods)
  const moodReentryRates: Record<string, { total: number; visits: number }> = {}
  for (const data of reentryData) {
    if (!moodReentryRates[data.mood]) {
      moodReentryRates[data.mood] = { total: 0, visits: 0 }
    }
    moodReentryRates[data.mood].total++
    if (data.visits > 0) {
      moodReentryRates[data.mood].visits++
    }
  }

  const stableLoopMood = Object.entries(moodReentryRates)
    .map(([mood, stats]) => ({
      mood,
      rate: stats.total > 0 ? (stats.visits / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.rate - a.rate)[0]

  return (
    <div className="rounded border border-black p-4">
      <div className="mb-3 font-mono text-[10px] font-semibold tracking-wider">RE-ENTRY PATTERNS</div>

      <div className="space-y-3 font-mono text-[10px]">
        {/* Top pieces by visits */}
        <div>
          {reentryData.slice(0, 5).map((data) => {
            const percentage = maxVisits > 0 ? (data.visits / maxVisits) * 100 : 0
            const isTop = data.visits === maxVisits

            return (
              <div key={data.pieceId} className="mb-2">
                <div className="mb-1 flex items-center justify-between">
                  <button
                    onClick={() => onPieceClick?.(data.pieceId)}
                    className="text-[9px] text-muted-foreground hover:text-[var(--te-orange)]"
                  >
                    #{data.pieceId.toString().padStart(3, '0')}:
                  </button>
                  <span className="text-[9px] text-muted-foreground">
                    {data.visits} {data.visits === 1 ? 'visit' : 'visits'} {isTop && '(most)'}
                  </span>
                </div>
                <div className="text-[11px] leading-none tracking-tighter">
                  {getAsciiProgressBar(percentage, 10)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Mental map centers */}
        {mentalMapCenters.length > 0 && (
          <div className="border-t border-black pt-3">
            <div className="mb-2 text-muted-foreground">Your mental map centers on:</div>
            <div className="space-y-1 text-[9px] text-muted-foreground">
              {mentalMapCenters.map((center, i) => {
                const piece = pieces.find((p) => p.id === center.pieceId)
                return (
                  <button
                    key={center.pieceId}
                    onClick={() => onPieceClick?.(center.pieceId)}
                    className="block hover:text-[var(--te-orange)]"
                  >
                    #{center.pieceId.toString().padStart(3, '0')} ({i === 0 ? 'hub' : 'foundation'})
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Stable loops */}
        {stableLoopMood && stableLoopMood.rate > 0 && (
          <div className="border-t border-black pt-3">
            <div className="mb-1 text-muted-foreground">Stable loops formed around:</div>
            <div className="text-[9px] text-muted-foreground">
              {stableLoopMood.mood} pieces ({Math.round(stableLoopMood.rate)}% re-entry)
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="border-t border-black pt-3">
          <div className="text-[9px] leading-relaxed text-muted-foreground">
            {maxVisits > 3
              ? 'Strong re-entry patterns indicate stable mental models forming. Your knowledge graph has clear centers.'
              : 'Early stage - continue reading to establish re-entry patterns and mental map centers.'}
          </div>
        </div>
      </div>
    </div>
  )
})
