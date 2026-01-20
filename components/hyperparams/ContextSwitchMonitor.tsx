'use client'

import { useEffect, useState } from 'react'

interface ContextSwitchMonitorProps {
  currentPieceId?: number
}

interface SessionData {
  switches: number
  lastSwitch: number
  startTime: number
}

export function ContextSwitchMonitor({ currentPieceId }: ContextSwitchMonitorProps) {
  const [sessionData, setSessionData] = useState<SessionData>({
    switches: 0,
    lastSwitch: Date.now(),
    startTime: Date.now(),
  })

  // Track context switches
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem('session-context-switches')
    if (stored) {
      try {
        const data = JSON.parse(stored) as SessionData
        setSessionData(data)
      } catch {
        // Invalid data
      }
    }

    // Track piece changes
    const lastPiece = localStorage.getItem('last-viewed-piece')
    if (lastPiece && currentPieceId && parseInt(lastPiece) !== currentPieceId) {
      const newData: SessionData = {
        switches: sessionData.switches + 1,
        lastSwitch: Date.now(),
        startTime: sessionData.startTime,
      }
      setSessionData(newData)
      localStorage.setItem('session-context-switches', JSON.stringify(newData))
    }

    if (currentPieceId) {
      localStorage.setItem('last-viewed-piece', currentPieceId.toString())
    }
  }, [currentPieceId])

  const getTimeSinceLastSwitch = () => {
    const minutes = Math.floor((Date.now() - sessionData.lastSwitch) / 60000)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m ago`
  }

  const getAverageInterval = () => {
    if (sessionData.switches === 0) return 'N/A'
    const totalMinutes = (Date.now() - sessionData.startTime) / 60000
    const avgMinutes = totalMinutes / sessionData.switches
    if (avgMinutes < 60) return `${Math.round(avgMinutes)} min`
    const hours = Math.floor(avgMinutes / 60)
    return `${hours}h ${Math.round(avgMinutes % 60)}m`
  }

  const getStatus = () => {
    const switches = sessionData.switches
    if (switches >= 2 && switches <= 4) {
      return { label: '✓ GOOD', color: 'text-[var(--convergent)]' }
    } else if (switches > 4) {
      return { label: '⚠ HIGH', color: 'text-[var(--divergent)]' }
    } else {
      return { label: 'LOW', color: 'text-[var(--neutral-loop)]' }
    }
  }

  const status = getStatus()

  const getRecommendation = () => {
    if (sessionData.switches > 4) {
      return 'Take a break or focus on current piece'
    } else if (sessionData.switches < 2) {
      return 'Continue current piece (boundary stable)'
    } else {
      return 'Continue current piece (boundary stable)'
    }
  }

  return (
    <div className="rounded border border-black p-4">
      <div className="mb-3 font-mono text-[10px] font-semibold tracking-wider">CONTEXT SWITCHES</div>

      <div className="space-y-3 font-mono text-[10px]">
        {/* Switch Count */}
        <div>
          <div className="mb-1 text-muted-foreground">TODAY: {sessionData.switches}</div>
          <div className="text-[9px] text-muted-foreground">OPTIMAL: 2-4</div>
        </div>

        {/* Status */}
        <div>
          <div className="mb-1 text-muted-foreground">STATUS:</div>
          <div className={status.color}>{status.label}</div>
        </div>

        {/* Metrics */}
        <div className="space-y-1 text-[9px] text-muted-foreground">
          <div>Last switch: {getTimeSinceLastSwitch()}</div>
          <div>Avg interval: {getAverageInterval()}</div>
        </div>

        {/* Recommendation */}
        <div>
          <div className="mb-1 text-muted-foreground">RECOMMENDATION:</div>
          <div className="text-[9px]">{getRecommendation()}</div>
        </div>
      </div>
    </div>
  )
}
