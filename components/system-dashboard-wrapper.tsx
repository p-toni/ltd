'use client'

import type { Piece } from '@/lib/pieces'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { TacticalBlogProvider } from '@/components/tactical-blog-provider'
import { TacticalBlogMobile } from '@/components/tactical-blog-mobile'
import { SwissLayout } from '@/components/swiss-layout'

interface SystemDashboardWrapperProps {
  pieces: Piece[]
  initialPieceId?: number | null
}

export default function SystemDashboardWrapper({ pieces, initialPieceId }: SystemDashboardWrapperProps) {
  const isMobile = useBreakpoint('(max-width: 767px)')

  if (isMobile) {
    return (
      <TacticalBlogProvider pieces={pieces} initialPieceId={initialPieceId}>
        <TacticalBlogMobile />
      </TacticalBlogProvider>
    )
  }

  return (
    <TacticalBlogProvider pieces={pieces} initialPieceId={initialPieceId}>
      <SwissLayout />
    </TacticalBlogProvider>
  )
}
