import TacticalBlog from '@/components/tactical-blog'
import { getEssays } from '@/lib/essays'

export default async function Page() {
  const essays = await getEssays()

  return <TacticalBlog essays={essays} />
}
