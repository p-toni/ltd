'use client'

/**
 * Cognitive Load Indicators
 * Shows paragraph complexity in left margin:
 * - Word count density
 * - Tooltip density
 * - Sentence complexity
 */

interface CognitiveLoadIndicatorProps {
  wordCount: number
  tooltipCount: number
  sentenceCount: number
  className?: string
}

export function CognitiveLoadIndicator({
  wordCount,
  tooltipCount,
  sentenceCount,
  className = '',
}: CognitiveLoadIndicatorProps) {
  // Calculate metrics
  const wordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0
  const tooltipDensity = wordCount > 0 ? tooltipCount / (wordCount / 100) : 0

  // Determine complexity level (0-5 dots)
  let complexity = 0

  // Word count contribution (0-2 dots)
  if (wordCount > 150) complexity += 2
  else if (wordCount > 80) complexity += 1

  // Sentence length contribution (0-2 dots)
  if (wordsPerSentence > 25) complexity += 2
  else if (wordsPerSentence > 18) complexity += 1

  // Tooltip density contribution (0-1 dot)
  if (tooltipDensity > 3) complexity += 1

  // Cap at 5
  complexity = Math.min(complexity, 5)

  // Color based on complexity
  const getColor = () => {
    if (complexity >= 4) return 'bg-[var(--divergent)]' // red-orange: very high
    if (complexity >= 3) return 'bg-[var(--te-orange)]' // orange: high
    if (complexity >= 2) return 'bg-[var(--neutral-loop)]' // muted: medium
    return 'bg-[var(--convergent)]' // green: low
  }

  const color = getColor()

  return (
    <div className={`flex items-center gap-0.5 ${className}`} title={`Complexity: ${complexity}/5\nWords: ${wordCount}\nTooltips: ${tooltipCount}\nAvg sentence: ${Math.round(wordsPerSentence)}w`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-1 rounded-sm ${i < complexity ? color : 'bg-muted/20'}`}
        />
      ))}
    </div>
  )
}

/**
 * Enhanced paragraph wrapper that shows cognitive load in margin
 */
interface ParagraphWithLoadProps {
  children: React.ReactNode
  text: string
  className?: string
}

export function ParagraphWithLoad({ children, text, className = '' }: ParagraphWithLoadProps) {
  // Parse paragraph metrics
  const wordCount = text.split(/\s+/).length
  const sentenceCount = (text.match(/[.!?]+/g) || []).length
  const tooltipCount = (text.match(/\[([^\]]+)\]\^\[([^\]]+)\]/g) || []).length

  return (
    <div className={`group relative ${className}`}>
      {/* Cognitive load indicator in left margin */}
      <div className="absolute -left-8 top-1 opacity-0 transition-opacity group-hover:opacity-100">
        <CognitiveLoadIndicator
          wordCount={wordCount}
          tooltipCount={tooltipCount}
          sentenceCount={sentenceCount}
        />
      </div>

      {/* Orange dot if tooltip-heavy */}
      {tooltipCount > 2 && (
        <div
          className="absolute -left-3 top-2 h-1.5 w-1.5 rounded-full bg-[var(--te-orange)]"
          title={`${tooltipCount} tooltips in this paragraph`}
        />
      )}

      {children}
    </div>
  )
}
