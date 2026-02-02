import { JSDOM } from 'jsdom'

import type { IngestedSource } from './types'

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function extractMeta(document: Document, selector: string) {
  const node = document.querySelector(selector) as HTMLMetaElement | null
  return node?.content?.trim() ?? ''
}

function guessPublisher(document: Document, url: string) {
  return (
    extractMeta(document, 'meta[property="og:site_name"]') ||
    extractMeta(document, 'meta[name="publisher"]') ||
    extractMeta(document, 'meta[name="author"]') ||
    new URL(url).hostname
  )
}

function extractPublishedAt(document: Document) {
  return (
    extractMeta(document, 'meta[property="article:published_time"]') ||
    extractMeta(document, 'meta[name="pubdate"]') ||
    extractMeta(document, 'meta[name="date"]') ||
    extractMeta(document, 'meta[property="article:modified_time"]') ||
    ''
  )
}

function extractContentText(document: Document) {
  const article = document.querySelector('article')
  const main = document.querySelector('main')
  const body = document.body

  const node = article ?? main ?? body
  if (!node) {
    return ''
  }

  return collapseWhitespace(node.textContent ?? '')
}

export async function ingestUrl(url: string, options?: { timeoutMs?: number }): Promise<IngestedSource | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 12000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'toni.ltd research bot',
      },
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    const dom = new JSDOM(html)
    const { document } = dom.window

    const title = document.title || extractMeta(document, 'meta[property="og:title"]') || url
    const publisher = guessPublisher(document, url)
    const publishedAt = extractPublishedAt(document) || undefined
    const contentText = extractContentText(document)

    if (!contentText) {
      return null
    }

    return {
      url,
      title,
      publisher,
      publishedAt,
      contentText,
    }
  } catch (error) {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
