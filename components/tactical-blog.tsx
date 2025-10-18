'use client'

import type { Piece } from '@/lib/pieces'

import { TacticalBlogProvider } from '@/components/tactical-blog-provider'
import { TacticalBlogDesktop } from '@/components/tactical-blog-desktop'

interface TacticalBlogProps {
  pieces: Piece[]
}

export default function TacticalBlog({ pieces }: TacticalBlogProps) {
  return (
    <TacticalBlogProvider pieces={pieces}>
      <TacticalBlogDesktop />
    </TacticalBlogProvider>
  )
}
