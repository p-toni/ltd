'use client'

import { useTacticalBlogContext } from '@/components/tactical-blog-provider'

export function CornerMark() {
  const { selectedPieceId } = useTacticalBlogContext()

  const now = new Date()
  const dateStamp = `${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`

  return (
    <div
      className="fixed top-3 right-8 z-30 flex items-center gap-4 transition-opacity duration-500"
      style={{ opacity: selectedPieceId ? 0.5 : 1 }}
    >
      {/* Type specimen strip — one glyph per typeface, separated by hairlines */}
      <div className="flex items-baseline">
        <span className="font-serif italic text-[26px] leading-none text-text-secondary select-none pr-3 border-r border-border">
          Ag
        </span>
        <span className="font-sans text-[20px] font-medium leading-none text-text-secondary select-none px-3 border-r border-border">
          Ag
        </span>
        <span className="font-mono text-[16px] leading-none text-text-secondary select-none pl-3">
          Ag
        </span>
      </div>

      {/* Accent swatch + date */}
      <div className="flex flex-col items-center gap-1">
        <span className="block w-2.5 h-2.5 bg-accent" />
        <span className="font-mono text-[10px] tracking-[0.06em] text-text-tertiary select-none">
          {dateStamp}
        </span>
      </div>
    </div>
  )
}
