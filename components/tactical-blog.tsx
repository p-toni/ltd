import type { Piece } from '@/lib/pieces'
import { ENABLE_MOBILE_LAYOUT } from '@/lib/feature-flags'
import { TacticalBlogDesktop } from '@/components/tactical-blog-desktop'
import { TacticalBlogProvider } from '@/components/tactical-blog-provider'
import { TacticalBlogWrapper } from '@/components/tactical-blog-wrapper'

interface TacticalBlogProps {
  pieces: Piece[]
}

export default function TacticalBlog({ pieces }: TacticalBlogProps) {
  if (!ENABLE_MOBILE_LAYOUT) {
    return (
      <TacticalBlogProvider pieces={pieces}>
        <TacticalBlogDesktop />
      </TacticalBlogProvider>
    )
  }

  return <TacticalBlogWrapper pieces={pieces} />
}
