'use client'

import { useTacticalBlogContext } from '@/components/tactical-blog-provider'

export function GridOverlay() {
  const { showGrid } = useTacticalBlogContext()

  if (!showGrid) return null

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* 8px baseline lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--accent) 0px, transparent 1px, transparent 8px)',
          opacity: 0.06,
        }}
      />
      {/* 32px emphasis lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--accent) 0px, transparent 1px, transparent 32px)',
          opacity: 0.12,
        }}
      />
    </div>
  )
}
