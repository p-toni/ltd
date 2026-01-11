import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export interface TickerMessage {
  id: string
  author: 'toni' | 'codex' | 'claude'
  action: string
  timestamp: number
  commit: string
}

// Pattern matching for commit message parsing
const COMMIT_PATTERNS: Array<{
  pattern: RegExp
  author: 'toni' | 'codex' | 'claude'
  actionTemplate: string
}> = [
  // Codex patterns
  { pattern: /co.?ownership|codex/i, author: 'codex', actionTemplate: 'joined as co-owner' },
  { pattern: /wire|hook|ci|pipeline|delivery/i, author: 'codex', actionTemplate: 'enhanced delivery system' },
  { pattern: /skill|guard|deployment/i, author: 'codex', actionTemplate: 'improved tooling' },

  // Content patterns (likely Toni)
  { pattern: /add.*piece|new.*post|blog.*post/i, author: 'toni', actionTemplate: 'published new piece' },
  { pattern: /fix.*mood|metadata|content/i, author: 'toni', actionTemplate: 'refined content structure' },
  { pattern: /route|nav|ui/i, author: 'toni', actionTemplate: 'updated interface' },

  // Technical patterns (could be anyone, default to toni for now)
  { pattern: /fix.*test|typescript|lint/i, author: 'toni', actionTemplate: 'fixed technical issues' },
  { pattern: /tune|adjust|refactor/i, author: 'toni', actionTemplate: 'made improvements' }
]

function parseCommitMessage(message: string, hash: string, timestamp: number): TickerMessage | null {
  const normalizedMessage = message.toLowerCase()

  // Check for explicit author mentions first
  if (normalizedMessage.includes('claude') || normalizedMessage.includes('ai')) {
    return {
      id: hash,
      author: 'claude',
      action: 'contributed to project',
      timestamp,
      commit: hash
    }
  }

  // Pattern matching
  for (const { pattern, author, actionTemplate } of COMMIT_PATTERNS) {
    if (pattern.test(message)) {
      return {
        id: hash,
        author,
        action: actionTemplate,
        timestamp,
        commit: hash
      }
    }
  }

  // Default fallback
  return {
    id: hash,
    author: 'toni',
    action: 'made changes',
    timestamp,
    commit: hash
  }
}

function getRecentActivity(limit = 5): TickerMessage[] {
  try {
    // Get recent commits with format: hash|timestamp|message
    const gitLog = execSync(
      `git log --format="%H|%ct|%s" -${limit}`,
      { encoding: 'utf8', cwd: process.cwd() }
    ).trim()

    if (!gitLog) return []

    const messages: TickerMessage[] = []

    for (const line of gitLog.split('\n')) {
      const [hash, timestampStr, message] = line.split('|')
      if (!hash || !timestampStr || !message) continue

      const timestamp = parseInt(timestampStr, 10) * 1000 // Convert to milliseconds
      const tickerMessage = parseCommitMessage(message, hash.slice(0, 7), timestamp)

      if (tickerMessage) {
        messages.push(tickerMessage)
      }
    }

    return messages
  } catch (error) {
    console.warn('Failed to get git activity:', error)
    return []
  }
}

export async function GET() {
  try {
    const activity = getRecentActivity(10)

    return NextResponse.json({
      success: true,
      activity
    })
  } catch (error) {
    console.error('Failed to fetch activity:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch activity',
        activity: []
      },
      { status: 500 }
    )
  }
}