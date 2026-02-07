'use client'

import { useEffect, useRef } from 'react'
import { useTacticalBlogContext } from '@/components/tactical-blog-provider'

function useLissajous(svgRef: React.RefObject<SVGSVGElement | null>) {
  const frameRef = useRef(0)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const path = svg.querySelector('path') as SVGPathElement | null
    if (!path) return

    let t = Date.now() / 1000

    function draw() {
      if (!path || !svg) return

      t = Date.now() / 1000

      // Slowly evolving parameters — phase and frequency drift over time
      const freqA = 2 + Math.sin(t * 0.07) * 1.2
      const freqB = 3 + Math.cos(t * 0.05) * 1.5
      const phase = t * 0.15
      const rotation = t * 3 // slow rotation in degrees

      const cx = 44
      const cy = 44
      const rx = 30
      const ry = 30
      const segments = 180
      const points: string[] = []

      for (let i = 0; i <= segments; i++) {
        const s = (i / segments) * Math.PI * 2
        const x = cx + rx * Math.sin(freqA * s + phase)
        const y = cy + ry * Math.sin(freqB * s)
        points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      }

      path.setAttribute('d', points.join(' ') + 'Z')
      svg.style.transform = `rotate(${rotation % 360}deg)`

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [svgRef])
}

export function CornerMark() {
  const { selectedPieceId, toggleGrid } = useTacticalBlogContext()
  const svgRef = useRef<SVGSVGElement>(null)

  useLissajous(svgRef)

  const now = new Date()
  const dateStamp = `${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`

  return (
    <div
      className="fixed top-2 right-6 z-30 flex flex-col items-center transition-opacity duration-500 cursor-pointer"
      style={{ opacity: selectedPieceId ? 0.5 : 1 }}
      onClick={toggleGrid}
    >
      {/* Morphing Lissajous behind the T */}
      <div className="relative w-[88px] h-[88px]">
        <svg
          ref={svgRef}
          viewBox="0 0 88 88"
          className="absolute inset-0 w-full h-full"
          style={{ transition: 'transform 0.1s linear' }}
        >
          <path
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1"
            strokeOpacity="0.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* T. centered over the shape */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-baseline leading-none">
            <span className="font-serif italic text-[36px] text-text select-none tracking-[-0.04em]">
              T
            </span>
            <span className="text-[36px] text-accent select-none leading-none font-serif" style={{ marginLeft: -1 }}>
              .
            </span>
          </div>
        </div>
      </div>

      {/* Date */}
      <span className="font-mono text-[10px] leading-[16px] tracking-[0.08em] text-text-tertiary select-none uppercase -mt-1">
        {dateStamp}
      </span>
    </div>
  )
}
