'use client'

import styles from '@/components/mobile/layout.module.css'

interface ReadingProgressProps {
  value: number
}

export function ReadingProgress({ value }: ReadingProgressProps) {
  return <div className={styles.readingProgress} style={{ width: `${Math.min(value, 100)}%` }} aria-hidden />
}
