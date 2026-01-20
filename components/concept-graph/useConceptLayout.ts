import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3-force'
import type { Piece } from '@/lib/pieces'
import type { Connection } from '@/lib/concept-geometry'

export interface GraphNode extends d3.SimulationNodeDatum {
  id: number
  piece: Piece
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  connection: Connection
}

export interface NodePosition {
  id: number
  x: number
  y: number
}

interface UseConceptLayoutProps {
  pieces: Piece[]
  connections: Connection[]
  width: number
  height: number
  enabled: boolean
}

/**
 * Custom force to cluster nodes by mood
 */
function forceCluster() {
  let nodes: GraphNode[]
  let strength = 0.1
  let width = 280
  let height = 600

  interface ClusterForce {
    (alpha: number): void
    initialize: (nodes: GraphNode[]) => void
    strength(): number
    strength(s: number): ClusterForce
    dimensions: (w: number, h: number) => ClusterForce
  }

  const force: ClusterForce = function (alpha: number) {
    for (const node of nodes) {
      if (!node.piece) continue

      // Get target position based on primary mood
      const primaryMood = node.piece.mood[0]
      const { x: targetX, y: targetY } = getMoodClusterCenter(primaryMood, width, height)

      // Apply force toward cluster center
      node.vx = (node.vx || 0) + (targetX - (node.x || 0)) * strength * alpha
      node.vy = (node.vy || 0) + (targetY - (node.y || 0)) * strength * alpha
    }
  } as ClusterForce

  force.initialize = function (_: GraphNode[]) {
    nodes = _
  }

  force.strength = function (_?: number) {
    if (arguments.length) {
      strength = +_!
      return force
    }
    return strength
  } as typeof force.strength

  force.dimensions = function (w: number, h: number) {
    width = w
    height = h
    return force
  }

  return force
}

/**
 * Get cluster center position for a mood
 */
function getMoodClusterCenter(
  mood: string,
  width: number,
  height: number,
): {
  x: number
  y: number
} {
  const centerX = width / 2
  const centerY = height / 2
  const offset = Math.min(width, height) * 0.25

  switch (mood) {
    case 'analytical':
      return { x: centerX - offset, y: centerY - offset }
    case 'exploratory':
      return { x: centerX + offset, y: centerY - offset }
    case 'contemplative':
      return { x: centerX - offset, y: centerY + offset }
    case 'critical':
      return { x: centerX + offset, y: centerY + offset }
    default:
      return { x: centerX, y: centerY }
  }
}

/**
 * Hook to manage force-directed graph layout
 */
export function useConceptLayout({
  pieces,
  connections,
  width,
  height,
  enabled,
}: UseConceptLayoutProps): Map<number, NodePosition> {
  const [positions, setPositions] = useState<Map<number, NodePosition>>(new Map())
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)

  useEffect(() => {
    if (!enabled || pieces.length === 0) {
      return
    }

    // Initialize nodes
    const nodes: GraphNode[] = pieces.map((piece) => {
      const existing = positions.get(piece.id)
      return {
        id: piece.id,
        piece,
        x: existing?.x ?? width / 2 + (Math.random() - 0.5) * 100,
        y: existing?.y ?? height / 2 + (Math.random() - 0.5) * 100,
      }
    })

    // Initialize links
    const links: GraphLink[] = connections.map((conn) => ({
      source: conn.source,
      target: conn.target,
      connection: conn,
    }))

    // Create simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((d) => 100 / (d.connection.strength + 0.1)) // Stronger = closer
          .strength(0.3),
      )
      .force('charge', d3.forceManyBody<GraphNode>().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<GraphNode>().radius((d) => {
          // Node radius based on word count
          const baseRadius = Math.sqrt(d.piece.wordCount / 100)
          return Math.max(8, Math.min(baseRadius, 30)) + 20 // + padding
        }),
      )
      .force('cluster', forceCluster().strength(0.1).dimensions(width, height))
      .alphaDecay(0.02) // Slower decay for smoother animation
      .on('tick', () => {
        const newPositions = new Map<number, NodePosition>()
        for (const node of nodes) {
          newPositions.set(node.id, {
            id: node.id,
            x: node.x ?? 0,
            y: node.y ?? 0,
          })
        }
        setPositions(newPositions)
      })

    simulationRef.current = simulation

    return () => {
      simulation.stop()
    }
  }, [pieces, connections, width, height, enabled])

  return positions
}
