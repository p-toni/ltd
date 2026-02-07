'use client'

import { useTacticalBlogContext } from '@/components/tactical-blog-provider'

export function PieceIndex() {
  const { sortedPieces, setSelectedPieceId } = useTacticalBlogContext()

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {/* Index header */}
      <div className="px-8 pt-12 pb-6 max-w-[960px]">
        <span className="font-mono text-[12px] leading-[16px] uppercase tracking-[0.06em] text-text-tertiary">
          {sortedPieces.length} Pieces
        </span>
      </div>

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
            className="stagger-item group w-full text-left border-b border-border px-8 py-8 hover:bg-surface transition-colors duration-200"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <div className="flex items-start gap-6 max-w-[960px]">
              {/* Ghost numeral */}
              <span className="font-serif italic text-[48px] leading-[48px] text-text-tertiary/10 group-hover:text-accent/20 select-none shrink-0 pt-1 transition-colors duration-300">
                {numeral}
              </span>

              <div className="flex-1 min-w-0">
                {/* Title */}
                <h2 className="font-serif text-[36px] leading-[40px] text-text group-hover:text-text transition-colors duration-200">
                  {piece.title}
                </h2>

                {/* Accent line — grows on hover */}
                <div className="index-accent-line mt-3 h-[2px] bg-accent" />

                {/* Excerpt */}
                {piece.excerpt && (
                  <p className="mt-3 font-sans italic text-base text-text-secondary line-clamp-2 group-hover:text-text-secondary transition-colors duration-200">
                    {piece.excerpt}
                  </p>
                )}

                {/* Metadata */}
                <div className="mt-3 font-mono text-[12px] leading-[16px] uppercase tracking-[0.04em] text-text-tertiary">
                  {dateStr} · {piece.readTime} · {piece.wordCount.toLocaleString()} words · {moodLabel}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
