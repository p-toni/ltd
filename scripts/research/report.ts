import fs from 'node:fs/promises'
import path from 'node:path'

import type { Piece } from '../../lib/pieces'
import type { ApplyInsertionResult, InsertionProposal } from './apply'
import type { RewriteResult } from './types'

function formatSection(label: string, value: string) {
  return `**${label}:** ${value}`
}

export async function writeDailyReport(params: {
  piece: Piece
  dateLabel: string
  outputDir: string
  proposals: InsertionProposal[]
  results: ApplyInsertionResult[]
}) {
  const { piece, dateLabel, outputDir, proposals, results } = params
  if (!proposals.length) {
    return null
  }

  const filename = `${piece.slug}-${Date.now()}.md`
  const reportPath = path.join(outputDir, filename)

  const lines: string[] = []
  lines.push(`# Research Updates · ${dateLabel}`)
  lines.push(formatSection('Piece', `[#${String(piece.id).padStart(3, '0')}] ${piece.title}`))
  lines.push(formatSection('Slug', piece.slug))
  lines.push(formatSection('Total proposals', String(proposals.length)))
  lines.push('')

  results.forEach((result, index) => {
    const proposal = result.proposal
    lines.push(`## Update ${index + 1}`)
    lines.push(formatSection('Stance', proposal.stance))
    lines.push(formatSection('Source', proposal.citationUrl))
    lines.push(formatSection('Title', proposal.citationTitle))
    if (proposal.sourceSummary) {
      lines.push(formatSection('Summary', proposal.sourceSummary))
    }
    if (proposal.evidenceSnippet) {
      lines.push(formatSection('Evidence', proposal.evidenceSnippet))
    }
    if (proposal.whyItMatters) {
      lines.push(formatSection('Why it matters', proposal.whyItMatters))
    }
    lines.push(formatSection('Applied', result.applied ? 'yes' : `no (${result.reason ?? 'unknown'})`))
    lines.push('')
    lines.push('Proposed insertion:')
    lines.push('')
    lines.push('```')
    lines.push(proposal.insertion.trim())
    lines.push('```')
    lines.push('')
  })

  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(reportPath, lines.join('\n'), 'utf8')

  return reportPath
}

export async function writeRewriteReport(params: {
  piece: Piece
  dateLabel: string
  outputDir: string
  sources: string[]
  rewrite: RewriteResult
}) {
  const { piece, dateLabel, outputDir, sources, rewrite } = params
  const filename = `${piece.slug}-rewrite-${Date.now()}.md`
  const reportPath = path.join(outputDir, filename)

  const lines: string[] = []
  lines.push(`# Rewrite Proposal · ${dateLabel}`)
  lines.push(formatSection('Piece', `[#${String(piece.id).padStart(3, '0')}] ${piece.title}`))
  lines.push(formatSection('Slug', piece.slug))
  lines.push(formatSection('Sources', String(sources.length)))
  lines.push('')

  lines.push('## Summary')
  lines.push(rewrite.summary)
  lines.push('')
  lines.push('## Risk Assessment')
  lines.push(rewrite.riskAssessment)
  lines.push('')
  lines.push('## Rationale')
  lines.push(rewrite.rationale)
  lines.push('')
  lines.push('## Sources')
  sources.forEach((source) => lines.push(`- ${source}`))

  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(reportPath, lines.join('\n'), 'utf8')

  return reportPath
}
