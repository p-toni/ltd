'use client'

import { useTacticalBlogContext } from '@/components/tactical-blog-provider'

export function CornerMark() {
  const { selectedPieceId } = useTacticalBlogContext()

  const now = new Date()
  const dateStamp = `${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`

  return (
    <div
      className="fixed top-[14px] right-6 z-30 flex flex-col items-end gap-[6px] transition-opacity duration-500"
      style={{ opacity: selectedPieceId ? 0.25 : 0.7 }}
    >
      {/* Type specimen strip — one glyph per typeface */}
      <div className="flex items-baseline gap-[10px]">
        <span className="font-serif italic text-[13px] leading-none text-text-tertiary select-none">
          Ag
        </span>
        <span className="font-sans text-[11px] font-medium leading-none text-text-tertiary select-none">
          Ag
        </span>
        <span className="font-mono text-[10px] leading-none text-text-tertiary select-none">
          Ag
        </span>
      </div>

      {/* Accent swatch + date */}
      <div className="flex items-center gap-[6px]">
        <span className="block w-[6px] h-[6px] bg-accent" />
        <span className="font-mono text-[9px] tracking-[0.06em] text-text-tertiary/60 select-none">
          {dateStamp}
        </span>
      </div>
    </div>
  )
}
