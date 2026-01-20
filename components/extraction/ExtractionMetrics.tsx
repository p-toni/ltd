'use client'

import { useEffect, useState } from 'react'
import { estimateEpiplexity, type EpiplexityMetrics } from '@/lib/epiplexity'
import type { Piece } from '@/lib/pieces'

interface ExtractionMetricsProps {
  piece: Piece
  scrollProgress?: number
  checkpointsPassed?: number
  totalCheckpoints?: number
}

export function ExtractionMetrics({ piece, scrollProgress = 0, checkpointsPassed = 0, totalCheckpoints = 0 }: ExtractionMetricsProps) {
  const [metrics, setMetrics] = useState<EpiplexityMetrics | null>(null)
  const [sessionTime, setSessionTime] = useState(0)

  useEffect(() => {
    const calculated = estimateEpiplexity(piece)
    setMetrics(calculated)
  }, [piece])

  // Track session time
  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [piece.id])

  if (!metrics) return null

  const getEpiplexityColor = () => {
    if (metrics.extractability === 'VERY_HIGH') return 'text-[var(--divergent)]'
    if (metrics.extractability === 'HIGH') return 'text-[var(--te-orange)]'
    if (metrics.extractability === 'MEDIUM') return 'text-[var(--neutral-loop)]'
    return 'text-[var(--convergent)]'
  }

  const getExtractabilityPosition = () => {
    // Position dot on scale: BOUNDED ●───────○ OPEN
    // raw score 0-1 maps to position
    return Math.round(metrics.raw * 100) // 0-100%
  }

  return (
    <div className="rounded border border-black p-4">
      <div className="mb-3 font-mono text-[10px] font-semibold tracking-wider">EXTRACTION METRICS</div>

      <div className="space-y-4 font-mono text-[10px]">
        {/* Session Timer */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground">Session Time:</span>
            <span className="font-mono text-lg font-bold tabular-nums">{Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="mb-1 flex items-center justify-between text-[9px]">
            <span className="text-muted-foreground">Progress:</span>
            <span className="text-muted-foreground">{Math.round(scrollProgress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-sm bg-muted">
            <div
              className="h-full rounded-sm bg-[var(--te-orange)] transition-all"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
          {totalCheckpoints > 0 && (
            <div className="mt-1 text-[9px] text-muted-foreground">
              Checkpoints: {checkpointsPassed}/{totalCheckpoints}
            </div>
          )}
        </div>

        {/* Current Piece Header */}
        <div>
          <div className="text-muted-foreground">CURRENT PIECE:</div>
          <div className="text-[9px]">
            #{piece.id.toString().padStart(3, '0')} — {piece.title}
          </div>
        </div>

        {/* Epiplexity Score */}
        <div>
          <div className="mb-1 text-muted-foreground">Epiplexity: {metrics.extractability}</div>
          <div className="mb-2 text-lg font-bold leading-none tracking-tighter">
            <span className={getEpiplexityColor()}>{metrics.raw}</span>
          </div>
          <div className="h-2 w-full rounded-sm bg-muted">
            <div
              className={`h-full rounded-sm ${getEpiplexityColor()} bg-current transition-all`}
              style={{ width: `${metrics.raw * 100}%` }}
            />
          </div>
        </div>

        {/* Info Density */}
        <div>
          <div className="mb-2 text-muted-foreground">Info Density:</div>
          <div className="space-y-1 pl-2 text-[9px] text-muted-foreground">
            <div className="flex justify-between">
              <span>├─ Tooltips:</span>
              <span>{metrics.tooltipDensity}/page</span>
            </div>
            <div className="flex justify-between">
              <span>├─ Citations:</span>
              <span>{piece.citations?.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>└─ Avg para:</span>
              <span>{Math.round(piece.wordCount / 15)} words</span>
            </div>
          </div>
        </div>

        {/* Extractability Scale */}
        <div>
          <div className="mb-2 text-muted-foreground">Extractability:</div>
          <div className="relative">
            {/* Scale line */}
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <span className="font-semibold">BOUNDED</span>
              <div className="relative flex-1">
                <div className="h-px bg-muted" />
                {/* Position indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-[var(--te-orange)] bg-background transition-all"
                  style={{ left: `${getExtractabilityPosition()}%`, marginLeft: '-6px' }}
                />
              </div>
              <span>OPEN</span>
            </div>
            {/* Position label */}
            <div className="mt-2 text-center text-[9px] text-muted-foreground">(optimal for bounded extraction)</div>
          </div>
        </div>

        {/* Reading Recommendations */}
        <div className="border-t border-black pt-3">
          <div className="mb-2 text-muted-foreground">RECOMMENDATIONS:</div>
          <div className="space-y-1 text-[9px] text-muted-foreground">
            {metrics.estimatedReadTime > 10 && <div>• Consider fragment mode for long pieces</div>}
            {metrics.tooltipDensity > 4 && <div>• High tooltip density - take notes while reading</div>}
            {metrics.raw > 0.8 && <div>• Very high structure - excellent for deep learning</div>}
            {metrics.raw < 0.4 && <div>• Lower structure - may need multiple passes</div>}
            {(piece.citations?.length ?? 0) > 3 && <div>• Rich citation network - explore connections</div>}
          </div>
        </div>

        {/* Estimated Read Time */}
        <div className="border-t border-black pt-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Read Time:</span>
            <span className="font-bold">{metrics.estimatedReadTime} min</span>
          </div>
        </div>
      </div>
    </div>
  )
}
