import { buildFragmentEmbeddingInputs, buildPieceEmbeddingInputs, forEachEmbeddingBatch } from '../lib/embedding'
import { getPieceFragments, getPieces } from '../lib/pieces'

const ITERATIONS = 200
const BATCH_SIZE = 16

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n)
}

async function runIteration() {
  const startMs = nowMs()
  let peakRssBytes = process.memoryUsage().rss
  let totalItems = 0

  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
    const [pieces, fragments] = await Promise.all([getPieces(), getPieceFragments()])

    const fragmentInputs = buildFragmentEmbeddingInputs(fragments)
    const pieceInputs = buildPieceEmbeddingInputs(pieces)
    const merged = new Map<string, { id: string; pieceId: number }>()

    await forEachEmbeddingBatch(fragmentInputs, BATCH_SIZE, (batch) => {
      for (const item of batch) {
        merged.set(item.id, { id: item.id, pieceId: item.pieceId })
      }
    })

    await forEachEmbeddingBatch(pieceInputs, BATCH_SIZE, (batch) => {
      for (const item of batch) {
        merged.set(item.id, { id: item.id, pieceId: item.pieceId })
      }
    })

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
