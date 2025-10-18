'use client'

import clsx from 'clsx'

import styles from '@/components/mobile/layout.module.css'

interface FlashMessageProps {
  message: string | null
}

export function FlashMessage({ message }: FlashMessageProps) {
  return (
    <div
      className={clsx(styles.flashMessage, message && styles.flashMessageVisible)}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}
