import { getPieceFragments, getPieces } from '../lib/pieces'

const ITERATIONS = 200
const BATCH_SIZE = 16

function nowMs() {
  return Number(process.hrtime.bigint() / BigInt(1000000))
}

function chunk<T>(input: T[], size: number): T[][] {
  const result: T[][] = []
  for (let index = 0; index < input.length; index += size) {
    result.push(input.slice(index, index + size))
  }
  return result
}

async function runIteration() {
  const startMs = nowMs()
  let peakRssBytes = process.memoryUsage().rss
  let totalItems = 0

  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
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

    const fragmentBatches = chunk(fragmentInputs, BATCH_SIZE)
    const pieceBatches = chunk(pieceInputs, BATCH_SIZE)
    const merged = new Map<string, { id: string; pieceId: number }>()

    for (const batch of [...fragmentBatches, ...pieceBatches]) {
      for (const item of batch) {
        merged.set(item.id, { id: item.id, pieceId: item.pieceId })
      }
    }

    totalItems += merged.size
    const rss = process.memoryUsage().rss
    if (rss > peakRssBytes) {
      peakRssBytes = rss
    }
  }

  const elapsedMs = nowMs() - startMs
  const itemsPerSecond = elapsedMs > 0 ? Math.round((totalItems * 1000) / elapsedMs) : totalItems

  return {
    elapsedMs,
    itemsPerSecond,
    peakRssMb: Math.round(peakRssBytes / (1024 * 1024)),
    totalItems,
  }
}

async function main() {
  const result = await runIteration()
  console.log(`embedding benchmark: iterations=${ITERATIONS} items=${result.totalItems} ms=${result.elapsedMs} items_per_s=${result.itemsPerSecond} peak_rss_mb=${result.peakRssMb}`)
  console.log(`METRIC embedding_items_per_s=${result.itemsPerSecond}`)
  console.log(`METRIC embedding_peak_rss_mb=${result.peakRssMb}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
