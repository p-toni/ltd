import type { Piece } from '@/lib/pieces'
import { loadAllLoopStates } from '@/lib/loop-tracking'

/**
 * Concept Velocity: Rate of knowledge building and compounding
 * Measures how quickly new pieces build on existing knowledge
 */

export interface ConceptVelocityMetrics {
  citationDensity: number // total citations / pieces
  reentryRate: number // avg visits per piece
  clusterFormation: 'POOR' | 'FORMING' | 'STABLE' | 'EXCELLENT'
  velocityTrend: 'DECELERATING' | 'STABLE' | 'ACCELERATING'
  topPieces: Array<{ id: number; visits: number }>
  compoundingScore: number // 0-1
}

/**
 * Calculate re-entry frequency from loop tracking data
 */
function calculateReentryFrequency(): Map<number, number> {
  const reentryMap = new Map<number, number>()
  const allStates = loadAllLoopStates()

  for (const state of allStates) {
    // Use return visits from feedback stage
    const visits = state.stages.feedback.returnVisits + 1 // +1 for initial visit
    reentryMap.set(state.pieceId, visits)
  }

  return reentryMap
}

/**
 * Calculate concept velocity metrics
 */
export function calculateConceptVelocity(pieces: Piece[]): ConceptVelocityMetrics {
  // Citation density
  const totalCitations = pieces.reduce((sum, p) => sum + (p.citations?.length ?? 0), 0)
  const citationDensity = pieces.length > 0 ? totalCitations / pieces.length : 0

  // Re-entry rate
  const reentryMap = calculateReentryFrequency()
  const totalVisits = Array.from(reentryMap.values()).reduce((sum, v) => sum + v, 0)
  const reentryRate = reentryMap.size > 0 ? totalVisits / reentryMap.size : 0

  // Top pieces by visits
  const topPieces = Array.from(reentryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, visits]) => ({ id, visits }))

  // Cluster formation (based on citation density)
  let clusterFormation: 'POOR' | 'FORMING' | 'STABLE' | 'EXCELLENT'
  if (citationDensity >= 2.0) clusterFormation = 'EXCELLENT'
  else if (citationDensity >= 1.5) clusterFormation = 'STABLE'
  else if (citationDensity >= 0.8) clusterFormation = 'FORMING'
  else clusterFormation = 'POOR'

  // Velocity trend (requires temporal analysis)
  // For now, use citation density as proxy
  let velocityTrend: 'DECELERATING' | 'STABLE' | 'ACCELERATING'
  if (citationDensity >= 1.5) velocityTrend = 'ACCELERATING'
  else if (citationDensity >= 0.8) velocityTrend = 'STABLE'
  else velocityTrend = 'DECELERATING'

  // Compounding score (0-1)
  const citationScore = Math.min(citationDensity / 2.0, 1)
  const reentryScore = Math.min(reentryRate / 5.0, 1)
  const compoundingScore = (citationScore * 0.6 + reentryScore * 0.4)

  return {
    citationDensity: Math.round(citationDensity * 10) / 10,
    reentryRate: Math.round(reentryRate * 10) / 10,
    clusterFormation,
    velocityTrend,
    topPieces,
    compoundingScore: Math.round(compoundingScore * 100) / 100,
  }
}

/**
 * Get human-readable velocity description
 */
export function getVelocityDescription(metrics: ConceptVelocityMetrics): string {
  switch (metrics.velocityTrend) {
    case 'ACCELERATING':
      return 'New pieces are building on existing knowledge at an increasing rate. Your knowledge graph is compounding.'
    case 'STABLE':
      return 'New pieces maintain consistent connections to existing knowledge. Your learning pace is sustainable.'
    case 'DECELERATING':
      return 'New pieces have fewer connections. Consider revisiting foundational pieces or adding more cross-references.'
  }
}

/**
 * Identify mental map centers (hub pieces)
 */
export function identifyHubs(metrics: ConceptVelocityMetrics, pieces: Piece[]): Array<{ piece: Piece; hubScore: number }> {
  const hubs: Array<{ piece: Piece; hubScore: number }> = []

  for (const piece of pieces) {
    // Hub score = citations + re-entry frequency
    const citationCount = pieces.filter((p) => p.citations?.includes(piece.id)).length
    const reentryCount = metrics.topPieces.find((t) => t.id === piece.id)?.visits ?? 0

    const hubScore = citationCount * 0.6 + reentryCount * 0.4

    if (hubScore > 2) {
      hubs.push({ piece, hubScore })
    }
  }

  return hubs.sort((a, b) => b.hubScore - a.hubScore)
}
