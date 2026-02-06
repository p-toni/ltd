'use client'

import { useTacticalBlogContext } from '@/components/tactical-blog-provider'

export function PieceIndex() {
  const { sortedPieces, setSelectedPieceId } = useTacticalBlogContext()

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {sortedPieces.map((piece, index) => {
        const numeral = String(piece.id).padStart(3, '0')
        const date = new Date(piece.publishedAt)
        const dateStr = Number.isFinite(date.getTime())
          ? `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
          : piece.date
        const moodLabel = piece.mood.map((m) => m.toUpperCase()).join(' · ')

        return (
          <button
            key={piece.id}
            type="button"
            onClick={() => setSelectedPieceId(piece.id)}
            className="group w-full text-left border-b border-border-strong px-8 py-8 hover:bg-surface transition-none"
          >
            <div className="flex items-start gap-6 max-w-[960px]">
              {/* Ghost numeral */}
              <span className="font-serif italic text-[32px] leading-none text-text-tertiary/20 select-none shrink-0 pt-1">
                {numeral}
              </span>

              <div className="flex-1 min-w-0">
                {/* Title */}
                <h2 className="font-serif text-[36px] leading-[1.15] text-text group-hover:text-accent transition-none">
                  {piece.title}
                </h2>

                {/* Excerpt */}
                {piece.excerpt && (
                  <p className="mt-2 font-sans italic text-base text-text-secondary line-clamp-2">
                    {piece.excerpt}
                  </p>
                )}

                {/* Metadata */}
                <div className="mt-3 font-mono text-[12px] uppercase tracking-[0.04em] text-text-tertiary">
                  {dateStr} · {piece.readTime} · {piece.wordCount.toLocaleString()} WORDS · {moodLabel}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
