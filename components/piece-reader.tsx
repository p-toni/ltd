'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Markdown } from '@/components/markdown'
import { useTacticalBlogContext } from '@/components/tactical-blog-provider'

export function PieceReader() {
  const { selectedPiece } = useTacticalBlogContext()
  const contentRef = useRef<HTMLDivElement>(null)
  const [readingProgress, setReadingProgress] = useState(0)

  const handleScroll = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const max = scrollHeight - clientHeight
    setReadingProgress(max > 0 ? Math.min(scrollTop / max, 1) : 0)
  }, [])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
      setReadingProgress(0)
    }
  }, [selectedPiece?.id])

  if (!selectedPiece) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="font-serif italic text-[2.5rem] leading-tight text-text-tertiary/30 mb-4">
            &ldquo;&rdquo;
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
            Choose a piece from the left
          </p>
        </div>
      </div>
    )
  }

  const numeral = String(selectedPiece.id).padStart(3, '0')
  const date = new Date(selectedPiece.publishedAt)
  const dateStr = Number.isFinite(date.getTime())
    ? `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
    : selectedPiece.date
  const moodLabel = selectedPiece.mood.map((m) => m.toUpperCase()).join(' · ')

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Reading progress bar */}
      <div className="h-[2px] bg-border w-full shrink-0">
        <div
          className="h-full bg-accent transition-[width] duration-100 ease-linear"
          style={{ width: `${Math.round(readingProgress * 100)}%` }}
        />
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar piece-transition">
        <div className="max-w-[640px] mx-auto px-6">
          {/* Breathing top margin */}
          <div className="h-[120px]" />

          {/* Piece number — large ghost numeral */}
          <div className="reader-meta relative">
            <span className="absolute -left-2 -top-8 font-serif italic text-[7rem] leading-none text-text-tertiary/[0.04] select-none pointer-events-none">
              {numeral}
            </span>
            <span className="relative font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
              Piece {numeral}
            </span>
          </div>

          {/* Title */}
          <h1 className="reader-title mt-5 font-serif text-[3rem] leading-[1.08] tracking-[-0.03em] text-text">
            {selectedPiece.title}
          </h1>

          {/* Accent gradient line */}
          <div className="reader-divider mt-6 h-[2px] w-[80px] bg-gradient-to-r from-accent to-transparent" />

          {/* Excerpt */}
          {selectedPiece.excerpt && (
            <p className="reader-meta mt-6 font-serif italic text-lg text-text-secondary leading-relaxed">
              {selectedPiece.excerpt}
            </p>
          )}

          {/* Metadata bar */}
          <div className="reader-meta mt-6 font-mono text-[11px] uppercase tracking-[0.04em] text-text-tertiary">
            {dateStr} · {selectedPiece.readTime} · {selectedPiece.wordCount.toLocaleString()} words · {moodLabel}
          </div>

          {/* Full-bleed divider */}
          <div className="mt-8 mb-10 h-px bg-border-strong" />

          {/* Body — first paragraph gets a drop cap */}
          <div className="reader-body pb-24 [&>div>p:first-of-type]:drop-cap">
            <Markdown content={selectedPiece.content} pieceId={selectedPiece.id} headingVariant="ascii" />
          </div>

          {/* End flourish */}
          <div className="flex flex-col items-center gap-4 pb-32">
            <div className="flex items-center gap-3">
              <span className="block w-6 h-px bg-accent/40" />
              <span className="font-serif italic text-lg text-accent/60">fin</span>
              <span className="block w-6 h-px bg-accent/40" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary/50">
              Piece {numeral} · {selectedPiece.wordCount.toLocaleString()} words
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
