import type { IngestedSource, VerificationResult } from './types'
import type { Piece } from '../../lib/pieces'
import { completeJson } from './openai'

const STOPWORDS = new Set([
  'about', 'after', 'again', 'against', 'almost', 'also', 'although', 'always', 'among', 'another', 'because', 'before',
  'being', 'below', 'between', 'both', 'cannot', 'could', 'does', 'doing', 'down', 'during', 'each', 'either', 'enough',
  'every', 'first', 'from', 'further', 'having', 'here', 'into', 'just', 'might', 'more', 'most', 'other', 'ours',
  'over', 'same', 'since', 'some', 'such', 'than', 'that', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'under', 'until', 'very', 'what', 'when', 'where', 'which', 'while', 'with', 'without', 'would',
  'your', 'yours', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'was', 'were', 'have', 'has', 'had', 'will', 'shall',
  'can', 'could', 'should', 'may', 'might', 'must', 'our', 'its', 'it', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'as',
])

function extractAnchors(piece: Piece) {
  const source = `${piece.title} ${piece.excerpt} ${piece.content}`
  const tokens = source
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length >= 4 && !STOPWORDS.has(token))

  const unique = new Set<string>()
  const anchors: string[] = []

  for (const token of tokens) {
    if (unique.has(token)) continue
    unique.add(token)
    anchors.push(token)
    if (anchors.length >= 12) break
  }

  return anchors
}

export async function verifySource(piece: Piece, source: IngestedSource) {
  const systemPrompt =
    'You are a research verifier. Judge if the source supports, extends, or contradicts the piece. Output JSON only.'

  const anchors = extractAnchors(piece)

  const userPrompt = `Piece title: ${piece.title}
Piece excerpt: ${piece.excerpt}
Piece content (trimmed):
${piece.content.slice(0, 1600)}
Anchor terms (must be present in the source to qualify): ${anchors.join(', ') || 'none'}

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

Only recommend insert when the source adds material value to the piece. Use confidence >= 0.65 to insert.

Additional rules:
- If the source is generic (e.g., broad methodology/intro guides) and does not mention anchor terms, recommend "skip".
- Only insert if the source directly references a named entity, project, claim, or concept from the piece.
`

  return completeJson<VerificationResult>({
    systemPrompt,
    userPrompt,
    maxTokens: 700,
  })
}
