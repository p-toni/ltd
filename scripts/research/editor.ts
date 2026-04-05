import type { IngestedSource, VerificationResult } from './types'
import type { InsertionProposal } from './apply'
import type { Piece } from '../../lib/pieces'
import { completeJson } from './openai'

interface EditorResult {
  anchor: string
  insertion: string
}

export async function buildInsertionProposal(
  piece: Piece,
  source: IngestedSource,
  verification: VerificationResult,
  dateLabel: string,
): Promise<InsertionProposal> {
  const systemPrompt =
    'You are a precise copy editor. Create a short insertion-only update for the piece. Output JSON only.'

  const userPrompt = `Piece title: ${piece.title}
Piece content (trimmed):
${piece.content.slice(0, 2000)}

Source title: ${source.title}
Source URL: ${source.url}
Verification summary: ${verification.summary}
Stance: ${verification.stance}
Evidence: ${verification.evidence}
Why it matters: ${verification.whyItMatters}

Return JSON with keys:
- anchor: an exact sentence or phrase copied verbatim from the piece (must appear exactly once)
- insertion: a new paragraph formatted exactly as:
  Update (${dateLabel}): <<=120 words> (Source: ${source.url})

Constraints:
- Do NOT change headings.
- The update must be <= 120 words.
- The insertion must be factual and grounded in the source.
`

  const editorResult = await completeJson<EditorResult>({
    systemPrompt,
    userPrompt,
    maxTokens: 600,
  })

  return {
    anchor: editorResult.anchor,
    insertion: editorResult.insertion,
    citationUrl: source.url,
    citationTitle: source.title,
    stance: verification.stance,
    sourceSummary: verification.summary,
    evidenceSnippet: verification.evidence,
    whyItMatters: verification.whyItMatters,
  }
}
