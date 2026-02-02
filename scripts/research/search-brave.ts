import type { SearchResult } from './types'

const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search'

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

  const response = await fetch(url.toString(), {
    headers: {
      'X-Subscription-Token': apiKey,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Brave Search request failed: ${errorText}`)
  }

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
