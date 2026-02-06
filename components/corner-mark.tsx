'use client'

import { useTacticalBlogContext } from '@/components/tactical-blog-provider'

export function CornerMark() {
  const { selectedPieceId } = useTacticalBlogContext()

  const now = new Date()
  const dateStamp = `${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`

  return (
    <div
      className="fixed top-3 right-8 z-30 flex flex-col items-end transition-opacity duration-500"
      style={{ opacity: selectedPieceId ? 0.4 : 1 }}
    >
      {/* Brand initial — the mark */}
      <div className="flex items-baseline leading-none">
        <span className="font-serif italic text-[52px] text-text select-none tracking-[-0.04em]">
          T
        </span>
        <span className="text-[52px] text-accent select-none leading-none font-serif" style={{ marginLeft: -2 }}>
          .
        </span>
      </div>

      {/* Rule + date */}
      <div className="flex items-center gap-2 -mt-1">
        <span className="block w-10 h-px bg-accent" />
        <span className="font-mono text-[10px] tracking-[0.08em] text-text-tertiary select-none uppercase">
          {dateStamp}
        </span>
      </div>
    </div>
  )
}
