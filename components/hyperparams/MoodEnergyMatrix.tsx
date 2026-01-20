'use client'

import { useState } from 'react'
import type { Piece } from '@/lib/pieces'

interface MoodEnergyMatrixProps {
  pieces: Piece[]
  onPieceClick?: (pieceId: number) => void
}

type EnergyLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export function MoodEnergyMatrix({ pieces, onPieceClick }: MoodEnergyMatrixProps) {
  const [userEnergy, setUserEnergy] = useState<EnergyLevel>('MEDIUM')

  // Classify pieces by mood and energy
  const classifyPiece = (piece: Piece): { mood: string; energy: 'HIGH' | 'LOW' } => {
    const primaryMood = piece.mood[0] || 'contemplative'
    const wordCount = piece.wordCount

    // Energy heuristic: shorter = higher energy
    // analytical/exploratory = high energy
    // contemplative/critical = low energy
    const isHighEnergy =
      (primaryMood === 'analytical' || primaryMood === 'exploratory') && wordCount < 1500

    return {
      mood: primaryMood,
      energy: isHighEnergy ? 'HIGH' : 'LOW',
    }
  }

  // Group pieces by quadrant
  const quadrants = {
    analytical: pieces.filter((p) => {
      const { mood, energy } = classifyPiece(p)
      return mood === 'analytical' && energy === 'HIGH'
    }),
    exploratory: pieces.filter((p) => {
      const { mood, energy } = classifyPiece(p)
      return mood === 'exploratory' && energy === 'HIGH'
    }),
    contemplative: pieces.filter((p) => {
      const { mood, energy } = classifyPiece(p)
      return mood === 'contemplative' && energy === 'LOW'
    }),
    critical: pieces.filter((p) => {
      const { mood, energy } = classifyPiece(p)
      return mood === 'critical' && energy === 'LOW'
    }),
  }

  const getRecommendation = (): number[] => {
    // Recommend based on user energy
    switch (userEnergy) {
      case 'HIGH':
        return [...quadrants.analytical, ...quadrants.exploratory].slice(0, 2).map((p) => p.id)
      case 'LOW':
        return [...quadrants.contemplative].slice(0, 2).map((p) => p.id)
      case 'MEDIUM':
        return [...quadrants.exploratory, ...quadrants.critical].slice(0, 2).map((p) => p.id)
      default:
        return []
    }
  }

  const recommended = getRecommendation()

  return (
    <div className="rounded border border-black p-4">
      <div className="mb-3 font-mono text-[10px] font-semibold tracking-wider">MOOD-ENERGY MATRIX</div>

      <div className="space-y-4">
        {/* Matrix Grid */}
        <div className="relative">
          <div className="mb-2 text-center font-mono text-[8px] text-muted-foreground">HIGH ENERGY</div>

          <div className="grid grid-cols-2 gap-2 border border-black">
            {/* Top Left: Analytical */}
            <div className="border-r border-black bg-[var(--cluster-analytical)] p-3">
              <div className="mb-1 font-mono text-[9px] font-semibold">ANALYT</div>
              <div className="space-y-0.5 font-mono text-[8px] text-muted-foreground">
                {quadrants.analytical.slice(0, 3).map((piece) => (
                  <button
                    key={piece.id}
                    onClick={() => onPieceClick?.(piece.id)}
                    className="block hover:text-[var(--te-orange)]"
                  >
                    #{piece.id.toString().padStart(3, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Top Right: Exploratory */}
            <div className="bg-[var(--cluster-exploratory)] p-3">
              <div className="mb-1 font-mono text-[9px] font-semibold">EXPLOR</div>
              <div className="space-y-0.5 font-mono text-[8px] text-muted-foreground">
                {quadrants.exploratory.slice(0, 3).map((piece) => (
                  <button
                    key={piece.id}
                    onClick={() => onPieceClick?.(piece.id)}
                    className="block hover:text-[var(--te-orange)]"
                  >
                    #{piece.id.toString().padStart(3, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Left: Contemplative */}
            <div className="border-r border-t border-black bg-[var(--cluster-contemplative)] p-3">
              <div className="mb-1 font-mono text-[9px] font-semibold">CONTEM</div>
              <div className="space-y-0.5 font-mono text-[8px] text-muted-foreground">
                {quadrants.contemplative.slice(0, 3).map((piece) => (
                  <button
                    key={piece.id}
                    onClick={() => onPieceClick?.(piece.id)}
                    className="block hover:text-[var(--te-orange)]"
                  >
                    #{piece.id.toString().padStart(3, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Right: Critical */}
            <div className="border-t border-black bg-[var(--cluster-critical)] p-3">
              <div className="mb-1 font-mono text-[9px] font-semibold">CRITIC</div>
              <div className="space-y-0.5 font-mono text-[8px] text-muted-foreground">
                {quadrants.critical.slice(0, 3).map((piece) => (
                  <button
                    key={piece.id}
                    onClick={() => onPieceClick?.(piece.id)}
                    className="block hover:text-[var(--te-orange)]"
                  >
                    #{piece.id.toString().padStart(3, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 text-center font-mono text-[8px] text-muted-foreground">LOW ENERGY</div>
        </div>

        {/* User Energy Selector */}
        <div>
          <div className="mb-2 font-mono text-[9px] text-muted-foreground">WHERE ARE YOU NOW?</div>
          <div className="flex gap-2">
            {(['LOW', 'MEDIUM', 'HIGH'] as EnergyLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setUserEnergy(level)}
                className={`flex-1 rounded border px-2 py-1 font-mono text-[8px] transition-colors ${
                  userEnergy === level
                    ? 'border-black bg-black text-white'
                    : 'border-black bg-transparent hover:bg-black/5'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {recommended.length > 0 && (
          <div>
            <div className="mb-1 font-mono text-[9px] text-muted-foreground">RECOMMENDED:</div>
            <div className="flex gap-2 font-mono text-[9px]">
              {recommended.map((id) => (
                <button
                  key={id}
                  onClick={() => onPieceClick?.(id)}
                  className="text-[var(--te-orange)] hover:underline"
                >
                  #{id.toString().padStart(3, '0')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
