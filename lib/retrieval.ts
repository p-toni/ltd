import fs from 'node:fs/promises'
import path from 'node:path'

import { HfInference } from '@huggingface/inference'

import { getPieceFragments, getPieces, type Piece, type PieceFragment } from './pieces'

type Vector = number[]

interface StoredEmbeddingRecord {
  id: string
  pieceId: number
  pieceSlug: string
  pieceTitle: string
  fragmentOrder: number
  embedding: Vector
}

interface StoredEmbeddingPayload {
  version: string
  model: string
  createdAt: string
  dimensions: number
  fragments: StoredEmbeddingRecord[]
  pieceEmbeddings?: StoredEmbeddingRecord[]
}

interface LoadedVector extends StoredEmbeddingRecord {
  norm: number
}

interface LoadedEmbeddingStore {
  version: string
  model: string
  createdAt: string
  dimensions: number
  fragments: LoadedVector[]
  pieceEmbeddings: LoadedVector[]
}

export interface RetrievedFragment {
  fragment: PieceFragment
  score: number
}

export interface RetrievedPiece {
  piece: Piece
  score: number
}

export interface RetrievalOptions {
  limitFragments?: number
  limitPieces?: number
  filterPieceIds?: number[]
  minScore?: number
}

interface QueryEmbedding {
  vector: Vector
  norm: number
}

const MODEL_ID = 'nvidia/NV-Embed-v2'
const EMBEDDING_PATH = path.join(process.cwd(), 'public', 'embeddings', 'pieces-v1.json')

let embeddingStorePromise: Promise<LoadedEmbeddingStore> | null = null
let fragmentMapPromise: Promise<Map<string, PieceFragment>> | null = null
let piecesPromise: Promise<Piece[]> | null = null
let hfClient: HfInference | null = null

function vectorNorm(vector: Vector) {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
}

async function loadEmbeddingStore() {
  if (!embeddingStorePromise) {
    embeddingStorePromise = (async () => {
      let raw: string
      try {
        raw = await fs.readFile(EMBEDDING_PATH, 'utf8')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new Error(
            'Embedding file not found. Run `pnpm ts-node scripts/embed-pieces.ts` to generate NV-Embed vectors.',
          )
        }
        throw error
      }

      const payload = JSON.parse(raw) as StoredEmbeddingPayload
      if (!Array.isArray(payload.fragments) || payload.fragments.length === 0) {
        throw new Error('Embedding payload missing fragments. Regenerate embeddings to continue.')
      }

      const fragments = payload.fragments.map((record) => ({
        ...record,
        norm: vectorNorm(record.embedding),
      }))

      const pieceEmbeddings = (payload.pieceEmbeddings ?? []).map((record) => ({
        ...record,
        norm: vectorNorm(record.embedding),
      }))

      return {
        version: payload.version,
        model: payload.model,
        createdAt: payload.createdAt,
        dimensions: payload.dimensions,
        fragments,
        pieceEmbeddings,
      }
    })()
  }

  return embeddingStorePromise
}

async function getFragmentMap() {
  if (!fragmentMapPromise) {
    fragmentMapPromise = (async () => {
      const fragments = await getPieceFragments()
      return new Map(fragments.map((fragment) => [fragment.id, fragment]))
    })()
  }

  return fragmentMapPromise
}

async function getPiecesCached() {
  if (!piecesPromise) {
    piecesPromise = getPieces()
  }
  return piecesPromise
}

async function getHfClient() {
  if (!hfClient) {
    const token = process.env.HF_TOKEN
    if (!token) {
      throw new Error('HF_TOKEN is required to embed queries. Set it in your environment.')
    }
    hfClient = new HfInference(token)
  }

  return hfClient
}

async function embedQuery(text: string): Promise<QueryEmbedding> {
  const client = await getHfClient()
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('Cannot embed empty query')
  }

  const result = await client.featureExtraction({
    model: MODEL_ID,
    inputs: trimmed.slice(0, 2000),
  })

  const vector = Array.isArray(result[0]) ? (result[0] as Vector) : (result as unknown as Vector)
  const norm = vectorNorm(vector)

  return { vector, norm }
}

function cosineSimilarity(query: QueryEmbedding, target: LoadedVector) {
  const denominator = query.norm * target.norm
  if (denominator === 0) {
    return 0
  }

  const dot = query.vector.reduce((sum, value, index) => sum + value * target.embedding[index], 0)
  return dot / denominator
}

export interface RetrievalResult {
  fragments: RetrievedFragment[]
  pieces: RetrievedPiece[]
}

export async function retrieveContext(query: string, options: RetrievalOptions = {}): Promise<RetrievalResult> {
  const trimmed = query.trim()
  if (!trimmed) {
    return { fragments: [], pieces: [] }
  }

  const [store, fragmentMap, allPieces, queryEmbedding] = await Promise.all([
    loadEmbeddingStore(),
    getFragmentMap(),
    getPiecesCached(),
    embedQuery(trimmed),
  ])

  const limitFragments = options.limitFragments ?? 6
  const limitPieces = options.limitPieces ?? 3
  const minScore = options.minScore ?? 0
  const filterSet = options.filterPieceIds ? new Set(options.filterPieceIds) : null

  const fragmentScores = store.fragments
    .filter((record) => (filterSet ? filterSet.has(record.pieceId) : true))
    .map((record) => ({
      record,
      score: cosineSimilarity(queryEmbedding, record),
    }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limitFragments)

  const fragments: RetrievedFragment[] = fragmentScores
    .map(({ record, score }) => {
      const fragment = fragmentMap.get(record.id)
      if (!fragment) {
        return null
      }
      return { fragment, score }
    })
    .filter(Boolean) as RetrievedFragment[]

  const pieceMap = new Map(allPieces.map((piece) => [piece.slug, piece]))
  const pieceScores = store.pieceEmbeddings
    .filter((record) => (filterSet ? filterSet.has(record.pieceId) : true))
    .map((record) => ({
      record,
      score: cosineSimilarity(queryEmbedding, record),
    }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limitPieces)

  const pieces: RetrievedPiece[] = pieceScores
    .map(({ record, score }) => {
      const piece = pieceMap.get(record.pieceSlug)
      if (!piece) {
        return null
      }
      return { piece, score }
    })
    .filter(Boolean) as RetrievedPiece[]

  return {
    fragments,
    pieces,
  }
}
