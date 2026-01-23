import SystemDashboard from '@/components/system-dashboard'
import { getPieces } from '@/lib/pieces'
import { getPieceEmbeddingContext } from '@/lib/retrieval'

export default async function Page() {
  const pieces = await getPieces()
  let contextById: Record<number, number> = {}

  try {
    contextById = await getPieceEmbeddingContext()
  } catch (error) {
    console.warn('Embedding context unavailable:', error)
  }

  return <SystemDashboard pieces={pieces} contextById={contextById} />
}
