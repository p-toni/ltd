'use client'

import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react'
import * as d3 from 'd3'
import type { Piece } from '@/lib/pieces'
import {
  generateConnections,
  getConnectionStyle,
  getNodeRadius,
  type Connection,
} from '@/lib/concept-geometry'
import { useConceptLayout } from './useConceptLayout'

interface ConceptGraphProps {
  pieces: Piece[]
  activePieceId?: number
  onPieceClick?: (pieceId: number) => void
  className?: string
}

export const ConceptGraph = memo(function ConceptGraph({ pieces, activePieceId, onPieceClick, className = '' }: ConceptGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 280, height: 600 })
  const [hoveredPieceId, setHoveredPieceId] = useState<number | null>(null)

  // Memoize expensive connections calculation
  const connections = useMemo(() => generateConnections(pieces, 0.3), [pieces])

  // Use force-directed layout
  const positions = useConceptLayout({
    pieces,
    connections,
    width: dimensions.width,
    height: dimensions.height,
    enabled: true,
  })

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Memoize zone color lookup
  const getZoneColor = useCallback((mood: string) => {
    switch (mood) {
      case 'contemplative':
        return 'oklch(0.97 0.005 260)' // subtle blue (water)
      case 'exploratory':
        return 'oklch(0.97 0.005 140)' // subtle green (park)
      case 'analytical':
        return 'oklch(0.97 0.005 45)' // subtle orange (urban)
      case 'critical':
        return 'oklch(0.97 0.005 0)' // subtle red
      default:
        return 'transparent'
    }
  }, [])

  // Render SVG
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height } = dimensions
    const g = svg.append('g')

    // Check if positions are ready
    const allPositioned = pieces.every((p) => positions.get(p.id))
    if (!allPositioned) return

    // Layer 0: Background grid (subtle)
    g.append('g')
      .attr('opacity', 0.05)
      .selectAll('line.grid-vertical')
      .data(d3.range(0, width, 40))
      .join('line')
      .attr('x1', (d) => d)
      .attr('y1', 0)
      .attr('x2', (d) => d)
      .attr('y2', height)
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)

    g.append('g')
      .attr('opacity', 0.05)
      .selectAll('line.grid-horizontal')
      .data(d3.range(0, height, 40))
      .join('line')
      .attr('x1', 0)
      .attr('y1', (d) => d)
      .attr('x2', width)
      .attr('y2', (d) => d)
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)

    // Layer 1: Voronoi Districts (zones)
    const points: [number, number][] = []
    const pieceMap = new Map<number, Piece>()

    pieces.forEach((piece) => {
      const pos = positions.get(piece.id)
      if (pos) {
        points.push([pos.x, pos.y])
        pieceMap.set(points.length - 1, piece)
      }
    })

    if (points.length > 0) {
      const delaunay = d3.Delaunay.from(points)
      const voronoi = delaunay.voronoi([0, 0, width, height])

      g.append('g')
        .selectAll('path.district')
        .data(Array.from(pieceMap.entries()))
        .join('path')
        .attr('class', 'district')
        .attr('d', ([index]) => voronoi.renderCell(index))
        .attr('fill', ([_, piece]) => getZoneColor(piece.mood[0]))
        .attr('fill-opacity', ([_, piece]) => (piece.id === activePieceId ? 0.4 : 0.12))
        .attr('stroke', 'white')
        .attr('stroke-opacity', 0.05)
        .attr('stroke-width', 1)
        .style('transition', 'all 0.4s ease')
    }

    // Layer 2: Topographic contour lines
    const topoLines = d3.range(5, Math.max(width, height), 80)
    g.append('g')
      .selectAll('circle.topo')
      .data(topoLines)
      .join('circle')
      .attr('class', 'topo')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', (d) => d)
      .attr('fill', 'none')
      .attr('stroke', 'white')
      .attr('stroke-width', 0.3)
      .attr('opacity', 0.08)

    // Layer 3: Connection links with curves and flow particles
    const linkGroup = g.append('g').attr('class', 'links')

    connections.forEach((conn) => {
      const sourcePos = positions.get(conn.source)
      const targetPos = positions.get(conn.target)
      if (!sourcePos || !targetPos) return

      const style = getConnectionStyle(conn)

      // Calculate control point for quadratic curve
      const midX = (sourcePos.x + targetPos.x) / 2
      const midY = (sourcePos.y + targetPos.y) / 2
      const dx = targetPos.x - sourcePos.x
      const dy = targetPos.y - sourcePos.y
      const perpX = -dy * 0.15
      const perpY = dx * 0.15
      const controlX = midX + perpX
      const controlY = midY + perpY

      // Create curved path
      const pathData = `M ${sourcePos.x},${sourcePos.y} Q ${controlX},${controlY} ${targetPos.x},${targetPos.y}`

      // The link line
      const pathElement = linkGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', style.color)
        .attr('stroke-width', style.lineWidth)
        .attr('opacity', style.opacity)

      // Flow particle animation
      const particleSize = style.lineWidth > 2 ? 1.5 : 0.8
      const duration = style.lineWidth > 2 ? 2000 : 4000

      const animateParticle = () => {
        if (!svgRef.current) return

        const particle = linkGroup
          .append('circle')
          .attr('r', particleSize)
          .attr('fill', 'oklch(0.65 0.19 45)') // te-orange
          .attr('opacity', 0.8)

        const pathNode = pathElement.node() as SVGPathElement
        if (!pathNode) return

        const totalLength = pathNode.getTotalLength()

        particle
          .transition()
          .duration(duration)
          .ease(d3.easeLinear)
          .attrTween('transform', () => (t: number) => {
            const p = pathNode.getPointAtLength(t * totalLength)
            return `translate(${p.x}, ${p.y})`
          })
          .on('end', () => {
            particle.remove()
            if (svgRef.current) {
              setTimeout(animateParticle, Math.random() * 2000)
            }
          })
      }

      // Start particle animation
      setTimeout(animateParticle, Math.random() * 2000)
    })

    // Layer 4: Nodes
    pieces.forEach((piece) => {
      const pos = positions.get(piece.id)
      if (!pos) return

      const radius = getNodeRadius(piece)
      const isActive = piece.id === activePieceId
      const isHovered = piece.id === hoveredPieceId

      const nodeG = g.append('g').attr('transform', `translate(${pos.x}, ${pos.y})`)

      const color = isActive ? 'oklch(0.65 0.19 45)' : 'white'
      const size = radius * (isActive ? 1.5 : 1)

      // Halo for active/hovered
      if (isActive || isHovered) {
        nodeG
          .append('circle')
          .attr('r', size * 1.8)
          .attr('fill', color)
          .attr('opacity', isActive ? 0.3 : 0.15)
          .style('transition', 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)')
      }

      // Node circle
      nodeG
        .append('circle')
        .attr('r', size)
        .attr('fill', color)
        .attr('opacity', 0.9)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredPieceId(piece.id))
        .on('mouseleave', () => setHoveredPieceId(null))
        .on('click', () => onPieceClick?.(piece.id))

      // Text label
      nodeG
        .append('text')
        .text(piece.title.toUpperCase())
        .attr('font-size', isActive ? '9px' : '7px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', isActive ? 'white' : 'white')
        .attr('dy', -size - 6)
        .attr('text-anchor', 'middle')
        .attr('opacity', isActive ? 1 : 0.6)
        .style('pointer-events', 'none')
        .style('transition', 'all 0.3s ease')
    })

    // Layer 5: Gradient fades (top and bottom)
    const defsId = `gradient-fades-${Math.random().toString(36).substr(2, 9)}`
    const defs = svg.append('defs')

    // Top gradient
    const topGradient = defs
      .append('linearGradient')
      .attr('id', `${defsId}-top`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    topGradient.append('stop').attr('offset', '0%').attr('stop-color', '#000000').attr('stop-opacity', 1)

    topGradient.append('stop').attr('offset', '100%').attr('stop-color', '#000000').attr('stop-opacity', 0)

    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height * 0.25)
      .attr('fill', `url(#${defsId}-top)`)
      .style('pointer-events', 'none')

    // Bottom gradient
    const bottomGradient = defs
      .append('linearGradient')
      .attr('id', `${defsId}-bottom`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')

    bottomGradient.append('stop').attr('offset', '0%').attr('stop-color', '#000000').attr('stop-opacity', 0)

    bottomGradient.append('stop').attr('offset', '100%').attr('stop-color', '#000000').attr('stop-opacity', 1)

    g.append('rect')
      .attr('x', 0)
      .attr('y', height * 0.75)
      .attr('width', width)
      .attr('height', height * 0.25)
      .attr('fill', `url(#${defsId}-bottom)`)
      .style('pointer-events', 'none')
  }, [dimensions, pieces, connections, positions, activePieceId, hoveredPieceId, onPieceClick])

  return (
    <div ref={containerRef} className={`relative bg-black ${className}`}>
      <svg ref={svgRef} className="w-full h-full" width={dimensions.width} height={dimensions.height} />
    </div>
  )
})
