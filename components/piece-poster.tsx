'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Piece } from '@/lib/pieces'

interface PiecePosterProps {
  pieces: Piece[]
  selectedPiece: Piece | null
  theme?: 'noir' | 'blueprint' | 'ocean' | 'sunset' | 'midnight_blue' | 'data_visual'
}

const themes = {
  noir: {
    bg: '#0a0a0a',
    primary: '#ffffff',
    secondary: '#666666',
    accent: '#FF9408',
    data: '#ff6b35',
    cluster: '#4a5568'
  },
  blueprint: {
    bg: '#0a1929',
    primary: '#00d4ff',
    secondary: '#0066cc',
    accent: '#00ffff',
    data: '#39cccc',
    cluster: '#004d66'
  },
  ocean: {
    bg: '#001f3f',
    primary: '#0074d9',
    secondary: '#39cccc',
    accent: '#7fdbff',
    data: '#4169e1',
    cluster: '#003d5b'
  },
  sunset: {
    bg: '#2c1810',
    primary: '#ff6b35',
    secondary: '#f7931e',
    accent: '#ffd700',
    data: '#f7931e',
    cluster: '#cc4400'
  },
  midnight_blue: {
    bg: '#191970',
    primary: '#4169e1',
    secondary: '#6495ed',
    accent: '#87ceeb',
    data: '#87ceeb',
    cluster: '#1e3a8a'
  },
  data_visual: {
    bg: '#0a0a0a',
    primary: '#FF9408',
    secondary: '#CA3F16',
    accent: '#95122C',
    data: '#FF9408',
    cluster: '#CA3F16'
  }
}

const seededRandom = (seed: number) => {
  let t = Math.floor(seed) + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export default function PiecePoster({ pieces, selectedPiece, theme = 'data_visual' }: PiecePosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const { groups, moodDistribution } = useMemo(() => {
    const grouped = pieces.reduce<Record<string, Piece[]>>((acc, p) => {
      const primaryMood = p.mood[0] || 'neutral'
      if (!acc[primaryMood]) acc[primaryMood] = []
      acc[primaryMood].push(p)
      return acc
    }, {})

    const distribution = Object.keys(grouped).reduce((acc, mood) => {
      acc[mood] = grouped[mood].length
      return acc
    }, {} as Record<string, number>)

    return { groups: grouped, moodDistribution: distribution }
  }, [pieces])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const currentTheme = themes[theme]
    
    // Set canvas size for high resolution
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    canvas.style.width = `${canvas.offsetWidth}px`
    canvas.style.height = `${canvas.offsetHeight}px`
    ctx.scale(2, 2)

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    const generateCityPoster = (time: number = 0) => {
      // Clear canvas
      ctx.fillStyle = currentTheme.bg
      ctx.fillRect(0, 0, width, height)

      // Draw background grid (streets)
      const gridSpacing = Math.min(width, height) / 20
      for (let x = 0; x <= width; x += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.strokeStyle = currentTheme.secondary + '20'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
      for (let y = 0; y <= height; y += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.strokeStyle = currentTheme.secondary + '20'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Positions map
      const positions = new Map<Piece, {x: number, y: number, size: number}>()

      // Draw mood-based regions (city districts as vertical strips)
      const moods = Object.keys(moodDistribution).sort((a, b) => moodDistribution[b] - moodDistribution[a])
      let currentX = 0

      moods.forEach((mood) => {
        const count = moodDistribution[mood]
        const percentage = count / pieces.length
        const districtWidth = width * percentage
        const startX = currentX
        const endX = currentX + districtWidth

        // Determine region color
        let regionColor = currentTheme.data
        if (mood === 'contemplative') regionColor = currentTheme.primary
        else if (mood === 'analytical') regionColor = currentTheme.accent
        else if (mood === 'exploratory') regionColor = currentTheme.secondary
        else if (mood === 'critical') regionColor = '#ff4444'
        else if (mood === 'neutral') regionColor = currentTheme.cluster

        // Draw district background
        ctx.fillStyle = regionColor + '15'
        ctx.fillRect(startX, 0, districtWidth, height)

        // District border
        ctx.strokeStyle = currentTheme.secondary + '40'
        ctx.lineWidth = 0.5
        ctx.strokeRect(startX, 0, districtWidth, height)

        // Add mood label
        const labelX = startX + districtWidth / 2
        const labelY = height - 10
        ctx.fillStyle = currentTheme.primary + '60'
        ctx.font = '6px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(`${mood.toUpperCase()} (${count})`, labelX, labelY)

        // Place buildings in district
        const group = groups[mood]
        const numBuildings = group.length
        const cols = Math.ceil(Math.sqrt(numBuildings))
        const rows = Math.ceil(numBuildings / cols)
        const spacingX = districtWidth / (cols + 1)
        const spacingY = (height - 40) / (rows + 1) // offset for labels

        group.forEach((piece, idx) => {
          const col = idx % cols
          const row = Math.floor(idx / cols)
          const jitterSeed = piece.id * 2
          const jitterX = (seededRandom(jitterSeed) * 0.5 - 0.25) * spacingX
          const jitterY = (seededRandom(jitterSeed + 1) * 0.5 - 0.25) * spacingY
          const x = startX + spacingX * (col + 1) + jitterX
          const y = spacingY * (row + 1) + 20 + jitterY

          // Building size based on word count
          const baseSize = 3 + (piece.wordCount / 300)
          const pulse = Math.sin(time / 500 + idx) * 0.5 + 0.5
          const size = baseSize + (isAnimating ? pulse * 2 : 0)

          // Draw building
          ctx.fillStyle = piece.pinned ? currentTheme.accent : regionColor
          ctx.fillRect(x - size / 2, y - size / 2, size, size)
          
          // Add pulse effect if animating
          if (isAnimating) {
            ctx.globalAlpha = pulse * 0.3
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(x - size / 2, y - size / 2, size, size)
            ctx.globalAlpha = 1
          }

          // Building outline
          ctx.strokeStyle = currentTheme.secondary + '60'
          ctx.lineWidth = 0.5
          ctx.strokeRect(x - size / 2, y - size / 2, size, size)

          positions.set(piece, {x, y, size})
        })

        currentX = endX
      })

      // Draw temporal flow (curved paths connecting pieces in publication order)
      const sortedPieces = [...pieces].sort((a, b) => a.publishedAt - b.publishedAt)
      sortedPieces.forEach((piece, index) => {
        if (index === 0) return

        const pos = positions.get(piece)
        const prevPos = positions.get(sortedPieces[index - 1])
        if (!pos || !prevPos) return

        const {x, y} = pos
        const midX = (prevPos.x + x) / 2
        const midY = (prevPos.y + y) / 2
        const perpAngle = Math.atan2(y - prevPos.y, x - prevPos.x) + Math.PI / 2
        const offset = 10 + seededRandom(piece.id + 1000) * 10
        const cpX = midX + Math.cos(perpAngle) * offset
        const cpY = midY + Math.sin(perpAngle) * offset

        // Color based on recency
        let flowColor = currentTheme.secondary
        const ageInDays = (Date.now() - piece.publishedAt) / (1000 * 60 * 60 * 24)
        if (ageInDays < 30) flowColor = currentTheme.data
        else if (ageInDays < 90) flowColor = currentTheme.primary
        else flowColor = currentTheme.secondary

        ctx.beginPath()
        ctx.moveTo(prevPos.x, prevPos.y)
        ctx.quadraticCurveTo(cpX, cpY, x, y)
        ctx.strokeStyle = flowColor + '40'
        ctx.lineWidth = Math.max(0.5, piece.wordCount / 500)
        ctx.stroke()
      })

      // Highlight selected piece
      if (selectedPiece) {
        const pos = positions.get(selectedPiece)
        if (pos) {
          const {x, y, size} = pos
          ctx.beginPath()
          ctx.arc(x, y, size * 1.2, 0, Math.PI * 2)
          ctx.strokeStyle = currentTheme.accent + '80'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }

    const handleAnimation = (time: number) => {
      ctx.fillStyle = currentTheme.bg + '05'
      ctx.fillRect(0, 0, width, height)
      generateCityPoster(time)

      if (isAnimating) {
        requestAnimationFrame(handleAnimation)
      }
    }

    // Initial draw
    generateCityPoster()

    let animationFrame: number
    if (isAnimating) {
      animationFrame = requestAnimationFrame(handleAnimation)
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      setIsAnimating(false)
    }
  }, [pieces, selectedPiece, theme, isAnimating, groups, moodDistribution])

  return (
    <div className={`relative bg-background-dark p-3 ${theme === 'data_visual' ? 'border border-border-dark' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] text-[#666] font-mono">PIECE_CITY_POSTER</span>
        <button
          onMouseEnter={() => setIsAnimating(true)}
          onMouseLeave={() => setIsAnimating(false)}
          className="text-[8px] text-primary hover:text-white transition-colors font-mono"
        >
          [ANIMATE]
        </button>
      </div>
      
      <canvas
        ref={canvasRef}
        className="w-full aspect-[4/3] bg-panel-dark rounded-sm cursor-crosshair"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  )
}
