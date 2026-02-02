import { JSDOM } from 'jsdom'

interface FeedEntry {
  url: string
  publishedAt?: string
  title?: string
}

function extractText(node: Element | null | undefined) {
  return node?.textContent?.trim() ?? ''
}

function parseDate(value: string | undefined) {
  if (!value) {
    return undefined
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return undefined
  }
  return new Date(parsed).toISOString()
}

export async function fetchFeedEntries(feedUrl: string) {
  const response = await fetch(feedUrl)
  if (!response.ok) {
    throw new Error(`Feed request failed: ${response.status} ${response.statusText}`)
  }
  const xml = await response.text()
  const dom = new JSDOM(xml, { contentType: 'text/xml' })
  const document = dom.window.document

  const entries: FeedEntry[] = []

  const items = Array.from(document.querySelectorAll('item'))
  if (items.length) {
    items.forEach((item) => {
      const link = extractText(item.querySelector('link'))
      if (!link) {
        return
      }
      entries.push({
        url: link,
        title: extractText(item.querySelector('title')),
        publishedAt: parseDate(extractText(item.querySelector('pubDate'))),
      })
    })
  }

  const atomEntries = Array.from(document.querySelectorAll('entry'))
  if (atomEntries.length) {
    atomEntries.forEach((entry) => {
      const linkEl = entry.querySelector('link')
      const href = linkEl?.getAttribute('href') ?? extractText(linkEl)
      if (!href) {
        return
      }
      entries.push({
        url: href,
        title: extractText(entry.querySelector('title')),
        publishedAt: parseDate(extractText(entry.querySelector('updated')) || extractText(entry.querySelector('published'))),
      })
    })
  }

  return entries
}
