import fs from 'node:fs/promises'
import path from 'node:path'

import { HfInference } from '@huggingface/inference'

import { getPieceFragments, getPieces, type Piece, type PieceFragment } from './pieces'
import { loadPublishedWikiSlugs } from '../scripts/research/wiki'

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
  wikiEmbeddings?: StoredEmbeddingRecord[]
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
  wikiEmbeddings: LoadedVector[]
}

export interface RetrievedFragment {
  fragment: PieceFragment
  score: number
}

export interface RetrievedPiece {
  piece: Piece
  score: number
}

export interface RetrievedWikiFragment {
  id: string
  wikiSlug: string
  title: string
  text: string
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

const MODEL_ID = 'sentence-transformers/all-MiniLM-L6-v2'
const EMBEDDING_PATH = path.join(process.cwd(), 'public', 'embeddings', 'pieces-v1.json')

let embeddingStorePromise: Promise<LoadedEmbeddingStore> | null = null
let fragmentMapPromise: Promise<Map<string, PieceFragment>> | null = null
let piecesPromise: Promise<Piece[]> | null = null
let publishedWikiSlugsPromise: Promise<Set<string>> | null = null
let hfClient: HfInference | null = null

function wikiPageKey(recordId: string) {
  // Embedding record IDs look like `wiki-{kind}-{id}-fragment-{order}`;
  // the page key is the same without the `-fragment-{order}` tail.
  return recordId.replace(/-fragment-\d+$/, '')
}

async function getPublishedWikiSlugs() {
  if (!publishedWikiSlugsPromise) {
    publishedWikiSlugsPromise = loadPublishedWikiSlugs()
  }
  return publishedWikiSlugsPromise
}

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

      const wikiEmbeddings = (payload.wikiEmbeddings ?? []).map((record) => ({
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
        wikiEmbeddings,
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export interface RetrievalResult {
  fragments: RetrievedFragment[]
  pieces: RetrievedPiece[]
  wikiFragments: RetrievedWikiFragment[]
}

export async function retrieveContext(query: string, options: RetrievalOptions = {}): Promise<RetrievalResult> {
  const trimmed = query.trim()
  if (!trimmed) {
    return { fragments: [], pieces: [], wikiFragments: [] }
  }

  const [store, fragmentMap, allPieces, publishedWikiSlugs, queryEmbedding] = await Promise.all([
    loadEmbeddingStore(),
    getFragmentMap(),
    getPiecesCached(),
    getPublishedWikiSlugs(),
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

  const wikiFragments: RetrievedWikiFragment[] = store.wikiEmbeddings
    .filter((record) => publishedWikiSlugs.has(wikiPageKey(record.id)))
    .map((record) => ({
      record,
      score: cosineSimilarity(queryEmbedding, record),
    }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limitFragments)
    .map(({ record, score }) => ({
      id: record.id,
      wikiSlug: record.pieceSlug,
      title: record.pieceTitle,
      text: '', // text is in the embedding record ID, resolved at render time
      score,
    }))

  return {
    fragments,
    pieces,
    wikiFragments,
  }
}

export async function getPieceEmbeddingContext(options: { neighbors?: number } = {}) {
  const store = await loadEmbeddingStore()
  const embeddings = store.pieceEmbeddings

  if (!embeddings.length) {
    return {} as Record<number, number>
  }

  const neighbors = Math.max(1, options.neighbors ?? 3)
  const scoresByPiece: Record<number, number> = {}

  embeddings.forEach((target) => {
    const similarities = embeddings
      .filter((candidate) => candidate.pieceId !== target.pieceId)
      .map((candidate) => cosineSimilarity({ vector: target.embedding, norm: target.norm }, candidate))
      .sort((a, b) => b - a)

    const top = similarities.slice(0, neighbors)
    const avg = top.length ? top.reduce((sum, value) => sum + value, 0) / top.length : 0
    scoresByPiece[target.pieceId] = clamp(1 - avg, 0, 1)
  })

  return scoresByPiece
}
