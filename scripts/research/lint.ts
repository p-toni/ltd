#!/usr/bin/env ts-node
/**
 * Audit the wiki for contradictions, orphans, stale claims, and broken links.
 * Usage: pnpm wiki:lint
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import { config as loadEnv } from 'dotenv'

import { getPieces } from '../../lib/pieces'
import { listWikiPages, loadWikiPage } from './wiki'
import type { WikiPageMeta } from './types'

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: false })
loadEnv({ path: path.resolve(process.cwd(), '.env'), override: false })

interface LintFinding {
  level: 'error' | 'warning' | 'info'
  rule: string
  wikiPageId: string
  message: string
  suggestion?: string
}

const WIKI_ROOT = path.join(process.cwd(), 'content', 'wiki')
const PIECES_DIR = path.join(process.cwd(), 'content', 'pieces')
const LINK_REGEX = /\[([^\]]*)\]\(\/(?:wiki|pieces)\/([\w/-]+)\)/g
const STANCE_REGEX = /\*\*(\w+)\*\*\s*\(confidence:\s*([\d.]+)\)/

// ── Rule: contradiction ─────────────────────────────────────

async function ruleContradiction(sources: WikiPageMeta[]): Promise<LintFinding[]> {
  const findings: LintFinding[] = []

  // Group source pages by shared concept/entity refs via tags
  // Build a map: concept slug -> source pages that reference it
  const conceptToSources = new Map<string, WikiPageMeta[]>()

  for (const src of sources) {
    // We need the full page to read stance from body
    for (const tag of src.tags) {
      const list = conceptToSources.get(tag) ?? []
      list.push(src)
      conceptToSources.set(tag, list)
    }
  }

  // For each concept referenced by 2+ sources, check for stance conflicts
  for (const [concept, srcPages] of conceptToSources) {
    if (srcPages.length < 2) continue

    const stances: Array<{ id: string; stance: string }> = []

    for (const src of srcPages) {
      const page = await loadWikiPage(src.id, 'source')
      if (!page) continue
      const match = page.body.match(STANCE_REGEX)
      if (match) {
        stances.push({ id: src.id, stance: match[1].toLowerCase() })
      }
    }

    const hasSupport = stances.some((s) => s.stance === 'support')
    const hasContradict = stances.some((s) => s.stance === 'contradict')

    if (hasSupport && hasContradict) {
      const supporters = stances.filter((s) => s.stance === 'support').map((s) => s.id)
      const contradictors = stances.filter((s) => s.stance === 'contradict').map((s) => s.id)
      findings.push({
        level: 'warning',
        rule: 'contradiction',
        wikiPageId: concept,
        message: `Contradicting stances on "${concept}": support (${supporters.join(', ')}) vs contradict (${contradictors.join(', ')})`,
        suggestion: 'Review sources and consider adding a reconciliation note to the concept page.',
      })
    }
  }

  return findings
}

// ── Rule: orphaned-page ─────────────────────────────────────

function ruleOrphanedPage(allPages: WikiPageMeta[]): LintFinding[] {
  return allPages
    .filter((p) => p.pieceRefs.length === 0)
    .map((p) => ({
      level: 'warning' as const,
      rule: 'orphaned-page',
      wikiPageId: p.id,
      message: `Wiki page "${p.title}" has no piece references`,
      suggestion: 'Link to a piece or remove if no longer relevant.',
    }))
}

// ── Rule: stale-claim ───────────────────────────────────────

function ruleStaleClaim(sources: WikiPageMeta[], maxAgeDays = 180): LintFinding[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - maxAgeDays)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  return sources
    .filter((s) => s.updatedAt && s.updatedAt < cutoffStr)
    .map((s) => ({
      level: 'info' as const,
      rule: 'stale-claim',
      wikiPageId: s.id,
      message: `Source page "${s.title}" last updated ${s.updatedAt} (>${maxAgeDays} days)`,
      suggestion: 'Consider refreshing with newer sources.',
    }))
}

// ── Rule: broken-link ───────────────────────────────────────

async function ruleBrokenLink(allPages: WikiPageMeta[]): Promise<LintFinding[]> {
  const findings: LintFinding[] = []

  // Build sets of valid targets
  const wikiIds = new Set(allPages.map((p) => `${p.kind}s/${p.id}`))
  let pieceEntries: string[]
  try {
    pieceEntries = await fs.readdir(PIECES_DIR)
  } catch {
    pieceEntries = []
  }
  const pieceSlugs = new Set(
    pieceEntries
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, '')),
  )

  for (const pageMeta of allPages) {
    const page = await loadWikiPage(pageMeta.id, pageMeta.kind)
    if (!page) continue

    let match: RegExpExecArray | null
    LINK_REGEX.lastIndex = 0
    while ((match = LINK_REGEX.exec(page.body)) !== null) {
      const linkPath = match[2]

      // Check /wiki/... links
      if (match[0].includes('/wiki/') && !wikiIds.has(linkPath)) {
        findings.push({
          level: 'error',
          rule: 'broken-link',
          wikiPageId: pageMeta.id,
          message: `Broken wiki link: /wiki/${linkPath}`,
        })
      }

      // Check /pieces/... links
      if (match[0].includes('/pieces/') && !pieceSlugs.has(linkPath)) {
        findings.push({
          level: 'error',
          rule: 'broken-link',
          wikiPageId: pageMeta.id,
          message: `Broken piece link: /pieces/${linkPath}`,
        })
      }
    }
  }

  return findings
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  console.log('[lint] Loading wiki pages...')
  const allPages = await listWikiPages()
  const sources = allPages.filter((p) => p.kind === 'source')

  console.log(`[lint] Found ${allPages.length} wiki pages (${sources.length} sources)`)

  const findings: LintFinding[] = []

  console.log('[lint] Checking contradictions...')
  findings.push(...(await ruleContradiction(sources)))

  console.log('[lint] Checking orphaned pages...')
  findings.push(...ruleOrphanedPage(allPages))

  console.log('[lint] Checking stale claims...')
  findings.push(...ruleStaleClaim(sources))

  console.log('[lint] Checking broken links...')
  findings.push(...(await ruleBrokenLink(allPages)))

  // Report
  const errors = findings.filter((f) => f.level === 'error')
  const warnings = findings.filter((f) => f.level === 'warning')
  const infos = findings.filter((f) => f.level === 'info')

  console.log(`\n[lint] Results: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info`)

  for (const f of findings) {
    const icon = f.level === 'error' ? 'ERR' : f.level === 'warning' ? 'WARN' : 'INFO'
    console.log(`  [${icon}] ${f.rule}: ${f.message}`)
    if (f.suggestion) console.log(`         -> ${f.suggestion}`)
  }

  // Write report
  const reportPath = path.join(WIKI_ROOT, 'lint-report.md')
  const reportLines = [
    '# Wiki Lint Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    `**${errors.length}** errors, **${warnings.length}** warnings, **${infos.length}** info`,
    '',
  ]

  for (const level of ['error', 'warning', 'info'] as const) {
    const group = findings.filter((f) => f.level === level)
    if (group.length === 0) continue
    reportLines.push(`## ${level.charAt(0).toUpperCase() + level.slice(1)}s (${group.length})`)
    reportLines.push('')
    for (const f of group) {
      reportLines.push(`- **${f.rule}** [${f.wikiPageId}]: ${f.message}`)
      if (f.suggestion) reportLines.push(`  - ${f.suggestion}`)
    }
    reportLines.push('')
  }

  await fs.writeFile(reportPath, reportLines.join('\n'), 'utf8')
  console.log(`\n[lint] Report written to ${reportPath}`)

  if (errors.length > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Wiki lint failed:', error)
  process.exit(1)
})
