'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { Piece } from '@/lib/pieces'

import {
  type TacticalBlogExperience,
  useTacticalBlogExperience,
} from '@/hooks/use-tactical-blog-experience'

const TacticalBlogContext = createContext<TacticalBlogExperience | null>(null)

interface TacticalBlogProviderProps {
  pieces: Piece[]
  initialPieceId?: number | null
  children: ReactNode
}

export function TacticalBlogProvider({ pieces, children, initialPieceId }: TacticalBlogProviderProps) {
  const value = useTacticalBlogExperience(pieces, { initialPieceId: initialPieceId ?? undefined })
  return <TacticalBlogContext.Provider value={value}>{children}</TacticalBlogContext.Provider>
}

export function useTacticalBlogContext() {
  const context = useContext(TacticalBlogContext)
  if (!context) {
    throw new Error('useTacticalBlogContext must be used within a TacticalBlogProvider')
  }
  return context
}
