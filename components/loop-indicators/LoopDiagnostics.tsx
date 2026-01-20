'use client'

import { useEffect, useState } from 'react'
import { calculateGlobalLoopMetrics, getAsciiProgressBar, type GlobalLoopMetrics } from '@/lib/loop-tracking'

interface LoopDiagnosticsProps {
  totalPieces: number
}

export function LoopDiagnostics({ totalPieces }: LoopDiagnosticsProps) {
  const [metrics, setMetrics] = useState<GlobalLoopMetrics>({
    loopCompletion: 0,
    leakageLevel: 'LOW',
    convergenceState: 'STABLE',
  })

  useEffect(() => {
    const calculated = calculateGlobalLoopMetrics(totalPieces)
    setMetrics(calculated)

    // Recalculate every 30 seconds
    const interval = setInterval(() => {
      const updated = calculateGlobalLoopMetrics(totalPieces)
      setMetrics(updated)
    }, 30000)

    return () => clearInterval(interval)
  }, [totalPieces])

  const getLeakageColor = () => {
    switch (metrics.leakageLevel) {
      case 'HIGH':
        return 'text-[var(--divergent)]'
      case 'MED':
        return 'text-[var(--neutral-loop)]'
      case 'LOW':
        return 'text-[var(--convergent)]'
      default:
        return 'text-foreground'
    }
  }

  const getStateColor = () => {
    switch (metrics.convergenceState) {
      case 'DIVERGING':
        return 'text-[var(--divergent)]'
      case 'CONVERGING':
        return 'text-[var(--convergent)]'
      case 'STABLE':
        return 'text-[var(--neutral-loop)]'
      default:
        return 'text-foreground'
    }
  }

  const getStateLabel = () => {
    switch (metrics.convergenceState) {
      case 'DIVERGING':
        return '⚠ UNSTABLE'
      case 'CONVERGING':
        return '✓ IMPROVING'
      case 'STABLE':
        return '✓ GOOD'
      default:
        return 'UNKNOWN'
    }
  }

  return (
    <div className="rounded border border-black p-4">
      <div className="mb-3 font-mono text-[10px] font-semibold tracking-wider">LOOP DIAGNOSTICS</div>

      <div className="space-y-4 font-mono text-[10px]">
        {/* Completion */}
        <div>
          <div className="mb-1 text-muted-foreground">COMPLETION: {metrics.loopCompletion}%</div>
          <div className="text-lg leading-none tracking-tighter">
            [{getAsciiProgressBar(metrics.loopCompletion)}] {Math.round((metrics.loopCompletion / 100) * totalPieces)}/
            {totalPieces}
          </div>
        </div>

        {/* Leakage Analysis */}
        <div>
          <div className="mb-2 text-muted-foreground">LEAKAGE ANALYSIS:</div>
          <div className="space-y-1 pl-2 text-[9px]">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">├─ Read→Extract:</span>
              <span className={getLeakageColor()}>LOW</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">├─ Extract→Integrate:</span>
              <span className="text-[var(--neutral-loop)]">MED</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">├─ Integrate→Decide:</span>
              <span className={getLeakageColor()}>{metrics.leakageLevel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">└─ Decide→Feedback:</span>
              <span className="text-[var(--neutral-loop)]">MED</span>
            </div>
          </div>
        </div>

        {/* Convergence */}
        <div>
          <div className="mb-1 text-muted-foreground">CONVERGENCE: {metrics.convergenceState}</div>
          <div className={`${getStateColor()} text-[9px]`}>
            <div>Session rhythm: {getStateLabel()}</div>
            <div className="text-muted-foreground">Last 7 days: {getStateLabel()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
