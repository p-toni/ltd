/**
 * Post-pipeline wiki review digest.
 *
 * Scans content/wiki/ for pages with `status: draft`, composes a plain-text
 * + minimal-HTML email listing each one with signed Keep/Discard links, and
 * sends it via Resend. Intended to be triggered by a daily Vercel cron after
 * the research pipeline has committed its new pages.
 *
 * Usage (CLI): pnpm tsx scripts/research/digest.ts
 * Usage (cron): import { runDigest } from this module
 */

import path from 'node:path'

import { config as loadEnv } from 'dotenv'

import { listWikiPages, loadWikiPage } from './wiki'
import { signReviewToken, type ReviewAction } from './review-token'
import type { WikiPage, WikiPageKind, WikiPageMeta } from './types'

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: false })
loadEnv({ path: path.resolve(process.cwd(), '.env'), override: false })

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days
const DIVIDER = '────────────────────────────────────────'

export interface DigestRunResult {
  scanned: number
  drafts: number
  sent: boolean
  skippedReason?: string
}

interface DigestEnv {
  resendApiKey: string
  reviewEmailTo: string
  reviewEmailFrom: string
  reviewSecret: string
  siteUrl: string
}

function readEnv(): DigestEnv | { error: string } {
  const resendApiKey = process.env.RESEND_API_KEY
  const reviewEmailTo = process.env.REVIEW_EMAIL_TO
  const reviewSecret = process.env.REVIEW_SECRET
  const siteUrl = process.env.SITE_URL

  if (!resendApiKey) return { error: 'RESEND_API_KEY is not set' }
  if (!reviewEmailTo) return { error: 'REVIEW_EMAIL_TO is not set' }
  if (!reviewSecret) return { error: 'REVIEW_SECRET is not set' }
  if (!siteUrl) return { error: 'SITE_URL is not set' }

  return {
    resendApiKey,
    reviewEmailTo,
    reviewSecret,
    siteUrl: siteUrl.replace(/\/$/, ''),
    reviewEmailFrom: process.env.REVIEW_EMAIL_FROM ?? 'onboarding@resend.dev',
  }
}

// ── Body section parsing ────────────────────────────────────

interface ParsedSections {
  summary: string
  stance: string | null
  evidence: string | null
  connections: string[]
}

function parseSections(body: string): ParsedSections {
  const sections: Record<string, string> = {}
  const headingRegex = /^##\s+(.+)$/gm
  const matches: Array<{ heading: string; start: number; contentStart: number }> = []
  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(body)) !== null) {
    matches.push({ heading: match[1].trim(), start: match.index, contentStart: match.index + match[0].length })
  }
  matches.forEach((m, index) => {
    const end = index + 1 < matches.length ? matches[index + 1].start : body.length
    sections[m.heading.toLowerCase()] = body.slice(m.contentStart, end).trim()
  })

  const connections = (sections.connections ?? '')
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean)

  return {
    summary: sections.summary ?? '',
    stance: sections.stance ?? null,
    evidence: sections.evidence ?? null,
    connections,
  }
}

// ── Email building ──────────────────────────────────────────

function buildReviewUrl(meta: WikiPageMeta, action: ReviewAction, env: DigestEnv, nowSeconds: number): string {
  const token = signReviewToken(
    {
      pageId: meta.id,
      kind: meta.kind,
      action,
      exp: nowSeconds + TOKEN_TTL_SECONDS,
    },
    env.reviewSecret,
  )
  return `${env.siteUrl}/api/wiki/review?t=${token}`
}

function truncate(value: string, limit = 280): string {
  const flat = value.replace(/\s+/g, ' ').trim()
  return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildEntryText(page: WikiPage, keepUrl: string, discardUrl: string): string {
  const sections = parseSections(page.body)
  const lines = [
    DIVIDER,
    `${page.meta.kind.toUpperCase()}  ·  ${page.meta.title}`,
    DIVIDER,
  ]
  if (sections.summary) lines.push(truncate(sections.summary), '')
  if (sections.evidence) lines.push(`Evidence: ${truncate(sections.evidence, 200)}`, '')
  if (sections.stance) lines.push(`Stance: ${truncate(sections.stance, 120)}`, '')
  if (page.meta.pieceRefs.length) lines.push(`Pieces: ${page.meta.pieceRefs.join(', ')}`, '')
  if (page.meta.sourceUrls.length) lines.push(`Source: ${page.meta.sourceUrls[0]}`, '')
  lines.push(`Keep:    ${keepUrl}`)
  lines.push(`Discard: ${discardUrl}`)
  lines.push('')
  return lines.join('\n')
}

function buildEntryHtml(page: WikiPage, keepUrl: string, discardUrl: string): string {
  const sections = parseSections(page.body)
  const parts: string[] = []
  parts.push(
    `<div style="border-top:1px solid #ddd;padding:16px 0;">`,
    `<div style="font-family:monospace;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(page.meta.kind)} · ${escapeHtml(page.meta.id)}</div>`,
    `<h3 style="margin:4px 0 8px 0;font-size:18px;">${escapeHtml(page.meta.title)}</h3>`,
  )
  if (sections.summary) parts.push(`<p style="margin:8px 0;color:#333;">${escapeHtml(truncate(sections.summary))}</p>`)
  if (sections.evidence) parts.push(`<p style="margin:8px 0;color:#555;font-size:14px;"><strong>Evidence:</strong> ${escapeHtml(truncate(sections.evidence, 200))}</p>`)
  if (sections.stance) parts.push(`<p style="margin:8px 0;color:#555;font-size:14px;"><strong>Stance:</strong> ${escapeHtml(truncate(sections.stance, 120))}</p>`)
  if (page.meta.pieceRefs.length) parts.push(`<p style="margin:8px 0;color:#555;font-size:14px;"><strong>Pieces:</strong> ${escapeHtml(page.meta.pieceRefs.join(', '))}</p>`)
  if (page.meta.sourceUrls.length) {
    const url = page.meta.sourceUrls[0]
    parts.push(`<p style="margin:8px 0;font-size:14px;"><strong>Source:</strong> <a href="${escapeHtml(url)}" style="color:#0366d6;">${escapeHtml(url)}</a></p>`)
  }
  parts.push(
    `<p style="margin:12px 0 0 0;">`,
    `<a href="${escapeHtml(keepUrl)}" style="display:inline-block;padding:8px 14px;background:#0366d6;color:#fff;text-decoration:none;font-family:monospace;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-right:8px;">Keep</a>`,
    `<a href="${escapeHtml(discardUrl)}" style="display:inline-block;padding:8px 14px;background:#666;color:#fff;text-decoration:none;font-family:monospace;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Discard</a>`,
    `</p>`,
    `</div>`,
  )
  return parts.join('')
}

// ── Resend send ─────────────────────────────────────────────

interface ResendErrorResponse {
  message?: string
  name?: string
}

async function sendEmail(env: DigestEnv, subject: string, text: string, html: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.reviewEmailFrom,
      to: [env.reviewEmailTo],
      subject,
      text,
      html,
    }),
  })

  if (!response.ok) {
    let detail = ''
    try {
      const data = (await response.json()) as ResendErrorResponse
      detail = data.message ?? data.name ?? ''
    } catch {
      // ignore
    }
    throw new Error(`Resend send failed: ${response.status} ${detail}`.trim())
  }
}

// ── Public API ──────────────────────────────────────────────

export async function runDigest(): Promise<DigestRunResult> {
  const envOrError = readEnv()
  if ('error' in envOrError) {
    return { scanned: 0, drafts: 0, sent: false, skippedReason: envOrError.error }
  }
  const env = envOrError

  const all = await listWikiPages()
  const drafts = all.filter((meta) => meta.status === 'draft')

  if (drafts.length === 0) {
    return { scanned: all.length, drafts: 0, sent: false, skippedReason: 'no drafts' }
  }

  // Stable order: newest first
  drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const nowSeconds = Math.floor(Date.now() / 1000)
  const pages: WikiPage[] = []
  for (const meta of drafts) {
    const page = await loadWikiPage(meta.id, meta.kind as WikiPageKind)
    if (page) pages.push(page)
  }

  const textEntries: string[] = []
  const htmlEntries: string[] = []
  for (const page of pages) {
    const keepUrl = buildReviewUrl(page.meta, 'publish', env, nowSeconds)
    const discardUrl = buildReviewUrl(page.meta, 'reject', env, nowSeconds)
    textEntries.push(buildEntryText(page, keepUrl, discardUrl))
    htmlEntries.push(buildEntryHtml(page, keepUrl, discardUrl))
  }

  const today = new Date().toISOString().slice(0, 10)
  const subject = `Wiki review — ${pages.length} new page${pages.length === 1 ? '' : 's'} (${today})`

  const introText = `${pages.length} draft wiki page${pages.length === 1 ? '' : 's'} waiting for review.\nLinks expire in 7 days.\n\n`
  const text = introText + textEntries.join('\n')

  const html = [
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#222;">`,
    `<h2 style="margin:0 0 8px 0;font-size:16px;">Wiki review · ${today}</h2>`,
    `<p style="margin:0 0 16px 0;color:#666;font-size:14px;">${pages.length} draft page${pages.length === 1 ? '' : 's'} · links expire in 7 days</p>`,
    htmlEntries.join(''),
    `</div>`,
  ].join('')

  await sendEmail(env, subject, text, html)

  return { scanned: all.length, drafts: pages.length, sent: true }
}

// ── CLI entry ───────────────────────────────────────────────

async function main() {
  const result = await runDigest()
  if (!result.sent) {
    console.log(`[digest] skipped: ${result.skippedReason ?? 'unknown'} (scanned ${result.scanned}, drafts ${result.drafts})`)
    return
  }
  console.log(`[digest] sent email covering ${result.drafts} draft page${result.drafts === 1 ? '' : 's'}`)
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[digest] failed:', error)
    process.exit(1)
  })
}
