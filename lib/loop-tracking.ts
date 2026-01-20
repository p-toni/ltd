export interface LoopStage {
  completed: boolean
  timestamp?: number
}

export interface ExtractStage extends LoopStage {
  tooltipsViewed: number
}

export interface IntegrateStage extends LoopStage {
  chatOpened: boolean
}

export interface DecideStage extends LoopStage {
  bookmarked: boolean
}

export interface FeedbackStage extends LoopStage {
  returnVisits: number
}

export interface LoopState {
  pieceId: number
  stages: {
    read: LoopStage
    extract: ExtractStage
    integrate: IntegrateStage
    decide: DecideStage
    feedback: FeedbackStage
  }
  lastUpdated: number
}

export interface GlobalLoopMetrics {
  loopCompletion: number // percentage (0-100)
  leakageLevel: 'LOW' | 'MED' | 'HIGH'
  convergenceState: 'STABLE' | 'DIVERGING' | 'CONVERGING'
}

export interface SessionMetrics {
  date: string
  sessionLength: number // minutes
  completionRate: number // percentage (0-100)
  contextSwitches: number
  piecesVisited: number
}

/**
 * Get default loop state for a piece
 */
export function getDefaultLoopState(pieceId: number): LoopState {
  return {
    pieceId,
    stages: {
      read: { completed: false },
      extract: { completed: false, tooltipsViewed: 0 },
      integrate: { completed: false, chatOpened: false },
      decide: { completed: false, bookmarked: false },
      feedback: { completed: false, returnVisits: 0 },
    },
    lastUpdated: Date.now(),
  }
}

/**
 * Load loop state for a specific piece from localStorage
 */
export function loadLoopState(pieceId: number): LoopState {
  if (typeof window === 'undefined') {
    return getDefaultLoopState(pieceId)
  }

  const stored = localStorage.getItem(`loop-${pieceId}`)
  if (!stored) {
    return getDefaultLoopState(pieceId)
  }

  try {
    return JSON.parse(stored)
  } catch {
    return getDefaultLoopState(pieceId)
  }
}

// Debounced save map to avoid excessive localStorage writes
const saveTimers = new Map<number, NodeJS.Timeout>()

/**
 * Save loop state for a piece to localStorage (debounced 500ms)
 */
export function saveLoopState(state: LoopState, immediate = false): void {
  if (typeof window === 'undefined') return

  const updatedState = {
    ...state,
    lastUpdated: Date.now(),
  }

  if (immediate) {
    localStorage.setItem(`loop-${state.pieceId}`, JSON.stringify(updatedState))
    return
  }

  // Debounce: clear existing timer and set new one
  const existingTimer = saveTimers.get(state.pieceId)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  const timer = setTimeout(() => {
    localStorage.setItem(`loop-${state.pieceId}`, JSON.stringify(updatedState))
    saveTimers.delete(state.pieceId)
  }, 500)

  saveTimers.set(state.pieceId, timer)
}

/**
 * Load all loop states from localStorage
 */
export function loadAllLoopStates(): LoopState[] {
  if (typeof window === 'undefined') return []

  const states: LoopState[] = []
  const keys = Object.keys(localStorage)

  for (const key of keys) {
    if (key.startsWith('loop-')) {
      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          states.push(JSON.parse(stored))
        } catch {
          // Skip invalid states
        }
      }
    }
  }

  return states
}

/**
 * Calculate global loop metrics across all pieces
 */
export function calculateGlobalLoopMetrics(totalPieces: number): GlobalLoopMetrics {
  const allStates = loadAllLoopStates()

  if (allStates.length === 0) {
    return {
      loopCompletion: 0,
      leakageLevel: 'LOW',
      convergenceState: 'STABLE',
    }
  }

  // Loop completion: percentage of pieces with at least partial progress
  const piecesWithProgress = allStates.filter((state) => {
    const stages = Object.values(state.stages)
    return stages.some((stage) => stage.completed)
  }).length

  const loopCompletion = Math.round((piecesWithProgress / totalPieces) * 100)

  // Leakage detection: check time since last visit to unfinished pieces
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const threeDays = oneDay * 3
  const oneWeek = oneDay * 7

  const unfinishedPieces = allStates.filter((state) => {
    const allCompleted = Object.values(state.stages).every((stage) => stage.completed)
    return !allCompleted
  })

  let highLeakageCount = 0
  let medLeakageCount = 0

  for (const state of unfinishedPieces) {
    const timeSinceUpdate = now - state.lastUpdated

    if (timeSinceUpdate > oneWeek) {
      highLeakageCount++
    } else if (timeSinceUpdate > threeDays) {
      medLeakageCount++
    }
  }

  let leakageLevel: 'LOW' | 'MED' | 'HIGH' = 'LOW'
  if (highLeakageCount > 2) {
    leakageLevel = 'HIGH'
  } else if (highLeakageCount > 0 || medLeakageCount > 3) {
    leakageLevel = 'MED'
  }

  // Convergence state: analyze recent session metrics
  const recentMetrics = loadRecentSessionMetrics(7)
  const convergenceState = calculateConvergenceState(recentMetrics)

  return {
    loopCompletion,
    leakageLevel,
    convergenceState,
  }
}

/**
 * Load recent session metrics
 */
export function loadRecentSessionMetrics(days: number): SessionMetrics[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem('session-metrics')
  if (!stored) return []

  try {
    const allMetrics: SessionMetrics[] = JSON.parse(stored)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return allMetrics.filter((m) => new Date(m.date) >= cutoffDate)
  } catch {
    return []
  }
}

/**
 * Calculate convergence state based on session trends
 */
function calculateConvergenceState(metrics: SessionMetrics[]): 'STABLE' | 'DIVERGING' | 'CONVERGING' {
  if (metrics.length < 3) return 'STABLE'

  const recent = metrics.slice(-3)
  const baseline = metrics.slice(0, -3)

  if (baseline.length === 0) return 'STABLE'

  const avgRecentLength = recent.reduce((sum, m) => sum + m.sessionLength, 0) / recent.length
  const avgBaselineLength = baseline.reduce((sum, m) => sum + m.sessionLength, 0) / baseline.length
  const lengthChange = (avgRecentLength - avgBaselineLength) / avgBaselineLength

  const avgRecentCompletion = recent.reduce((sum, m) => sum + m.completionRate, 0) / recent.length
  const avgBaselineCompletion = baseline.reduce((sum, m) => sum + m.completionRate, 0) / baseline.length
  const completionChange = (avgRecentCompletion - avgBaselineCompletion) / avgBaselineCompletion

  // Diverging: significant negative trends
  if (lengthChange < -0.3 || completionChange < -0.2) {
    return 'DIVERGING'
  }

  // Converging: significant positive trends
  if (lengthChange > 0.2 || completionChange > 0.15) {
    return 'CONVERGING'
  }

  return 'STABLE'
}

/**
 * Record a new session metric
 */
export function recordSessionMetric(metric: Omit<SessionMetrics, 'date'>): void {
  if (typeof window === 'undefined') return

  const stored = localStorage.getItem('session-metrics')
  let metrics: SessionMetrics[] = []

  if (stored) {
    try {
      metrics = JSON.parse(stored)
    } catch {
      metrics = []
    }
  }

  const newMetric: SessionMetrics = {
    ...metric,
    date: new Date().toISOString().split('T')[0],
  }

  metrics.push(newMetric)

  // Keep only last 30 days
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30)
  metrics = metrics.filter((m) => new Date(m.date) >= cutoffDate)

  localStorage.setItem('session-metrics', JSON.stringify(metrics))
}

/**
 * Get ASCII progress bar representation
 */
export function getAsciiProgressBar(percentage: number, length = 10): string {
  const filled = Math.round((percentage / 100) * length)
  const empty = length - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}
