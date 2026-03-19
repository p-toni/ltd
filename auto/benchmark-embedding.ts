import { getPieceFragments, getPieces } from '../lib/pieces'

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n)
}

function chunk<T>(input: T[], size: number): T[][] {
  const result: T[][] = []
  for (let index = 0; index < input.length; index += size) {
    result.push(input.slice(index, index + size))
  }
  return result
}

async function main() {
  const startMs = nowMs()
  const [pieces, fragments] = await Promise.all([getPieces(), getPieceFragments()])

  const fragmentInputs = fragments.map((fragment) => ({
    id: fragment.id,
    text: fragment.text.slice(0, 2000),
    pieceId: fragment.pieceId,
    pieceSlug: fragment.pieceSlug,
    pieceTitle: fragment.pieceTitle,
    fragmentOrder: fragment.order,
  }))

  const pieceInputs = pieces.map((piece) => ({
    id: piece.slug,
    text: [piece.title, piece.excerpt, piece.content.slice(0, 1200)].join('\n\n').slice(0, 2000),
    pieceId: piece.id,
    pieceSlug: piece.slug,
    pieceTitle: piece.title,
    fragmentOrder: 0,
  }))

  const fragmentBatches = chunk(fragmentInputs, 16)
  const pieceBatches = chunk(pieceInputs, 16)

  const merged = new Map<string, { id: string; pieceId: number }>()
  for (const batch of [...fragmentBatches, ...pieceBatches]) {
    for (const item of batch) {
      merged.set(item.id, { id: item.id, pieceId: item.pieceId })
    }
  }

  const elapsedMs = nowMs() - startMs
  const totalItems = fragmentInputs.length + pieceInputs.length
  const throughput = elapsedMs > 0 ? Math.floor((totalItems * 1000) / elapsedMs) : totalItems

  console.log(`embedding prep benchmark: items=${totalItems} batches=${fragmentBatches.length + pieceBatches.length} merged=${merged.size} ms=${elapsedMs}`)
  console.log(`METRIC embedding_prep_ms=${elapsedMs}`)
  console.log(`METRIC embedding_items_per_s=${throughput}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
