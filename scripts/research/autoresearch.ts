import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

import type { Piece } from '../../lib/pieces'
import type { DiscoveryPlan, SearchResult } from './types'

const URL_PATTERN = /https?:\/\/[^\s)\]>'\"]+/gi
const DEFAULT_AUTORESEARCH_REPO = 'https://github.com/karpathy/autoresearch.git'
const DEFAULT_AUTORESEARCH_REF = 'main'
const DEFAULT_AUTORESEARCH_ENTRYPOINT = 'main.py'

interface AutoResearchConfig {
  repoUrl: string
  repoRef: string
  entrypoint: string
  pythonBin: string
  customCommand?: string
}

let configCache: AutoResearchConfig | null = null
let repoDirPromise: Promise<string> | null = null
const SHELL_SPECIAL_CHARS = new Set(['|', '&', ';', '<', '>', '(', ')', '$', '`', '\n', '*', '?', '[', ']', '{', '}', '~', '!'])

function toSafeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function applyTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '')
}

export function parseDirectCommandArgs(command: string): string[] | null {
  const args: string[] = []
  let current = ''
  let activeQuote: '"' | "'" | null = null
  let tokenStarted = false

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index]

    if (activeQuote === "'") {
      if (char === "'") {
        activeQuote = null
      } else {
        current += char
      }
      tokenStarted = true
      continue
    }

    if (activeQuote === '"') {
      if (char === '"') {
        activeQuote = null
      } else if (char === '\\') {
        const next = command[index + 1]
        if (next && ['"', '\\', '$', '`', '\n'].includes(next)) {
          current += next
          index += 1
        } else {
          current += char
        }
      } else {
        current += char
      }
      tokenStarted = true
      continue
    }

    if (char === "'" || char === '"') {
      activeQuote = char
      tokenStarted = true
      continue
    }

    if (char === '\\') {
      const next = command[index + 1]
      if (!next) {
        return null
      }
      current += next
      tokenStarted = true
      index += 1
      continue
    }

    if (SHELL_SPECIAL_CHARS.has(char)) {
      return null
    }

    if (/\s/u.test(char)) {
      if (tokenStarted) {
        args.push(current)
        current = ''
        tokenStarted = false
      }
      continue
    }

    current += char
    tokenStarted = true
  }

  if (activeQuote) {
    return null
  }

  if (tokenStarted) {
    args.push(current)
  }

  return args.length > 0 ? args : null
}

function getAutoResearchConfig(): AutoResearchConfig {
  if (!configCache) {
    configCache = {
      repoUrl: process.env.AUTORESEARCH_REPO_URL ?? DEFAULT_AUTORESEARCH_REPO,
      repoRef: process.env.AUTORESEARCH_REPO_REF ?? DEFAULT_AUTORESEARCH_REF,
      entrypoint: process.env.AUTORESEARCH_ENTRYPOINT ?? DEFAULT_AUTORESEARCH_ENTRYPOINT,
      pythonBin: process.env.AUTORESEARCH_PYTHON_BIN ?? 'python3',
      customCommand: process.env.AUTORESEARCH_COMMAND,
    }
  }

  return configCache
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
  const { repoUrl, repoRef } = getAutoResearchConfig()
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

async function collectUrlsFromDirectory(rootDir: string) {
  const urls = new Set<string>()
  const entries = await fs.readdir(rootDir, { recursive: true, withFileTypes: true })
  const filePaths: string[] = []

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue
    }

    const lower = entry.name.toLowerCase()
    if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.json')) {
      filePaths.push(path.join(entry.parentPath, entry.name))
    }
  }

  const contents = await Promise.all(filePaths.map((filePath) => fs.readFile(filePath, 'utf8')))
  for (const content of contents) {
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
  const { entrypoint, pythonBin, customCommand } = getAutoResearchConfig()
  const scriptPath = path.join(repoDir, entrypoint)

  if (customCommand) {
    const renderedCommand = applyTemplate(customCommand, {
      query,
      title: piece.title,
      slug: piece.slug,
      outputDir,
      repoDir,
      scriptPath,
    })
    const directArgs = parseDirectCommandArgs(renderedCommand)

    if (directArgs) {
      const [command, ...args] = directArgs
      await runCommand(command, args, { cwd: repoDir })
    } else {
      await runCommand('bash', ['-lc', renderedCommand], { cwd: repoDir })
    }
  } else {
    await runCommand(pythonBin, [scriptPath, '--query', query, '--output-dir', outputDir], { cwd: repoDir })
  }

  const urls = await collectUrlsFromDirectory(outputDir)
  return buildSearchResults(urls)
}
