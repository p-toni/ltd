export type Stance = 'support' | 'extend' | 'contradict'

export interface InsertionProposal {
  anchor: string
  insertion: string
  citationUrl: string
  citationTitle: string
  stance: Stance
  sourceSummary?: string
  evidenceSnippet?: string
  whyItMatters?: string
}

export interface ApplyInsertionResult {
  proposal: InsertionProposal
  applied: boolean
  reason?: string
  content: string
}

const MAX_INSERTION_WORDS = 120
const UPDATE_MARKER_REGEX = /Update \(\d{4}-\d{2}-\d{2}\):/

function countWords(input: string) {
  return input.trim().split(/\s+/).filter(Boolean).length
}

function hasHeading(input: string) {
  return input.split('\n').some((line) => /^#{1,6}\s/.test(line.trim()))
}

function findAnchorCount(content: string, anchor: string) {
  if (!anchor) {
    return 0
  }
  const parts = content.split(anchor)
  return Math.max(0, parts.length - 1)
}

export function validateInsertion(content: string, proposal: InsertionProposal): { valid: boolean; reason?: string } {
  const anchor = proposal.anchor.trim()
  if (!anchor) {
    return { valid: false, reason: 'Anchor is empty' }
  }

  const insertion = proposal.insertion.trim()
  if (!insertion) {
    return { valid: false, reason: 'Insertion text is empty' }
  }

  if (!UPDATE_MARKER_REGEX.test(insertion)) {
    return { valid: false, reason: 'Insertion missing update marker' }
  }

  if (hasHeading(insertion)) {
    return { valid: false, reason: 'Insertion contains heading markup' }
  }

  if (countWords(insertion) > MAX_INSERTION_WORDS) {
    return { valid: false, reason: 'Insertion exceeds word limit' }
  }

  if (proposal.citationUrl && content.includes(proposal.citationUrl)) {
    return { valid: false, reason: 'Source already referenced in content' }
  }

  const anchorCount = findAnchorCount(content, anchor)
  if (anchorCount !== 1) {
    return { valid: false, reason: anchorCount === 0 ? 'Anchor not found' : 'Anchor is not unique' }
  }

  if (content.includes(insertion)) {
    return { valid: false, reason: 'Insertion already present in content' }
  }

  return { valid: true }
}

export function applyInsertion(content: string, proposal: InsertionProposal): ApplyInsertionResult {
  const validation = validateInsertion(content, proposal)
  if (!validation.valid) {
    return {
      proposal,
      applied: false,
      reason: validation.reason,
      content,
    }
  }

  const anchor = proposal.anchor.trim()
  const insertion = proposal.insertion.trim()
  const [before, after] = content.split(anchor)

  const nextContent = `${before}${anchor}\n\n${insertion}\n\n${after.replace(/^\n+/, '')}`

  return {
    proposal,
    applied: true,
    content: nextContent,
  }
}

export function applyInsertions(content: string, proposals: InsertionProposal[]) {
  let nextContent = content
  const results: ApplyInsertionResult[] = []

  proposals.forEach((proposal) => {
    const result = applyInsertion(nextContent, proposal)
    results.push(result)
    if (result.applied) {
      nextContent = result.content
    }
  })

  return { content: nextContent, results }
}
export { MAX_INSERTION_WORDS }
