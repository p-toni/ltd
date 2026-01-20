'use client'

import { useEffect, useState, memo } from 'react'
import type { Piece } from '@/lib/pieces'
import { calculateConceptVelocity, getVelocityDescription, identifyHubs, type ConceptVelocityMetrics } from '@/lib/concept-velocity'
import { getAsciiProgressBar } from '@/lib/loop-tracking'

interface CompoundingIndicatorsProps {
  pieces: Piece[]
  onPieceClick?: (pieceId: number) => void
}

export const CompoundingIndicators = memo(function CompoundingIndicators({ pieces, onPieceClick }: CompoundingIndicatorsProps) {
  const [metrics, setMetrics] = useState<ConceptVelocityMetrics | null>(null)

  useEffect(() => {
    const calculated = calculateConceptVelocity(pieces)
    setMetrics(calculated)
  }, [pieces])

  if (!metrics) return null

  const hubs = identifyHubs(metrics, pieces)
  const getTrendColor = () => {
    if (metrics.velocityTrend === 'ACCELERATING') return 'text-[var(--convergent)]'
    if (metrics.velocityTrend === 'STABLE') return 'text-[var(--neutral-loop)]'
    return 'text-[var(--divergent)]'
  }

  const getTrendIcon = () => {
    if (metrics.velocityTrend === 'ACCELERATING') return '✓'
    if (metrics.velocityTrend === 'STABLE') return '◷'
    return '⚠'
  }

  const getClusterColor = () => {
    if (metrics.clusterFormation === 'EXCELLENT') return 'text-[var(--convergent)]'
    if (metrics.clusterFormation === 'STABLE') return 'text-[var(--neutral-loop)]'
    if (metrics.clusterFormation === 'FORMING') return 'text-[var(--te-orange)]'
    return 'text-[var(--divergent)]'
  }

  const getClusterIcon = () => {
    if (metrics.clusterFormation === 'EXCELLENT' || metrics.clusterFormation === 'STABLE') return '✓'
    if (metrics.clusterFormation === 'FORMING') return '◷'
    return '○'
  }

  return (
    <div className="rounded border border-black p-4">
      <div className="mb-3 font-mono text-[10px] font-semibold tracking-wider">COMPOUNDING</div>

      <div className="space-y-4 font-mono text-[10px]">
        {/* Citation Density */}
        <div>
          <div className="mb-1 text-muted-foreground">Citation Density:</div>
          <div className="mb-1 text-lg leading-none tracking-tighter">{getAsciiProgressBar(Math.min(metrics.citationDensity * 50, 100), 10)} {metrics.citationDensity.toFixed(1)}</div>
          <div className="text-[9px] text-muted-foreground">{Math.round(metrics.citationDensity * pieces.length)} total links</div>
        </div>

        {/* Re-entry Frequency */}
        <div>
          <div className="mb-2 text-muted-foreground">Re-entry Frequency:</div>
          <div className="space-y-1 pl-2 text-[9px]">
            {metrics.topPieces.slice(0, 3).map((item) => {
              const piece = pieces.find((p) => p.id === item.id)
              return (
                <div key={item.id} className="flex items-center justify-between">
                  <button
                    onClick={() => onPieceClick?.(item.id)}
                    className="text-muted-foreground hover:text-[var(--te-orange)]"
                  >
                    ├─ #{item.id.toString().padStart(3, '0')}:
                  </button>
                  <span className="text-muted-foreground">{item.visits} visits</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Concept Velocity */}
        <div>
          <div className="mb-1 text-muted-foreground">Concept Velocity:</div>
          <div className="mb-1 text-[9px] text-muted-foreground">New pieces building on old:</div>
          <div className={`flex items-center gap-2 ${getTrendColor()}`}>
            <span>{getTrendIcon()}</span>
            <span className="font-bold">{metrics.velocityTrend}</span>
          </div>
        </div>

        {/* Geometry Test */}
        <div>
          <div className="mb-1 text-muted-foreground">Geometry Test:</div>
          <div className="mb-1 text-[9px] text-muted-foreground">Pieces form navigable clusters:</div>
          <div className={`flex items-center gap-2 ${getClusterColor()}`}>
            <span>{getClusterIcon()}</span>
            <span className="font-bold">{metrics.clusterFormation}</span>
          </div>
          <div className="mt-1 text-[9px] text-muted-foreground">(density: {metrics.citationDensity.toFixed(2)})</div>
        </div>

        {/* Compounding Score */}
        <div className="border-t border-black pt-3">
          <div className="mb-1 text-muted-foreground">Compounding Score:</div>
          <div className="text-2xl font-bold leading-none tracking-tighter">
            {(metrics.compoundingScore * 100).toFixed(0)}%
          </div>
          <div className="mt-2 h-2 w-full rounded-sm bg-muted">
            <div
              className="h-full rounded-sm bg-[var(--te-orange)] transition-all"
              style={{ width: `${metrics.compoundingScore * 100}%` }}
            />
          </div>
        </div>

        {/* Mental Map Centers */}
        {hubs.length > 0 && (
          <div className="border-t border-black pt-3">
            <div className="mb-2 text-muted-foreground">Mental Map Centers:</div>
            <div className="space-y-1 text-[9px]">
              {hubs.slice(0, 2).map((hub) => (
                <button
                  key={hub.piece.id}
                  onClick={() => onPieceClick?.(hub.piece.id)}
                  className="block text-left text-muted-foreground hover:text-[var(--te-orange)]"
                >
                  #{hub.piece.id.toString().padStart(3, '0')} — {hub.piece.title} (hub)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="border-t border-black pt-3">
          <div className="text-[9px] leading-relaxed text-muted-foreground">
            {getVelocityDescription(metrics)}
          </div>
        </div>
      </div>
    </div>
  )
})
