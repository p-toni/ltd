import fs from 'node:fs/promises'

const FRONTMATTER_PATTERN = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/m

export async function readMarkdownFile(filePath: string) {
  const raw = await fs.readFile(filePath, 'utf8')
  const match = raw.match(FRONTMATTER_PATTERN)
  if (!match) {
    throw new Error(`Missing frontmatter in ${filePath}`)
  }
  const [, frontmatter, body] = match
  return { raw, frontmatter, body: body ?? '' }
}

export function replaceMarkdownBody(raw: string, nextBody: string) {
  const match = raw.match(FRONTMATTER_PATTERN)
  if (!match) {
    throw new Error('Missing frontmatter block')
  }
  const [, frontmatter] = match
  return `---\n${frontmatter}\n---\n\n${nextBody.trim()}\n`
}
