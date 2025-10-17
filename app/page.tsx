import TacticalBlog from '@/components/tactical-blog'
import { getPieces } from '@/lib/pieces'

export default async function Page() {
  const pieces = await getPieces()

  return <TacticalBlog pieces={pieces} />
}
