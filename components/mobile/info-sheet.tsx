'use client'

import clsx from 'clsx'

import type { Piece } from '@/lib/pieces'

import styles from '@/components/mobile/layout.module.css'

interface InfoSheetProps {
  piece: Piece
  isOpen: boolean
  onClose: () => void
}

export function InfoSheet({ piece, isOpen, onClose }: InfoSheetProps) {
  const moodLabel = piece.mood[0]?.toUpperCase() ?? 'N/A'
  const publishedDate = new Date(piece.publishedAt)
  const hasValidDate = Number.isFinite(publishedDate.getTime())
  const dateLabel = hasValidDate
    ? publishedDate.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : piece.date
  const watchDomains = piece.watchDomains.length ? piece.watchDomains.join(', ') : 'NONE'
  const latestUpdate = piece.latestUpdateAt ?? 'NONE'

  return (
    <>
      <div
        className={clsx(styles.infoOverlay, isOpen && styles.infoOverlayVisible)}
        onClick={onClose}
        aria-hidden
      />
      <section className={clsx(styles.infoSheet, isOpen && styles.infoSheetOpen)} aria-label="Piece info">
        <header className={styles.infoHeader}>
          <span>INFO</span>
          <button type="button" className={styles.infoClose} onClick={onClose} aria-label="Close info">
            ×
          </button>
        </header>
        <div className={styles.infoContent}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>TITLE</span>
            <span className={styles.infoValue}>{piece.title}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>READ</span>
            <span className={styles.infoValue}>{piece.readTime}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>WORDS</span>
            <span className={styles.infoValue}>{piece.wordCount.toLocaleString()}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>MOOD</span>
            <span className={styles.infoValue}>{moodLabel}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>DATE</span>
            <span className={styles.infoValue}>{dateLabel}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>SLUG</span>
            <span className={styles.infoValue}>{piece.slug}.md</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>RESEARCH</span>
            <span className={styles.infoValue}>AUTO</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>LAST_UPDATE</span>
            <span className={styles.infoValue}>{latestUpdate}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>UPDATES_FOUND</span>
            <span className={styles.infoValue}>{piece.updateCount}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>WATCH_DOMAINS</span>
            <span className={styles.infoValue} title={watchDomains}>{watchDomains}</span>
          </div>
        </div>
      </section>
    </>
  )
}
