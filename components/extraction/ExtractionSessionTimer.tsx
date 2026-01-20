'use client'

import { useEffect, useState, useRef } from 'react'
import { estimateEpiplexity, type EpiplexityMetrics } from '@/lib/epiplexity'
import { getAsciiProgressBar } from '@/lib/loop-tracking'
import type { Piece } from '@/lib/pieces'

interface ExtractionSessionTimerProps {
  piece: Piece
  scrollProgress: number // 0-1
  checkpointsPassed: number
  totalCheckpoints: number
}

export function ExtractionSessionTimer({
  piece,
  scrollProgress,
  checkpointsPassed,
  totalCheckpoints,
}: ExtractionSessionTimerProps) {
  const [sessionTime, setSessionTime] = useState(0)
  const [epiplexityMetrics, setEpiplexityMetrics] = useState<EpiplexityMetrics | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // Calculate epiplexity on mount
  useEffect(() => {
    const metrics = estimateEpiplexity(piece)
    setEpiplexityMetrics(metrics)
  }, [piece])

  // Update session timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setSessionTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!epiplexityMetrics) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const estimatedSeconds = epiplexityMetrics.estimatedReadTime * 60
  const progressPercentage = Math.min(Math.round(scrollProgress * 100), 100)

  const getDensityColor = () => {
    if (epiplexityMetrics.raw >= 0.8) return 'text-[var(--divergent)]'
    if (epiplexityMetrics.raw >= 0.6) return 'text-[var(--te-orange)]'
    if (epiplexityMetrics.raw >= 0.4) return 'text-[var(--neutral-loop)]'
    return 'text-[var(--convergent)]'
  }

  const getDensityLabel = () => {
    if (epiplexityMetrics.raw >= 0.8) return 'VERY HIGH'
    if (epiplexityMetrics.raw >= 0.6) return 'HIGH'
    if (epiplexityMetrics.raw >= 0.4) return 'MEDIUM'
    return 'LOW'
  }

  return (
    <div className="fixed right-6 top-20 z-10 rounded border border-black bg-background p-4 shadow-lg">
      <div className="mb-2 font-mono text-[10px] font-semibold tracking-wider">EXTRACTION</div>

      <div className="space-y-3 font-mono text-[10px]">
        {/* Progress Bar */}
        <div>
          <div className="mb-1 text-muted-foreground">[{getAsciiProgressBar(progressPercentage)}] {progressPercentage}%</div>
        </div>

        {/* Time */}
        <div>
          <div className="text-muted-foreground">
            {formatTime(sessionTime)} / ~{formatTime(estimatedSeconds)}
          </div>
        </div>

        {/* Checkpoints */}
        <div>
          <div className="text-muted-foreground">
            CHECKPOINT: {checkpointsPassed}/{totalCheckpoints}
          </div>
        </div>

        {/* Density */}
        <div>
          <div className="text-muted-foreground">DENSITY:</div>
          <div className={getDensityColor()}>{getDensityLabel()}</div>
        </div>

        {/* Epiplexity */}
        <div className="border-t border-black pt-2">
          <div className="mb-1 text-muted-foreground">EPIPLEXITY: {epiplexityMetrics.raw}</div>
          <div className="space-y-1 text-[9px] text-muted-foreground">
            <div>Tooltips: {epiplexityMetrics.tooltipDensity}/100w</div>
            <div>Citations: {epiplexityMetrics.citationDensity}/1000w</div>
            <div>Vocab: {(epiplexityMetrics.vocabularyRichness * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
