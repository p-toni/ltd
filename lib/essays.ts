import fs from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import path from 'node:path'

export type Mood = 'contemplative' | 'analytical' | 'exploratory' | 'critical'

export interface Essay {
  id: number
  title: string
  date: string
  readTime: string
  mood: Mood[]
  excerpt: string
  content: string
  wordCount: number
  publishedAt: number
}

const ESSAY_DIRECTORY = path.join(process.cwd(), 'content', 'essays')
const VALID_MOODS: Mood[] = ['contemplative', 'analytical', 'exploratory', 'critical']
const VALID_MOOD_SET = new Set<Mood>(VALID_MOODS)
const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/m

type FrontmatterValue = string | string[]
type ParsedFrontmatter = Record<string, FrontmatterValue>

export async function getEssays(): Promise<Essay[]> {
  let entries: Dirent[]

  try {
    entries = await fs.readdir(ESSAY_DIRECTORY, { withFileTypes: true })
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return []
    }
    throw error
  }

  const markdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))

  const essays = await Promise.all(
    markdownFiles.map(async (entry) => {
      const filePath = path.join(ESSAY_DIRECTORY, entry.name)
      const rawFile = await fs.readFile(filePath, 'utf8')
      const { data, content } = parseMarkdownFile(rawFile, entry.name)

      const id = Number(data.id)
      if (!Number.isFinite(id)) {
        throw new Error(`Invalid or missing "id" in ${entry.name}`)
      }

      const title = ensureString(data.title, 'title', entry.name)
      const date = ensureString(data.date, 'date', entry.name)
      const readTime = ensureString(data.readTime, 'readTime', entry.name)
      const excerpt = ensureString(data.excerpt, 'excerpt', entry.name)

      const moods = normalizeMoods(data.mood, entry.name)
      const normalizedContent = content.trim()
      const wordCount = countWords(normalizedContent)

      const publishedAt = parseDate(date, entry.name)

      return {
        id,
        title,
        date,
        readTime,
        mood: moods,
        excerpt,
        content: normalizedContent,
        wordCount,
        publishedAt,
      }
    }),
  )

  return essays.sort((a, b) => {
    if (a.publishedAt !== b.publishedAt) {
      return b.publishedAt - a.publishedAt
    }

    return b.id - a.id
  })
}

function parseMarkdownFile(raw: string, filename: string) {
  const match = raw.match(FRONTMATTER_PATTERN)

  if (!match) {
    throw new Error(`Missing frontmatter in ${filename}`)
  }

  const [, frontmatter, body] = match
  const data = parseFrontmatter(frontmatter)

  return { data, content: body ?? '' }
}

function parseFrontmatter(block: string): ParsedFrontmatter {
  const result: ParsedFrontmatter = {}
  const lines = block.split('\n')
  let currentArrayKey: string | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    if (line.startsWith('- ')) {
      if (!currentArrayKey) {
        throw new Error('Unexpected array item without key in frontmatter')
      }

      const currentValue = result[currentArrayKey]
      if (!Array.isArray(currentValue)) {
        throw new Error(`Frontmatter key "${currentArrayKey}" is not an array`)
      }

      currentValue.push(stripWrappingQuotes(line.slice(2).trim()))
      continue
    }

    currentArrayKey = null
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim()

    if (!rawValue) {
      currentArrayKey = key
      result[key] = [] as string[]
      continue
    }

    result[key] = stripWrappingQuotes(rawValue)
  }

  return result
}

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}

function ensureString(value: FrontmatterValue | undefined, key: string, filename: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }

  throw new Error(`Invalid or missing "${key}" in ${filename}`)
}

function normalizeMoods(value: FrontmatterValue | undefined, filename: string): Mood[] {
  const values = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : []
  const moods = values
    .map((item) => item.toLowerCase() as Mood)
    .filter((item): item is Mood => VALID_MOOD_SET.has(item))

  if (!moods.length) {
    throw new Error(`Invalid or missing "mood" in ${filename}`)
  }

  return moods
}

function parseDate(value: string, filename: string) {
  const normalized = value.trim().replace(/\./g, '-')
  const parsed = new Date(normalized)
  const timestamp = parsed.getTime()

  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid "date" value in ${filename}. Expected format YYYY.MM.DD`)
  }

  return timestamp
}

function countWords(text: string) {
  const normalized = text.trim()
  if (!normalized) {
    return 0
  }

  return normalized.split(/\s+/u).length
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error) && typeof error === 'object' && 'code' in (error as Record<string, unknown>)
}
