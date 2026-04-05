import fs from 'node:fs/promises'
import path from 'node:path'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { WikiPageContent } from './content'

const WIKI_ROOT = path.join(process.cwd(), 'content', 'wiki')
const WIKI_KINDS = ['concepts', 'entities', 'sources'] as const

interface WikiPageParams {
  slug: string[]
}

interface WikiPageProps {
  params: Promise<WikiPageParams>
}

async function readWikiFile(slugParts: string[]): Promise<{ title: string; body: string; kindDir: string } | null> {
  if (slugParts.length !== 2) return null
  const [kindDir, id] = slugParts
  if (!WIKI_KINDS.includes(kindDir as (typeof WIKI_KINDS)[number])) return null

  const filePath = path.join(WIKI_ROOT, kindDir, `${id}.md`)
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/m)
    if (!match) return null

    const frontmatter = match[1]
    const body = match[2] ?? ''
    const titleMatch = frontmatter.match(/^title:\s*"?(.+?)"?\s*$/m)
    const title = titleMatch ? titleMatch[1] : id

    return { title, body, kindDir }
  } catch {
    return null
  }
}

export async function generateStaticParams(): Promise<WikiPageParams[]> {
  const params: WikiPageParams[] = []

  for (const kindDir of WIKI_KINDS) {
    const dir = path.join(WIKI_ROOT, kindDir)
    try {
      const entries = await fs.readdir(dir)
      for (const file of entries) {
        if (!file.endsWith('.md')) continue
        params.push({ slug: [kindDir, file.replace(/\.md$/, '')] })
      }
    } catch {
      // directory may not exist yet
    }
  }

  return params
}

export async function generateMetadata({ params }: WikiPageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await readWikiFile(slug)
  if (!page) return {}

  return {
    title: `${page.title} · wiki · toni.ltd`,
    description: page.body.slice(0, 160).replace(/\s+/g, ' ').trim(),
  }
}

export default async function WikiPage({ params }: WikiPageProps) {
  const { slug } = await params
  const page = await readWikiFile(slug)

  if (!page) {
    notFound()
  }

  return <WikiPageContent title={page.title} body={page.body} kindDir={page.kindDir} />
}
