'use client'

import clsx from 'clsx'

import styles from '@/components/mobile/layout.module.css'

interface TerminalLoaderProps {
  text?: string
  className?: string
}

export function TerminalLoader({ text = 'LOADING', className }: TerminalLoaderProps) {
  return (
    <div className={clsx(styles.terminalLoader, className)}>
      <span>{text}</span>
      <span className={styles.terminalCursor}>█</span>
    </div>
  )
}
