import type { DiscoveryPlan, SearchResult } from './types'
import { fetchFeedEntries } from './feeds'
import { searchBrave } from './search-brave'

function parseDate(value?: string) {
  if (!value) {
    return null
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return null
  }
  return new Date(parsed)
}

function isWithinRecency(value: string | undefined, maxDays: number) {
  if (!value) {
    return true
  }
  const date = parseDate(value)
  if (!date) {
    return true
  }
  const diffMs = Date.now() - date.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= maxDays
}

function dedupeResults(results: SearchResult[]) {
  const seen = new Set<string>()
  return results.filter((result) => {
    if (!result.url || seen.has(result.url)) {
      return false
    }
    seen.add(result.url)
    return true
  })
}

export async function gatherSearchResults(plan: DiscoveryPlan) {
  const results: SearchResult[] = []
  const recencyDays = plan.sourcePolicy.recencyDays ?? 14
  const maxResultsPerQuery = plan.sourcePolicy.maxResultsPerQuery ?? 5

  for (const focusArea of plan.focusAreas) {
    for (const query of focusArea.queries) {
      console.log(`[Scout] Query: "${query}"`)
      const baseResults = await searchBrave(query, { count: maxResultsPerQuery })
      results.push(...baseResults)

      for (const domain of plan.sourcePolicy.domains) {
        const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
        if (!normalizedDomain) {
          continue
        }
        const scopedQuery = `${query} site:${normalizedDomain}`
        console.log(`[Scout] Query: "${scopedQuery}"`)
        const scopedResults = await searchBrave(scopedQuery, { count: maxResultsPerQuery })
        results.push(...scopedResults)
      }
    }
  }

  for (const feed of plan.sourcePolicy.feeds) {
    try {
      console.log(`[Scout] Feed: ${feed}`)
      const entries = await fetchFeedEntries(feed)
      entries.forEach((entry) => {
        results.push({
          title: entry.title ?? entry.url,
          url: entry.url,
          publishedAt: entry.publishedAt,
        })
      })
    } catch (error) {
      console.warn(`Failed to fetch feed ${feed}:`, error)
    }
  }

  return dedupeResults(results).filter((result) => isWithinRecency(result.publishedAt, recencyDays))
}
