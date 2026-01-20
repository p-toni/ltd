'use client'

import { useRef, useEffect, memo, useMemo } from 'react'
import type { Piece } from '@/lib/pieces'

interface CitationNetworkGraphProps {
  pieces: Piece[]
  activePieceId?: number
  onPieceClick?: (pieceId: number) => void
  className?: string
}

interface Node {
  id: number
  x: number
  y: number
  piece: Piece
}

interface Edge {
  from: number
  to: number
}

export const CitationNetworkGraph = memo(function CitationNetworkGraph({ pieces, activePieceId, onPieceClick, className = '' }: CitationNetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Memoize edges calculation
  const edges = useMemo(() => {
    const result: Edge[] = []
    for (const piece of pieces) {
      if (piece.citations) {
        for (const citedId of piece.citations) {
          result.push({ from: piece.id, to: citedId })
        }
      }
    }
    return result
  }, [pieces])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = container.clientWidth
    const height = container.clientHeight

    // Simple circular layout
    const nodes: Node[] = pieces.map((piece, index) => {
      const angle = (index / pieces.length) * Math.PI * 2 - Math.PI / 2
      const radius = Math.min(width, height) * 0.35
      const centerX = width / 2
      const centerY = height / 2

      return {
        id: piece.id,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        piece,
      }
    })

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Draw edges (citation arrows)
    ctx.strokeStyle = 'oklch(0.45 0.02 0)'
    ctx.lineWidth = 1
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from)
      const toNode = nodes.find((n) => n.id === edge.to)

      if (fromNode && toNode) {
        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        ctx.lineTo(toNode.x, toNode.y)
        ctx.stroke()

        // Draw arrowhead
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x)
        const arrowSize = 8
        ctx.beginPath()
        ctx.moveTo(toNode.x, toNode.y)
        ctx.lineTo(
          toNode.x - arrowSize * Math.cos(angle - Math.PI / 6),
          toNode.y - arrowSize * Math.sin(angle - Math.PI / 6),
        )
        ctx.lineTo(
          toNode.x - arrowSize * Math.cos(angle + Math.PI / 6),
          toNode.y - arrowSize * Math.sin(angle + Math.PI / 6),
        )
        ctx.closePath()
        ctx.fill()
      }
    })

    // Draw nodes
    ctx.font = '8px JetBrains Mono'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    nodes.forEach((node) => {
      const isActive = node.id === activePieceId
      const citationCount = edges.filter((e) => e.to === node.id).length
      const nodeRadius = Math.max(8, Math.min(citationCount * 3 + 8, 20))

      // Draw node circle
      ctx.fillStyle = isActive ? 'oklch(0.65 0.19 45)' : '#000000'
      ctx.beginPath()
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2)
      ctx.fill()

      // Draw node label
      ctx.fillStyle = '#000000'
      ctx.fillText(`#${node.id}`, node.x, node.y - nodeRadius - 8)
    })
  }, [pieces, edges, activePieceId])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={containerRef.current?.clientWidth ?? 600}
        height={containerRef.current?.clientHeight ?? 400}
        className="cursor-pointer"
      />

      {/* Legend */}
      <div className="absolute bottom-2 right-2 rounded border border-black bg-background/90 p-2 font-mono text-[9px]">
        <div className="mb-1 font-semibold">CITATION NETWORK</div>
        <div className="space-y-0.5 text-muted-foreground">
          <div>● Node size = citations received</div>
          <div>→ Arrow = cites relationship</div>
        </div>
      </div>
    </div>
  )
})
