'use client'

import { useEffect, useState } from 'react'
import { loadRecentSessionMetrics, type SessionMetrics } from '@/lib/loop-tracking'
import type { Piece } from '@/lib/pieces'

interface TrainabilityWarningProps {
  pieces: Piece[]
  currentPieceId?: number
}

interface BoundaryAnalysis {
  isUnstable: boolean
  sessionLengthChange: number // percentage
  completionRateChange: number // percentage
  contextSwitchChange: number // percentage
  signals: string[]
  recommendations: string[]
}

function analyzeBoundaryProximity(): BoundaryAnalysis {
  const metrics = loadRecentSessionMetrics(7)

  if (metrics.length < 3) {
    return {
      isUnstable: false,
      sessionLengthChange: 0,
      completionRateChange: 0,
      contextSwitchChange: 0,
      signals: [],
      recommendations: [],
    }
  }

  // Split into recent (last 3) and baseline (previous)
  const recent = metrics.slice(-3)
  const baseline = metrics.slice(0, -3)

  if (baseline.length === 0) {
    return {
      isUnstable: false,
      sessionLengthChange: 0,
      completionRateChange: 0,
      contextSwitchChange: 0,
      signals: [],
      recommendations: [],
    }
  }

  // Calculate averages
  const avgRecentLength = recent.reduce((sum, m) => sum + m.sessionLength, 0) / recent.length
  const avgBaselineLength = baseline.reduce((sum, m) => sum + m.sessionLength, 0) / baseline.length
  const lengthChange = avgBaselineLength > 0 ? ((avgRecentLength - avgBaselineLength) / avgBaselineLength) * 100 : 0

  const avgRecentCompletion = recent.reduce((sum, m) => sum + m.completionRate, 0) / recent.length
  const avgBaselineCompletion = baseline.reduce((sum, m) => sum + m.completionRate, 0) / baseline.length
  const completionChange =
    avgBaselineCompletion > 0 ? ((avgRecentCompletion - avgBaselineCompletion) / avgBaselineCompletion) * 100 : 0

  const avgRecentSwitches = recent.reduce((sum, m) => sum + m.contextSwitches, 0) / recent.length
  const avgBaselineSwitches = baseline.reduce((sum, m) => sum + m.contextSwitches, 0) / baseline.length
  const switchChange =
    avgBaselineSwitches > 0 ? ((avgRecentSwitches - avgBaselineSwitches) / avgBaselineSwitches) * 100 : 0

  // Detect instability signals
  const signals: string[] = []
  const recommendations: string[] = []

  if (lengthChange < -30) {
    signals.push(`Session length: ${Math.round(lengthChange)}%`)
    recommendations.push('Take a 10-15 minute break to reset attention')
  }

  if (completionChange < -20) {
    signals.push(`Completion rate: ${Math.round(completionChange)}%`)
    recommendations.push('Switch to an easier piece to rebuild momentum')
  }

  if (switchChange > 100) {
    signals.push(`Context switches: +${Math.round(switchChange)}%`)
    recommendations.push('Focus on a single piece for the next session')
  }

  const isUnstable = signals.length >= 2

  if (isUnstable) {
    recommendations.push('Consider using Fragment mode to enforce pacing')
    recommendations.push('Review Loop Diagnostics to identify leakage points')
  }

  return {
    isUnstable,
    sessionLengthChange: lengthChange,
    completionRateChange: completionChange,
    contextSwitchChange: switchChange,
    signals,
    recommendations,
  }
}

export function TrainabilityWarning({ pieces, currentPieceId }: TrainabilityWarningProps) {
  const [analysis, setAnalysis] = useState<BoundaryAnalysis>({
    isUnstable: false,
    sessionLengthChange: 0,
    completionRateChange: 0,
    contextSwitchChange: 0,
    signals: [],
    recommendations: [],
  })

  useEffect(() => {
    const result = analyzeBoundaryProximity()
    setAnalysis(result)

    // Recalculate every 5 minutes
    const interval = setInterval(() => {
      const updated = analyzeBoundaryProximity()
      setAnalysis(updated)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Only show if unstable
  if (!analysis.isUnstable) {
    return null
  }

  // Suggest easier pieces
  const easierPieces = pieces
    .filter((p) => p.id !== currentPieceId)
    .filter((p) => p.wordCount < 1500 || p.mood.includes('contemplative'))
    .slice(0, 2)

  return (
    <div className="rounded border-2 border-[var(--divergent)] bg-[var(--divergent)]/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">⚠</span>
        <div className="font-mono text-[10px] font-semibold tracking-wider text-[var(--divergent)]">
          BOUNDARY PROXIMITY
        </div>
      </div>

      <div className="space-y-3 font-mono text-[10px]">
        {/* Status */}
        <div>
          <div className="mb-1 text-muted-foreground">STATUS:</div>
          <div className="text-[var(--divergent)]">APPROACHING</div>
        </div>

        {/* Description */}
        <div className="text-[9px] text-muted-foreground">
          Your reading pattern is near the fractal edge. The system has detected instability in your learning dynamics.
        </div>

        {/* Indicators */}
        <div>
          <div className="mb-2 text-muted-foreground">INDICATORS:</div>
          <div className="space-y-1 pl-2 text-[9px]">
            {analysis.signals.map((signal, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[var(--divergent)]">├─</span>
                <span className="text-muted-foreground">{signal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <div className="mb-2 text-muted-foreground">SUGGESTIONS:</div>
          <div className="space-y-1 pl-2 text-[9px]">
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[var(--te-orange)]">•</span>
                <span className="text-muted-foreground">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Easier pieces */}
        {easierPieces.length > 0 && (
          <div className="border-t border-[var(--divergent)]/20 pt-3">
            <div className="mb-1 text-muted-foreground">RECOMMENDED PIECES:</div>
            <div className="flex gap-2">
              {easierPieces.map((piece) => (
                <div key={piece.id} className="text-[var(--te-orange)]">
                  #{piece.id.toString().padStart(3, '0')}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
