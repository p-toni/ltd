#!/usr/bin/env ts-node
/*
 * Generate NV-Embed-v2 embeddings for pieces and their fragments.
 * Usage: pnpm ts-node scripts/embed-pieces.ts [--force]
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import 'dotenv/config'
import { HfInference } from '@huggingface/inference'

import { getPieceFragments, getPieces } from '../lib/pieces'

interface EmbeddingRecord {
  id: string
  pieceId: number
  pieceSlug: string
  pieceTitle: string
  fragmentOrder: number
  embedding: number[]
}

interface EmbeddingPayload {
  version: string
  model: string
  createdAt: string
  dimensions: number
  fragments: EmbeddingRecord[]
  pieceEmbeddings: EmbeddingRecord[]
}

const MODEL_ID = 'nvidia/NV-Embed-v2'
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'embeddings', 'pieces-v1.json')
const BATCH_SIZE = 16

async function main() {
  const force = process.argv.includes('--force')
  const hfToken = process.env.HF_TOKEN

  if (!hfToken) {
    throw new Error('HF_TOKEN is required (set in .env.local)')
  }

  const hf = new HfInference(hfToken)

  const [pieces, fragments] = await Promise.all([getPieces(), getPieceFragments()])

  const existing = await loadExisting(force)
  const existingFragments = new Map(existing?.fragments.map((f) => [f.id, f]))
  const existingPieces = new Map(existing?.pieceEmbeddings.map((p) => [p.id, p]))

  const pendingFragments = fragments.filter((fragment) => !existingFragments.has(fragment.id))
  const pendingPieces = pieces.filter((piece) => !existingPieces.has(piece.slug))

  const newFragmentEmbeddings = await embedItems(
    hf,
    pendingFragments.map((fragment) => ({
      id: fragment.id,
      text: fragment.text,
      pieceId: fragment.pieceId,
      pieceSlug: fragment.pieceSlug,
      pieceTitle: fragment.pieceTitle,
      fragmentOrder: fragment.order,
    })),
  )

  const newPieceEmbeddings = await embedItems(
    hf,
    pendingPieces.map((piece) => ({
      id: piece.slug,
      text: [piece.title, piece.excerpt, piece.content.slice(0, 1200)].join('\n\n'),
      pieceId: piece.id,
      pieceSlug: piece.slug,
      pieceTitle: piece.title,
      fragmentOrder: 0,
    })),
  )

  const payload: EmbeddingPayload = {
    version: 'nv-embed-v2::pieces-v1',
    model: MODEL_ID,
    createdAt: new Date().toISOString(),
    dimensions: newFragmentEmbeddings[0]?.embedding.length ?? existing?.dimensions ?? 0,
    fragments: mergeEmbeddings(existing?.fragments ?? [], newFragmentEmbeddings),
    pieceEmbeddings: mergeEmbeddings(existing?.pieceEmbeddings ?? [], newPieceEmbeddings),
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8')

  console.log(`Saved embeddings to ${OUTPUT_PATH}`)
}

async function embedItems(
  hf: HfInference,
  items: Array<{ id: string; text: string; pieceId: number; pieceSlug: string; pieceTitle: string; fragmentOrder: number }>,
): Promise<EmbeddingRecord[]> {
  if (items.length === 0) {
    return []
  }

  const batches = chunk(items, BATCH_SIZE)
  const results: EmbeddingRecord[] = []

  console.log(`Embedding ${items.length} items (${batches.length} batches) with ${MODEL_ID}`)

  for (const [index, batch] of batches.entries()) {
    const response = await hf.featureExtraction({
      model: MODEL_ID,
      inputs: batch.map((item) => item.text.slice(0, 2000)),
    })

    const vectors = Array.isArray(response) ? response : [response]

    if (vectors.length !== batch.length) {
      throw new Error(`Embedding batch mismatch: received ${vectors.length}, expected ${batch.length}`)
    }

    vectors.forEach((vector, vectorIndex) => {
      const batchItem = batch[vectorIndex]
      results.push({
        id: batchItem.id,
        pieceId: batchItem.pieceId,
        pieceSlug: batchItem.pieceSlug,
        pieceTitle: batchItem.pieceTitle,
        fragmentOrder: batchItem.fragmentOrder,
        embedding: vector as number[],
      })
    })

    console.log(`Batch ${index + 1}/${batches.length} complete`)
  }

  return results
}

async function loadExisting(force: boolean) {
  if (force) {
    return null
  }

  try {
    const raw = await fs.readFile(OUTPUT_PATH, 'utf8')
    return JSON.parse(raw) as EmbeddingPayload
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function mergeEmbeddings(existing: EmbeddingRecord[], fresh: EmbeddingRecord[]): EmbeddingRecord[] {
  const merged = new Map(existing.map((record) => [record.id, record]))
  for (const record of fresh) {
    merged.set(record.id, record)
  }
  return Array.from(merged.values()).sort((a, b) => a.id.localeCompare(b.id))
}

function chunk<T>(input: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < input.length; i += size) {
    result.push(input.slice(i, i + size))
  }
  return result
}

main().catch((error) => {
  console.error('Embedding generation failed:', error)
  process.exit(1)
})
