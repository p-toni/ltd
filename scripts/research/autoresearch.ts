import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

import type { Piece } from '../../lib/pieces'
import type { DiscoveryPlan, SearchResult } from './types'

const URL_PATTERN = /https?:\/\/[^\s)\]>'\"]+/gi

function toSafeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function applyTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '')
}

function splitCommand(command: string) {
  const parts = command.match(/(?:[^"]\S*|".+?")+/g) ?? []
  return parts.map((part) => part.replace(/^"|"$/g, ''))
}

async function collectUrlsFromDirectory(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const urls = new Set<string>()

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await collectUrlsFromDirectory(fullPath)
      nested.forEach((url) => urls.add(url))
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    const lower = entry.name.toLowerCase()
    if (!lower.endsWith('.md') && !lower.endsWith('.txt') && !lower.endsWith('.json')) {
      continue
    }

    const content = await fs.readFile(fullPath, 'utf8')
    const matches = content.match(URL_PATTERN) ?? []
    matches.forEach((url) => urls.add(url.replace(/[.,;:]$/, '')))
  }

  return [...urls]
}

function buildSearchResults(urls: string[]): SearchResult[] {
  return urls.map((url) => {
    let title = url
    try {
      const parsed = new URL(url)
      title = parsed.hostname
    } catch {
      // ignore malformed URL
    }

    return { title, url }
  })
}

export async function gatherAutoResearchResults(piece: Piece, plan: DiscoveryPlan) {
  const template = process.env.AUTORESEARCH_COMMAND
  if (!template) {
    throw new Error('AUTORESEARCH_COMMAND is required when RESEARCH_PROVIDER=autoresearch.')
  }

  const query = [
    ...piece.watchQueries,
    ...plan.focusAreas.flatMap((focusArea) => focusArea.queries),
  ]
    .filter(Boolean)
    .slice(0, 5)
    .join(' | ') || piece.title

  const date = new Date().toISOString().slice(0, 10)
  const outputDir = path.join(process.cwd(), '.cache', 'autoresearch', date, `${piece.id}-${toSafeSlug(piece.slug)}`)
  await fs.mkdir(outputDir, { recursive: true })

  const command = applyTemplate(template, {
    query,
    title: piece.title,
    slug: piece.slug,
    outputDir,
  })

  const [bin, ...args] = splitCommand(command)
  if (!bin) {
    throw new Error('AUTORESEARCH_COMMAND produced an empty command.')
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Autoresearch command failed with exit code ${String(code)}`))
    })
  })

  const urls = await collectUrlsFromDirectory(outputDir)
  return buildSearchResults(urls)
}
