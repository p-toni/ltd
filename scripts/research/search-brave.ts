import type { SearchResult } from './types'

const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search'
const MIN_REQUEST_INTERVAL_MS = 1100
const MAX_RETRIES = 3
const BASE_BACKOFF_MS = 1200

let lastRequestAt = 0

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function enforceRateLimit() {
  const now = Date.now()
  const waitFor = lastRequestAt + MIN_REQUEST_INTERVAL_MS - now
  if (waitFor > 0) {
    await sleep(waitFor)
  }
  lastRequestAt = Date.now()
}

interface BraveWebResult {
  url?: string
  title?: string
  description?: string
  published?: string
  source?: string
}

interface BraveResponse {
  web?: {
    results?: BraveWebResult[]
  }
}

export async function searchBrave(query: string, options: { count?: number; country?: string } = {}) {
  const apiKey = process.env.BRAVE_API_KEY
  if (!apiKey) {
    throw new Error('BRAVE_API_KEY is required for search.')
  }

  const url = new URL(BRAVE_ENDPOINT)
  url.searchParams.set('q', query)
  url.searchParams.set('count', String(options.count ?? 5))
  if (options.country) {
    url.searchParams.set('country', options.country)
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    await enforceRateLimit()
    const response = await fetch(url.toString(), {
      headers: {
        'X-Subscription-Token': apiKey,
        Accept: 'application/json',
      },
    })

    if (response.ok) {
      const payload = (await response.json()) as BraveResponse
      const results = payload.web?.results ?? []

      return results
        .map((result) => ({
          title: result.title ?? result.url ?? 'Untitled',
          url: result.url ?? '',
          description: result.description,
          publishedAt: result.published,
          source: result.source,
        }))
        .filter((result): result is SearchResult => Boolean(result.url))
    }

    const errorText = await response.text()

    if (response.status === 429) {
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_BACKOFF_MS * (attempt + 1))
        continue
      }
      console.warn(`Brave Search rate limited. Skipping query: ${query}`)
      return []
    }

    throw new Error(`Brave Search request failed: ${errorText}`)
  }

  return []
}
