'use client'

import type { Piece } from '@/lib/pieces'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { TacticalBlogProvider } from '@/components/tactical-blog-provider'
import { TacticalBlogMobile } from '@/components/tactical-blog-mobile'
import SystemDashboard from '@/components/system-dashboard'

interface SystemDashboardWrapperProps {
  pieces: Piece[]
  contextById: Record<number, number>
}

export default function SystemDashboardWrapper({ pieces, contextById }: SystemDashboardWrapperProps) {
  const isMobile = useBreakpoint('(max-width: 767px)')

  if (isMobile) {
    return (
      <TacticalBlogProvider pieces={pieces}>
        <TacticalBlogMobile />
      </TacticalBlogProvider>
    )
  }

  return <SystemDashboard pieces={pieces} contextById={contextById} />
}
