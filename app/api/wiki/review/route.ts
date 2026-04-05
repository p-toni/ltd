import { NextResponse } from 'next/server'

import { verifyReviewToken, type ReviewAction } from '../../../../scripts/research/review-token'
import type { WikiPageKind, WikiPageStatus } from '../../../../scripts/research/types'

const GITHUB_PAT = process.env.CLIP_GITHUB_PAT
const GITHUB_REPO = process.env.CLIP_GITHUB_REPO ?? 'p-toni/ltd'
const REVIEW_SECRET = process.env.REVIEW_SECRET

interface GitHubContentResponse {
  sha: string
  content: string
  encoding: 'base64'
}

function filePathFor(kind: WikiPageKind, id: string): string {
  return `content/wiki/${kind}s/${id}.md`
}

function statusForAction(action: ReviewAction): WikiPageStatus {
  return action === 'publish' ? 'published' : 'rejected'
}

function flipStatusLine(content: string, next: WikiPageStatus): { updated: string; current: WikiPageStatus | null } {
  const match = content.match(/^status:\s*(\w+)\s*$/m)
  const current = (match?.[1] ?? null) as WikiPageStatus | null
  if (!match) {
    // Backfill: pages seeded before the review field existed
    const fmEnd = content.indexOf('\n---', 4)
    if (fmEnd === -1) return { updated: content, current }
    const updated = content.slice(0, fmEnd) + `\nstatus: ${next}` + content.slice(fmEnd)
    return { updated, current }
  }
  return { updated: content.replace(match[0], `status: ${next}`), current }
}

function htmlResponse(title: string, message: string, status = 200): Response {
  const body = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;padding:24px;">
<div style="max-width:420px;text-align:center;">
<h1 style="font-size:14px;font-family:monospace;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.4);margin:0 0 16px;">${title}</h1>
<p style="font-size:15px;line-height:1.6;margin:0;">${message}</p>
</div>
</body>`
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function GET(request: Request) {
  if (!REVIEW_SECRET) {
    return NextResponse.json({ error: 'Review endpoint not configured' }, { status: 503 })
  }
  if (!GITHUB_PAT) {
    return NextResponse.json({ error: 'GitHub access not configured' }, { status: 503 })
  }

  const url = new URL(request.url)
  const token = url.searchParams.get('t')
  if (!token) {
    return htmlResponse('invalid request', 'Missing token.', 400)
  }

  const verified = verifyReviewToken(token, REVIEW_SECRET)
  if (!verified.ok) {
    const reasonCopy: Record<string, string> = {
      malformed: 'Token is malformed.',
      'bad-signature': 'Token signature is invalid.',
      expired: 'This review link has expired.',
      'invalid-payload': 'Token payload is invalid.',
    }
    return htmlResponse('token invalid', reasonCopy[verified.reason] ?? 'Token could not be verified.', 400)
  }

  const { pageId, kind, action } = verified.payload
  const targetStatus = statusForAction(action)
  const filePath = filePathFor(kind, pageId)

  // 1. Fetch current file contents + sha
  const getResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_PAT}`,
        Accept: 'application/vnd.github.v3+json',
      },
    },
  )

  if (getResponse.status === 404) {
    return htmlResponse('not found', `Wiki page <code>${pageId}</code> no longer exists.`, 404)
  }
  if (!getResponse.ok) {
    return htmlResponse('github error', `Could not fetch page (${getResponse.status}).`, 502)
  }

  const file = (await getResponse.json()) as GitHubContentResponse
  const currentContent = Buffer.from(file.content, 'base64').toString('utf8')
  const { updated, current } = flipStatusLine(currentContent, targetStatus)

  // 2. Idempotent no-op: already in target state (handles double-clicks)
  if (current === targetStatus) {
    return htmlResponse(
      `already ${targetStatus}`,
      `<code>${pageId}</code> was already marked as ${targetStatus}.`,
    )
  }

  // 3. Only act on drafts — prevents re-opening reviewed pages
  if (current && current !== 'draft') {
    return htmlResponse(
      'page already reviewed',
      `<code>${pageId}</code> is currently <strong>${current}</strong>, not draft. This link can't change it.`,
      409,
    )
  }

  // 4. Write the flipped content back
  const putResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_PAT}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `wiki: ${action} ${kind}/${pageId}`,
        content: Buffer.from(updated).toString('base64'),
        sha: file.sha,
      }),
    },
  )

  if (!putResponse.ok) {
    const detail = await putResponse.text()
    console.error('[review] GitHub PUT failed:', detail)
    return htmlResponse('commit failed', `GitHub rejected the write (${putResponse.status}).`, 502)
  }

  const verb = action === 'publish' ? 'published' : 'rejected'
  return htmlResponse(
    verb,
    `<code>${pageId}</code> has been marked as ${targetStatus}. Vercel will redeploy shortly.`,
  )
}
