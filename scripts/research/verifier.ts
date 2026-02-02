import type { IngestedSource, VerificationResult } from './types'
import type { Piece } from '../../lib/pieces'
import { completeJson } from './openai'

export async function verifySource(piece: Piece, source: IngestedSource) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required to verify sources.')
  }

  const systemPrompt =
    'You are a research verifier. Judge if the source supports, extends, or contradicts the piece. Output JSON only.'

  const userPrompt = `Piece title: ${piece.title}
Piece excerpt: ${piece.excerpt}
Piece content (trimmed):
${piece.content.slice(0, 1600)}

Source title: ${source.title}
Source publisher: ${source.publisher}
Source publishedAt: ${source.publishedAt ?? 'unknown'}
Source content (trimmed):
${source.contentText.slice(0, 1600)}

Return JSON with keys:
- stance: support | extend | contradict
- confidence: number (0-1)
- summary: 1-2 sentences
- evidence: short quoted snippet (max 20 words)
- whyItMatters: short sentence
- recommendedUpdate: insert | skip

Only recommend insert when the source adds material value to the piece. Use confidence >= 0.65 to insert.`

  return completeJson<VerificationResult>({
    apiKey,
    systemPrompt,
    userPrompt,
    maxTokens: 700,
  })
}
