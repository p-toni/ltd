#!/usr/bin/env ts-node
/*
 * Generate NV-Embed-v2 embeddings for pieces and their fragments.
 * Usage: pnpm ts-node scripts/embed-pieces.ts [--force]
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import { config as loadEnv } from 'dotenv'
import { HfInference } from '@huggingface/inference'

import {
  buildFragmentEmbeddingInputs,
  buildPieceEmbeddingInputs,
  forEachEmbeddingBatch,
  mergeEmbeddingRecords,
  type EmbeddingInput,
  type EmbeddingRecord,
} from '../lib/embedding'
import { getPieceFragments, getPieces } from '../lib/pieces'

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: false })
loadEnv({ path: path.resolve(process.cwd(), '.env'), override: false })

interface EmbeddingPayload {
  version: string
  model: string
  createdAt: string
  dimensions: number
  fragments: EmbeddingRecord[]
  pieceEmbeddings: EmbeddingRecord[]
}

const MODEL_ID = 'sentence-transformers/all-MiniLM-L6-v2'
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

  const pendingFragments = buildFragmentEmbeddingInputs(
    fragments.filter((fragment) => !existingFragments.has(fragment.id)),
  )
  const pendingPieces = buildPieceEmbeddingInputs(pieces.filter((piece) => !existingPieces.has(piece.slug)))

  const newFragmentEmbeddings = await embedItems(hf, pendingFragments)
  const newPieceEmbeddings = await embedItems(hf, pendingPieces)

  const payload: EmbeddingPayload = {
    version: 'nv-embed-v2::pieces-v1',
    model: MODEL_ID,
    createdAt: new Date().toISOString(),
    dimensions: newFragmentEmbeddings[0]?.embedding.length ?? existing?.dimensions ?? 0,
    fragments: mergeEmbeddingRecords(existing?.fragments ?? [], newFragmentEmbeddings),
    pieceEmbeddings: mergeEmbeddingRecords(existing?.pieceEmbeddings ?? [], newPieceEmbeddings),
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8')

  console.log(`Saved embeddings to ${OUTPUT_PATH}`)
}

async function embedItems(
  hf: HfInference,
  items: EmbeddingInput[],
): Promise<EmbeddingRecord[]> {
  if (items.length === 0) {
    return []
  }

  const results: EmbeddingRecord[] = []

  console.log(`Embedding ${items.length} items (${Math.ceil(items.length / BATCH_SIZE)} batches) with ${MODEL_ID}`)

  await forEachEmbeddingBatch(items, BATCH_SIZE, async (batch, index, batchCount) => {
    const response = await hf.featureExtraction({
      model: MODEL_ID,
      inputs: batch.map((item) => item.text),
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

    console.log(`Batch ${index + 1}/${batchCount} complete`)
  })

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

main().catch((error) => {
  console.error('Embedding generation failed:', error)
  process.exit(1)
})
