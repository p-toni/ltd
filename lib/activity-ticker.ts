export interface TickerMessage {
  id: string
  author: 'toni' | 'codex' | 'claude'
  action: string
  timestamp: number
  commit: string
}

interface ActivityResponse {
  success: boolean
  activity: TickerMessage[]
  error?: string
}

export async function getRecentActivity(limit = 10): Promise<TickerMessage[]> {
  try {
    const response = await fetch('/api/activity')
    if (!response.ok) {
      console.warn('Failed to fetch activity:', response.statusText)
      return []
    }

    const data = (await response.json()) as ActivityResponse
    if (!data.success || !Array.isArray(data.activity)) {
      console.warn('Invalid activity response:', data)
      return []
    }

    return data.activity.slice(0, limit)
  } catch (error) {
    console.warn('Failed to fetch activity:', error)
    return []
  }
}

export function formatTickerMessage(message: TickerMessage): string {
  const timeAgo = getTimeAgo(message.timestamp)
  return `${message.author} ${message.action} ${timeAgo}`
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else {
    return `${days}d ago`
  }
}