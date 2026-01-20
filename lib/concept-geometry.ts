import type { Piece } from './pieces'

export interface ConceptDistance {
  distance: number // 0 = identical, 1 = completely different
  factors: {
    moodSimilarity: number
    contentSimilarity: number
    citationBonus: number
    temporalSimilarity: number
  }
}

export interface Connection {
  source: number
  target: number
  strength: number // 0-1, where 1 = strongest
  type: 'motorway' | 'primary' | 'secondary' | 'tertiary' | 'residential'
}

/**
 * Calculate Jaccard similarity between two arrays
 */
function calculateJaccardSimilarity(arr1: any[], arr2: any[]): number {
  const set1 = new Set(arr1)
  const set2 = new Set(arr2)
  const intersection = new Set([...set1].filter((x) => set2.has(x)))
  const union = new Set([...set1, ...set2])
  return union.size === 0 ? 0 : intersection.size / union.size
}

/**
 * Extract words from content for similarity calculation
 */
function extractWords(content: string): string[] {
  return content.toLowerCase().match(/\b\w+\b/g) ?? []
}

/**
 * Calculate conceptual distance between two pieces
 * Returns 0 for identical, 1 for completely different
 */
export function calculateConceptDistance(piece1: Piece, piece2: Piece): ConceptDistance {
  // Factor 1: Mood overlap (Jaccard similarity)
  const moodSimilarity = calculateJaccardSimilarity(piece1.mood, piece2.mood)

  // Factor 2: Content similarity (word overlap as proxy for TF-IDF)
  const words1 = new Set(extractWords(piece1.content))
  const words2 = new Set(extractWords(piece2.content))
  const contentSimilarity = calculateJaccardSimilarity(Array.from(words1), Array.from(words2))

  // Factor 3: Citation relationship (direct citation = high similarity)
  const hasCitation =
    (piece1.citations && piece1.citations.includes(piece2.id)) ||
    (piece2.citations && piece2.citations.includes(piece1.id))
  const citationBonus = hasCitation ? 0.9 : 0

  // Factor 4: Temporal proximity (closer in time = more similar context)
  const daysDiff =
    Math.abs(new Date(piece1.date).getTime() - new Date(piece2.date).getTime()) / (1000 * 60 * 60 * 24)
  const temporalSimilarity = Math.max(0, 1 - daysDiff / 180) // decay over 6 months

  // Weighted combination
  const similarity =
    moodSimilarity * 0.3 + contentSimilarity * 0.3 + citationBonus * 0.3 + temporalSimilarity * 0.1

  return {
    distance: 1 - similarity, // invert to distance
    factors: {
      moodSimilarity,
      contentSimilarity,
      citationBonus,
      temporalSimilarity,
    },
  }
}

/**
 * Calculate connection strength and type between two pieces
 */
export function getConnectionStrength(piece1: Piece, piece2: Piece): Connection {
  const { distance, factors } = calculateConceptDistance(piece1, piece2)
  const similarity = 1 - distance

  // Direct citation = motorway (strongest)
  if (factors.citationBonus > 0) {
    return {
      source: piece1.id,
      target: piece2.id,
      strength: 1.0,
      type: 'motorway',
    }
  }

  // High similarity = primary
  if (similarity > 0.7) {
    return {
      source: piece1.id,
      target: piece2.id,
      strength: 0.8,
      type: 'primary',
    }
  }

  // Medium similarity = secondary
  if (similarity > 0.5) {
    return {
      source: piece1.id,
      target: piece2.id,
      strength: 0.6,
      type: 'secondary',
    }
  }

  // Low similarity = tertiary
  if (similarity > 0.3) {
    return {
      source: piece1.id,
      target: piece2.id,
      strength: 0.4,
      type: 'tertiary',
    }
  }

  // Very low similarity = residential (weakest)
  return {
    source: piece1.id,
    target: piece2.id,
    strength: 0.2,
    type: 'residential',
  }
}

/**
 * Generate all connections between pieces above a similarity threshold
 */
export function generateConnections(pieces: Piece[], minSimilarity = 0.3): Connection[] {
  const connections: Connection[] = []

  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      const connection = getConnectionStrength(pieces[i], pieces[j])

      // Only include connections above minimum similarity threshold
      if (connection.strength >= minSimilarity / 2) {
        connections.push(connection)
      }
    }
  }

  return connections
}

/**
 * Get visual styling for connection type
 */
export function getConnectionStyle(connection: Connection): {
  lineWidth: number
  opacity: number
  color: string
} {
  const lineWidth = connection.strength * 2
  const opacity = 0.3 + connection.strength * 0.4

  let color = 'var(--connection-weak)'
  if (connection.type === 'motorway') {
    color = 'var(--connection-strong)'
  } else if (connection.type === 'primary') {
    color = 'var(--connection-primary)'
  } else if (connection.type === 'secondary') {
    color = 'var(--connection-secondary)'
  }

  return { lineWidth, opacity, color }
}

/**
 * Calculate node radius based on piece characteristics
 */
export function getNodeRadius(piece: Piece): number {
  // Radius based on square root of word count (so area is proportional)
  const baseRadius = Math.sqrt(piece.wordCount / 100)
  return Math.max(8, Math.min(baseRadius, 30)) // clamp between 8 and 30
}
