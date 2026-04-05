import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CLIP_AUTH_TOKEN = process.env.CLIP_AUTH_TOKEN
const GITHUB_PAT = process.env.CLIP_GITHUB_PAT
const GITHUB_REPO = process.env.CLIP_GITHUB_REPO ?? 'p-toni/ltd'
const COOKIE_NAME = 'clip_auth'

interface ClipRequestBody {
  url?: string
  note?: string
  tags?: string[]
  token?: string // for initial auth
}

function buildInboxContent(url: string, note: string, tags: string[]): string {
  const clippedAt = new Date().toISOString()
  const tagLines = tags.length
    ? `tags:\n${tags.map((t) => `  - ${t}`).join('\n')}`
    : 'tags: []'

  return [
    '---',
    `url: ${url}`,
    `note: "${note.replace(/"/g, '\\"')}"`,
    `clippedAt: ${clippedAt}`,
    tagLines,
    'status: pending',
    '---',
    '',
  ].join('\n')
}

export async function POST(request: Request) {
  if (!CLIP_AUTH_TOKEN || !GITHUB_PAT) {
    return NextResponse.json(
      { error: 'Clip endpoint not configured' },
      { status: 503 },
    )
  }

  let body: ClipRequestBody
  try {
    body = (await request.json()) as ClipRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Auth: check cookie or accept token for initial auth
  const cookieStore = await cookies()
  const authCookie = cookieStore.get(COOKIE_NAME)?.value

  if (body.token) {
    // Initial auth — validate and set cookie
    if (body.token !== CLIP_AUTH_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const response = NextResponse.json({ authenticated: true })
    response.cookies.set(COOKIE_NAME, CLIP_AUTH_TOKEN, {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/api/clip',
    })
    return response
  }

  if (authCookie !== CLIP_AUTH_TOKEN) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const url = body.url?.trim()
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const note = body.note?.trim() ?? ''
  const tags = body.tags?.filter(Boolean) ?? []

  const content = buildInboxContent(url, note, tags)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filePath = `content/inbox/${timestamp}.md`

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_PAT}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `inbox: clip ${new URL(url).hostname}`,
          content: Buffer.from(content).toString('base64'),
        }),
      },
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('GitHub API error:', error)
      return NextResponse.json(
        { error: 'Failed to save clip' },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true, path: filePath })
  } catch (error) {
    console.error('Clip failed:', error)
    return NextResponse.json(
      { error: 'Failed to save clip' },
      { status: 500 },
    )
  }
}
