'use client'

import clsx from 'clsx'

import styles from '@/components/mobile/layout.module.css'
import type { Piece } from '@/lib/pieces'

interface NavSheetProps {
  pieces: Piece[]
  selectedPieceId: number | null
  isOpen: boolean
  onClose: () => void
  onSelect: (pieceId: number) => void
}

export function NavSheet({ pieces, selectedPieceId, isOpen, onClose, onSelect }: NavSheetProps) {
  return (
    <>
      <div
        className={clsx(styles.navOverlay, isOpen && styles.navOverlayVisible)}
        onClick={onClose}
        aria-hidden
      />
      <aside className={clsx(styles.navSheet, isOpen && styles.navSheetOpen)} aria-label="Pieces navigation">
        <header className={styles.navSheetHeader}>
          <span>PIECES</span>
          <button type="button" className={styles.navCloseButton} onClick={onClose} aria-label="Close navigation">
            ×
          </button>
        </header>
        <div className={styles.navList}>
          {pieces.map((piece) => {
            const isActive = piece.id === selectedPieceId
            return (
              <button
                key={piece.id}
                type="button"
                className={clsx(styles.navListItem, isActive && styles.navListItemActive)}
                onClick={() => onSelect(piece.id)}
              >
                <div className={styles.navListTitle}>{piece.title}</div>
                <div className={styles.navListMeta}>#{String(piece.id).padStart(3, '0')} · {piece.date}</div>
              </button>
            )
          })}
        </div>
        <footer className={styles.navFooter}>
          FILTER: ALL · MOOD: ALL
        </footer>
      </aside>
    </>
  )
}
