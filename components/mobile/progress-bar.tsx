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
  const label = `${String(clampedCurrent).padStart(2, '0')} / ${String(clampedTotal).padStart(2, '0')}`

  return (
    <div
      className={clsx(styles.progressBar, className)}
      role="status"
      aria-live="polite"
      aria-label={`Piece ${clampedCurrent} of ${clampedTotal} (${percent}%)`}
    >
      <div className={styles.progressBarTrack} aria-hidden>
        <div className={styles.progressBarFill} style={{ width: `${percent}%` }} />
      </div>
      <span className={styles.progressBarText}>{label}</span>
    </div>
  )
}
