'use client'

import { TacticalBlogDesktop } from '@/components/tactical-blog-desktop'
import { TacticalBlogMobile } from '@/components/tactical-blog-mobile'
import { TacticalBlogProvider } from '@/components/tactical-blog-provider'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import type { Piece } from '@/lib/pieces'

interface TacticalBlogWrapperProps {
  pieces: Piece[]
}

export function TacticalBlogWrapper({ pieces }: TacticalBlogWrapperProps) {
  const isMobile = useBreakpoint('(max-width: 767px)')

  return (
    <TacticalBlogProvider pieces={pieces}>
      {isMobile ? <TacticalBlogMobile /> : <TacticalBlogDesktop />}
    </TacticalBlogProvider>
  )
}

export default TacticalBlogWrapper
