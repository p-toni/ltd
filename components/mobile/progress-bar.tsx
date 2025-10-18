'use client'

import clsx from 'clsx'

import styles from '@/components/mobile/layout.module.css'

interface ProgressBarProps {
  current: number
  total: number
  className?: string
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const clampedTotal = Math.max(total, 1)
  const clampedCurrent = Math.min(Math.max(current, 0), clampedTotal)
  const percent = Math.round((clampedCurrent / clampedTotal) * 100)
  const blocks = Math.round(percent / 5)
  const bar = `[${'█'.repeat(blocks)}${'░'.repeat(20 - blocks)}] ${percent}% (${clampedCurrent}/${clampedTotal})`

  return (
    <span className={clsx(styles.progressBarText, className)} aria-live="polite">
      {bar}
    </span>
  )
}
