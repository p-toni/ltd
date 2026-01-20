'use client'

import { useEffect, useState } from 'react'
import { calculateGlobalLoopMetrics, getAsciiProgressBar, type GlobalLoopMetrics } from '@/lib/loop-tracking'

interface LoopStatusBarProps {
  totalPieces: number
}

export function LoopStatusBar({ totalPieces }: LoopStatusBarProps) {
  const [metrics, setMetrics] = useState<GlobalLoopMetrics>({
    loopCompletion: 0,
    leakageLevel: 'LOW',
    convergenceState: 'STABLE',
  })

  useEffect(() => {
    // Calculate metrics on mount
    const calculated = calculateGlobalLoopMetrics(totalPieces)
    setMetrics(calculated)

    // Recalculate every 30 seconds
    const interval = setInterval(() => {
      const updated = calculateGlobalLoopMetrics(totalPieces)
      setMetrics(updated)
    }, 30000)

    return () => clearInterval(interval)
  }, [totalPieces])

  // Determine color based on convergence state
  const getStateColor = () => {
    switch (metrics.convergenceState) {
      case 'STABLE':
        return 'text-[color:var(--convergent)]'
      case 'DIVERGING':
        return 'text-[color:var(--divergent)]'
      case 'CONVERGING':
        return 'text-[color:var(--te-orange)]'
      default:
        return 'text-muted-foreground'
    }
  }

  const getLeakageColor = () => {
    switch (metrics.leakageLevel) {
      case 'LOW':
        return 'text-[color:var(--convergent)]'
      case 'MED':
        return 'text-[color:var(--te-orange)]'
      case 'HIGH':
        return 'text-[color:var(--divergent)]'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="flex items-center gap-4 font-mono text-[10px] tracking-wider">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">LOOP:</span>
        <span className="font-semibold tabular-nums">
          [{getAsciiProgressBar(metrics.loopCompletion)}] {metrics.loopCompletion}%
        </span>
      </div>

      <div className="h-3 w-px bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">LEAKAGE:</span>
        <span className={`font-semibold ${getLeakageColor()}`}>{metrics.leakageLevel}</span>
      </div>

      <div className="h-3 w-px bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">CONVERGENCE:</span>
        <span className={`font-semibold ${getStateColor()}`}>{metrics.convergenceState}</span>
      </div>
    </div>
  )
}
