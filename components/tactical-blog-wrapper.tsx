'use client'

import { TacticalBlogDesktop } from '@/components/tactical-blog-desktop'
import { TacticalBlogMobile } from '@/components/tactical-blog-mobile'
import { TacticalBlogProvider } from '@/components/tactical-blog-provider'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import type { Piece } from '@/lib/pieces'

interface TacticalBlogWrapperProps {
  pieces: Piece[]
  initialPieceId?: number | null
}

export function TacticalBlogWrapper({ pieces, initialPieceId }: TacticalBlogWrapperProps) {
  const isMobile = useBreakpoint('(max-width: 767px)')

  return (
    <TacticalBlogProvider pieces={pieces} initialPieceId={initialPieceId}>
      {isMobile ? <TacticalBlogMobile /> : <TacticalBlogDesktop />}
    </TacticalBlogProvider>
  )
}

export default TacticalBlogWrapper
