import type { Piece } from '@/lib/pieces'

/**
 * Epiplexity: A measure of extractable structure for bounded observers
 * Based on prequential coding - area under the loss curve
 *
 * Proxy formula combines:
 * - Structural clarity (tooltips, citations)
 * - Information density (word count, vocabulary)
 * - Multi-dimensionality (mood complexity)
 * - Temporal context (recency)
 */

export interface EpiplexityMetrics {
  raw: number // 0-1, overall epiplexity score
  tooltipDensity: number // tooltips per 100 words
  citationDensity: number // citations per 1000 words
  informationContent: number // normalized word count
  moodComplexity: number // number of moods / 4
  vocabularyRichness: number // unique words ratio
  extractability: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  estimatedReadTime: number // minutes (adjusted for density)
}

/**
 * Calculate unique words ratio (vocabulary richness)
 */
function calculateUniqueWordsRatio(content: string): number {
  const words = content.toLowerCase().match(/\b\w+\b/g) ?? []
  if (words.length === 0) return 0

  const uniqueWords = new Set(words)
  return uniqueWords.size / words.length
}

/**
 * Count tooltips in markdown content
 */
function countTooltips(content: string): number {
  // Count [term]^[definition] pattern
  const tooltipPattern = /\[([^\]]+)\]\^\[([^\]]+)\]/g
  const matches = content.match(tooltipPattern)
  return matches ? matches.length : 0
}

/**
 * Estimate epiplexity for a piece
 */
export function estimateEpiplexity(piece: Piece): EpiplexityMetrics {
  const { content, wordCount, citations, mood } = piece

  // Factor 1: Tooltip density (explicit structure)
  const tooltipCount = countTooltips(content)
  const tooltipDensity = (tooltipCount / (wordCount / 100)) // per 100 words
  const tooltipScore = Math.min(tooltipDensity / 5, 1) // cap at 5 per 100 words

  // Factor 2: Citation density (conceptual links)
  const citationCount = citations?.length ?? 0
  const citationDensity = (citationCount / (wordCount / 1000)) // per 1000 words
  const citationScore = Math.min(citationDensity / 10, 1) // cap at 10 per 1000 words

  // Factor 3: Information content (word count)
  const informationContent = Math.min(wordCount / 3000, 1) // cap at 3000 words
  const informationScore = informationContent

  // Factor 4: Mood complexity (multi-dimensionality)
  const moodCount = mood.length
  const moodComplexity = moodCount / 4 // max 4 moods
  const moodScore = moodComplexity

  // Factor 5: Vocabulary richness (unique words)
  const vocabularyRichness = calculateUniqueWordsRatio(content)
  const vocabularyScore = vocabularyRichness

  // Weighted combination (sum = 1.0)
  const rawScore =
    tooltipScore * 0.3 +
    citationScore * 0.2 +
    informationScore * 0.2 +
    moodScore * 0.15 +
    vocabularyScore * 0.15

  // Classify extractability
  let extractability: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  if (rawScore >= 0.8) extractability = 'VERY_HIGH'
  else if (rawScore >= 0.6) extractability = 'HIGH'
  else if (rawScore >= 0.4) extractability = 'MEDIUM'
  else extractability = 'LOW'

  // Estimate read time (adjusted for density)
  // Base: 200 words/min
  // Adjust for tooltip density: +10% per tooltip per 100 words
  // Adjust for citation density: +5% per citation per 1000 words
  const baseMinutes = wordCount / 200
  const tooltipAdjustment = 1 + tooltipDensity * 0.1
  const citationAdjustment = 1 + citationDensity * 0.05
  const estimatedReadTime = Math.round(baseMinutes * tooltipAdjustment * citationAdjustment)

  return {
    raw: Math.round(rawScore * 100) / 100,
    tooltipDensity: Math.round(tooltipDensity * 10) / 10,
    citationDensity: Math.round(citationDensity * 10) / 10,
    informationContent: Math.round(informationContent * 100) / 100,
    moodComplexity: Math.round(moodComplexity * 100) / 100,
    vocabularyRichness: Math.round(vocabularyRichness * 100) / 100,
    extractability,
    estimatedReadTime,
  }
}

/**
 * Get human-readable epiplexity description
 */
export function getEpiplexityDescription(metrics: EpiplexityMetrics): string {
  const { raw, extractability } = metrics

  switch (extractability) {
    case 'VERY_HIGH':
      return `Very high structural clarity (${raw}). Rich explicit structure with tooltips and citations. Optimal for focused extraction.`
    case 'HIGH':
      return `High extractability (${raw}). Good structural support with citations and clear organization. Well-suited for learning.`
    case 'MEDIUM':
      return `Moderate extractability (${raw}). Some structural support. May benefit from multiple passes or note-taking.`
    case 'LOW':
      return `Lower extractability (${raw}). Less explicit structure. Consider slower reading or external references.`
  }
}

/**
 * Compare epiplexity between two pieces
 */
export function compareEpiplexity(
  piece1Metrics: EpiplexityMetrics,
  piece2Metrics: EpiplexityMetrics,
): {
  easier: 'piece1' | 'piece2' | 'equal'
  difference: number
  recommendation: string
} {
  const diff = Math.abs(piece1Metrics.raw - piece2Metrics.raw)

  if (diff < 0.1) {
    return {
      easier: 'equal',
      difference: diff,
      recommendation: 'Similar extractability. Choose based on interest or mood.',
    }
  }

  const easier = piece1Metrics.raw > piece2Metrics.raw ? 'piece1' : 'piece2'
  const easierName = easier === 'piece1' ? 'first' : 'second'

  return {
    easier,
    difference: diff,
    recommendation: `The ${easierName} piece has ${(diff * 100).toFixed(0)}% more extractable structure. Consider starting there if energy is limited.`,
  }
}

/**
 * Calculate optimal reading conditions based on epiplexity
 */
export function getOptimalReadingConditions(metrics: EpiplexityMetrics): {
  recommendedEnergy: 'LOW' | 'MEDIUM' | 'HIGH'
  recommendedMode: 'continuous' | 'fragment'
  recommendedSessionLength: number // minutes
  warnings: string[]
} {
  const warnings: string[] = []
  let recommendedEnergy: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  let recommendedMode: 'continuous' | 'fragment' = 'continuous'
  let recommendedSessionLength = metrics.estimatedReadTime

  // High density = needs high energy
  if (metrics.tooltipDensity > 4) {
    recommendedEnergy = 'HIGH'
    warnings.push('High tooltip density - requires focused attention')
  }

  // Long + dense = fragment mode
  if (metrics.informationContent > 0.7 && metrics.raw > 0.6) {
    recommendedMode = 'fragment'
    warnings.push('Long and dense - consider fragment mode for better retention')
  }

  // Very high epiplexity = break into chunks
  if (metrics.raw > 0.8 && metrics.estimatedReadTime > 10) {
    recommendedSessionLength = Math.ceil(metrics.estimatedReadTime / 2)
    warnings.push(`Consider splitting into ${Math.ceil(metrics.estimatedReadTime / recommendedSessionLength)} sessions`)
  }

  // Low vocabulary richness = easier
  if (metrics.vocabularyRichness < 0.4) {
    recommendedEnergy = 'LOW'
  }

  return {
    recommendedEnergy,
    recommendedMode,
    recommendedSessionLength,
    warnings,
  }
}
