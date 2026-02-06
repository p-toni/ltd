'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { PieceIndex } from '@/components/piece-index'
import { PieceReader } from '@/components/piece-reader'
import { RedThread } from '@/components/red-thread'
import { CommandBar } from '@/components/command-bar'
import { useTacticalBlogContext } from '@/components/tactical-blog-provider'
import { cn } from '@/lib/utils'

export function SwissLayout() {
  const { selectedPieceId, themeMode } = useTacticalBlogContext()
  const isLight = themeMode === 'light'

  useEffect(() => {
    const root = document.documentElement
    if (isLight) {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    } else {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    }
    return () => {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    }
  }, [isLight])

  return (
    <div className={cn('h-[100svh] w-full overflow-hidden', isLight ? 'dashboard-light' : '')}>
      <RedThread />
      <div className="grid h-full" style={{ gridTemplateColumns: '240px 1fr' }}>
        <Sidebar />
        <main className="flex flex-col overflow-hidden bg-bg">
          {selectedPieceId ? <PieceReader /> : <PieceIndex />}
        </main>
      </div>
      <CommandBar />
    </div>
  )
}
