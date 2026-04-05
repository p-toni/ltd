import type { IngestedSource, RewriteResult } from './types'
import type { Piece } from '../../lib/pieces'
import { completeJson } from './openai'

export async function buildRewrite(
  piece: Piece,
  sources: IngestedSource[],
  intent: string,
  scope: string,
): Promise<RewriteResult> {
  const systemPrompt =
    'You are a senior editor. Rewrite the piece using the sources. Output JSON only.'

  const sourceSummaries = sources
    .map((source, index) => {
      return `Source ${index + 1}: ${source.title} (${source.url})\n${source.contentText.slice(0, 1200)}`
    })
    .join('\n\n')

  const userPrompt = `Rewrite intent: ${intent}
Scope: ${scope}

Original piece title: ${piece.title}
Original excerpt: ${piece.excerpt}
Original content:\n${piece.content.slice(0, 3000)}

Sources:\n${sourceSummaries}

Return JSON with keys:
- summary: short summary of the rewrite
- riskAssessment: risks or caveats
- rationale: why the rewrite is necessary
- newContent: full markdown content (no frontmatter)

Constraints:
- Keep the tone consistent with the original.
- Use citations inline as "(Source: <URL>)" when adding new factual claims.
- Do not add headings unless absolutely necessary.
`

  return completeJson<RewriteResult>({
    systemPrompt,
    userPrompt,
    maxTokens: 1200,
  })
}
