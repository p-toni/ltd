import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const TEMP_PREFIX = path.join(os.tmpdir(), 'te-blog-')

async function createTempRoot() {
  return fs.mkdtemp(TEMP_PREFIX)
}

async function writePiece(root: string, name: string, contents: string) {
  const piecesDir = path.join(root, 'content', 'pieces')
  await fs.mkdir(piecesDir, { recursive: true })
  await fs.writeFile(path.join(piecesDir, name), contents, 'utf8')
}

async function loadPiecesModule(root: string) {
  await vi.resetModules()
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(root)
  const piecesModule = await import('../pieces')
  return { ...piecesModule, cwdSpy }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getPieces', () => {
  it('returns empty list when the pieces directory is missing', async () => {
    const root = await createTempRoot()
    try {
      const { getPieces } = await loadPiecesModule(root)
      await expect(getPieces()).resolves.toEqual([])
    } finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('parses frontmatter, computes metadata, and sorts pinned first', async () => {
    const root = await createTempRoot()
    const longContent = Array.from({ length: 221 }, (_, index) => `word${index}`).join(' ')

    try {
      await writePiece(
        root,
        'alpha.md',
        `---
id: 1
title: Alpha
date: 2025.01.02
mood:
  - analytical
excerpt: Alpha excerpt
pinned: false
---

${longContent}
`,
      )

      await writePiece(
        root,
        'bravo.md',
        `---
id: 2
title: Bravo
date: 2025.01.01
mood:
  - critical
excerpt: Bravo excerpt
pinned: true
---

Short content.
`,
      )

      await writePiece(
        root,
        'charlie.md',
        `---
id: 3
title: Charlie
date: 2025.01.03
mood:
  - exploratory
excerpt: Charlie excerpt
pinned: false
---

Another short block.
`,
      )

      const { getPieces } = await loadPiecesModule(root)
      const pieces = await getPieces()

      expect(pieces.map((piece) => piece.id)).toEqual([2, 3, 1])

      const alpha = pieces.find((piece) => piece.id === 1)
      expect(alpha?.wordCount).toBe(221)
      expect(alpha?.readTimeMinutes).toBe(2)
      expect(alpha?.readTime).toBe('2 min')
      expect(alpha?.slug).toBe('alpha')
      expect(alpha?.publishedAt).toBe(Date.parse('2025-01-02'))
    } finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('throws when mood values are invalid', async () => {
    const root = await createTempRoot()
    try {
      await writePiece(
        root,
        'invalid.md',
        `---
id: 9
title: Invalid Mood
date: 2025.01.05
mood: unknown
excerpt: Bad mood
pinned: false
---

Content.
`,
      )

      const { getPieces } = await loadPiecesModule(root)
      await expect(getPieces()).rejects.toThrow('Invalid or missing "mood"')
    } finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})

describe('getPieceFragments', () => {
  it('splits content into fragments and skips short blocks', async () => {
    const root = await createTempRoot()
    try {
      await writePiece(
        root,
        'fragments.md',
        `---
id: 7
title: Fragment Source
date: 2025.02.10
mood:
  - analytical
excerpt: Fragment excerpt
pinned: false
---

Small.

This block should stay because it has enough characters.

Another block that should stay too.
`,
      )

      const { getPieceFragments } = await loadPiecesModule(root)
      const fragments = await getPieceFragments({ minLength: 10 })

      expect(fragments).toHaveLength(2)
      expect(fragments[0]?.id).toBe('piece-007-fragment-001')
      expect(fragments[0]?.order).toBe(1)
      expect(fragments[1]?.id).toBe('piece-007-fragment-002')
      expect(fragments[1]?.pieceSlug).toBe('fragments')
    } finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
