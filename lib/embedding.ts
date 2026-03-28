import type { Piece, PieceFragment } from './pieces'

export interface EmbeddingInput {
  id: string
  text: string
  pieceId: number
  pieceSlug: string
  pieceTitle: string
  fragmentOrder: number
}

export interface EmbeddingRecord {
  id: string
  pieceId: number
  pieceSlug: string
  pieceTitle: string
  fragmentOrder: number
  embedding: number[]
}

export function buildFragmentEmbeddingInputs(fragments: PieceFragment[]): EmbeddingInput[] {
  const inputs = new Array<EmbeddingInput>(fragments.length)

  for (let index = 0; index < fragments.length; index += 1) {
    const fragment = fragments[index]
    inputs[index] = {
      id: fragment.id,
      text: fragment.text.slice(0, 2000),
      pieceId: fragment.pieceId,
      pieceSlug: fragment.pieceSlug,
      pieceTitle: fragment.pieceTitle,
      fragmentOrder: fragment.order,
    }
  }

  return inputs
}

export function buildPieceEmbeddingInputs(pieces: Piece[]): EmbeddingInput[] {
  const inputs = new Array<EmbeddingInput>(pieces.length)

  for (let index = 0; index < pieces.length; index += 1) {
    const piece = pieces[index]
    inputs[index] = {
      id: piece.slug,
      text: `${piece.title}\n\n${piece.excerpt}\n\n${piece.content.slice(0, 1200)}`.slice(0, 2000),
      pieceId: piece.id,
      pieceSlug: piece.slug,
      pieceTitle: piece.title,
      fragmentOrder: 0,
    }
  }

  return inputs
}

export async function forEachEmbeddingBatch<T>(
  items: T[],
  batchSize: number,
  visit: (batch: T[], batchIndex: number, batchCount: number) => void | Promise<void>,
) {
  const batchCount = Math.ceil(items.length / batchSize)

  for (let start = 0, batchIndex = 0; start < items.length; start += batchSize, batchIndex += 1) {
    const batch = items.slice(start, start + batchSize)
    await visit(batch, batchIndex, batchCount)
  }
}

export function mergeEmbeddingRecords(existing: EmbeddingRecord[], fresh: EmbeddingRecord[]): EmbeddingRecord[] {
  const merged = new Map<string, EmbeddingRecord>()

  for (let index = 0; index < existing.length; index += 1) {
    const record = existing[index]
    merged.set(record.id, record)
  }

  for (let index = 0; index < fresh.length; index += 1) {
    const record = fresh[index]
    merged.set(record.id, record)
  }

  return Array.from(merged.values()).sort((a, b) => a.id.localeCompare(b.id))
}
