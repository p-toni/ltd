'use client'

import clsx from 'clsx'

import styles from '@/components/mobile/layout.module.css'

const DIGITS: Record<string, string[]> = {
  '0': ['████╗ ', '█╔═█║', '█║ █║', '█╚═█║', '╚████'],
  '1': [' ██╗ ', '███║ ', ' ╚█║ ', '  █║ ', '  ╚═╝'],
  '2': ['████╗ ', '╚═██║', '██╔═╝', '█╚══╗', '█████║'],
  '3': ['████╗ ', '╚═██║', '███╔╝', '╚═██║', '████╔╝'],
  '4': ['█╔══█╗', '█║  █║', '██████║', '╚═══█║', '    █║'],
  '5': ['█████║', '█╔═══╝', '█████╗', '╚═══█║', '█████║'],
  '6': [' ███╗ ', '█╔══╝ ', '████╗ ', '█╔═█║', '╚███╔╝'],
  '7': ['█████╗', '╚═══█║', '   █╔╝', '  █╔╝ ', ' █╔╝  '],
  '8': [' ███╗ ', '█╔═█║', '╚███║', '█╔═█║', '╚███╔╝'],
  '9': [' ███╗ ', '█╔═█║', '╚████║', '  ╚█║', ' ███╔╝'],
}

function buildAscii(value: number) {
  const clamped = Math.min(Math.max(value, 0), 99)
  const digits = clamped.toString().padStart(2, '0').split('')
  const rows: string[] = ['', '', '', '', '']

  digits.forEach((digit, index) => {
    const glyph = DIGITS[digit] ?? DIGITS['0']
    glyph.forEach((line, lineIndex) => {
      rows[lineIndex] = `${rows[lineIndex]}${line}${index < digits.length - 1 ? ' ' : ''}`
    })
  })

  return rows.join('\n')
}

interface AsciiNumberProps {
  value: number
  className?: string
}

export function AsciiNumber({ value, className }: AsciiNumberProps) {
  return (
    <pre className={clsx(styles.asciiNumber, className)} aria-hidden>
      {buildAscii(value)}
    </pre>
  )
}
