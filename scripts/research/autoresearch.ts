import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

import type { Piece } from '../../lib/pieces'
import type { DiscoveryPlan, SearchResult } from './types'

const URL_PATTERN = /https?:\/\/[^\s)\]>'\"]+/gi
const DEFAULT_AUTORESEARCH_REPO = 'https://github.com/karpathy/autoresearch.git'
const DEFAULT_AUTORESEARCH_REF = 'main'
const DEFAULT_AUTORESEARCH_ENTRYPOINT = 'main.py'

let repoDirPromise: Promise<string> | null = null

function toSafeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function applyTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '')
}

async function runCommand(command: string, args: string[], options?: { cwd?: string; stdio?: 'inherit' | 'pipe' }) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd ?? process.cwd(),
      env: process.env,
      stdio: options?.stdio ?? 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Command failed (${command} ${args.join(' ')}), exit code=${String(code)}`))
    })
  })
}

async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function setupAutoResearchDependency() {
  const repoUrl = process.env.AUTORESEARCH_REPO_URL ?? DEFAULT_AUTORESEARCH_REPO
  const repoRef = process.env.AUTORESEARCH_REPO_REF ?? DEFAULT_AUTORESEARCH_REF
  const dependencyRoot = path.join(process.cwd(), '.cache', 'deps')
  const repoDir = path.join(dependencyRoot, 'autoresearch')

  await fs.mkdir(dependencyRoot, { recursive: true })

  const hasRepo = await pathExists(path.join(repoDir, '.git'))
  if (!hasRepo) {
    await runCommand('git', ['clone', '--depth', '1', '--branch', repoRef, repoUrl, repoDir])
    return repoDir
  }

  await runCommand('git', ['fetch', '--depth', '1', 'origin', repoRef], { cwd: repoDir })
  await runCommand('git', ['checkout', '--force', 'FETCH_HEAD'], { cwd: repoDir })
  await runCommand('git', ['clean', '-fd'], { cwd: repoDir })

  return repoDir
}

async function ensureAutoResearchDependency() {
  if (!repoDirPromise) {
    repoDirPromise = setupAutoResearchDependency().catch((error) => {
      repoDirPromise = null
      throw error
    })
  }

  return repoDirPromise
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

  const repoDir = await ensureAutoResearchDependency()
  const entrypoint = process.env.AUTORESEARCH_ENTRYPOINT ?? DEFAULT_AUTORESEARCH_ENTRYPOINT
  const pythonBin = process.env.AUTORESEARCH_PYTHON_BIN ?? 'python3'
  const scriptPath = path.join(repoDir, entrypoint)

  const customCommand = process.env.AUTORESEARCH_COMMAND
  if (customCommand) {
    const renderedCommand = applyTemplate(customCommand, {
      query,
      title: piece.title,
      slug: piece.slug,
      outputDir,
      repoDir,
      scriptPath,
    })
    await runCommand('bash', ['-lc', renderedCommand], { cwd: repoDir })
  } else {
    await runCommand(pythonBin, [scriptPath, '--query', query, '--output-dir', outputDir], { cwd: repoDir })
  }

  const urls = await collectUrlsFromDirectory(outputDir)
  return buildSearchResults(urls)
}
