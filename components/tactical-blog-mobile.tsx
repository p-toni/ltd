'use client'

import { useMemo, useRef } from 'react'

import { Markdown } from '@/components/markdown'
import { useTacticalBlogContext } from '@/components/tactical-blog-provider'

import styles from '@/components/mobile/layout.module.css'

export function TacticalBlogMobile() {
  const {
    currentTime,
    sortedPieces,
    selectedPiece,
    selectedPieceId,
    setSelectedPieceId,
    setIsChatOpen,
  } = useTacticalBlogContext()

  const contentWrapperRef = useRef<HTMLDivElement | null>(null)

  const currentIndex = useMemo(() => {
    if (!selectedPieceId) {
      return -1
    }
    return sortedPieces.findIndex((piece) => piece.id === selectedPieceId)
  }, [selectedPieceId, sortedPieces])

  const totalPieces = sortedPieces.length
  const pieceCounter = totalPieces > 0 && currentIndex >= 0 ? `${currentIndex + 1}/${totalPieces}` : `0/${totalPieces}`
  const progressPercent = totalPieces > 0 && currentIndex >= 0 ? Math.round(((currentIndex + 1) / totalPieces) * 100) : 0
  const filledBlocks = Math.round((progressPercent / 100) * 20)
  const progressBar = `[${'█'.repeat(filledBlocks)}${'░'.repeat(20 - filledBlocks)}] ${progressPercent}% (${pieceCounter})`

  const prevPieceId = currentIndex > 0 ? sortedPieces[currentIndex - 1]?.id ?? null : null
  const nextPieceId = currentIndex >= 0 && currentIndex < totalPieces - 1 ? sortedPieces[currentIndex + 1]?.id ?? null : null

  const handleNavigate = (pieceId: number | null) => {
    if (!pieceId) {
      return
    }
    setSelectedPieceId(pieceId)
    if (contentWrapperRef.current) {
      contentWrapperRef.current.scrollTop = 0
    }
  }

  if (!selectedPiece) {
    return (
      <div className={styles.mobileRoot}>
        <div className={styles.statusBar}>
          <div className={styles.statusLeft}>
            <span className={styles.statusLogo}>TONI.LTD</span>
          </div>
          <div className={styles.statusRight}>
            <span>{currentTime}</span>
          </div>
        </div>
        <div className={styles.contentWrapper}>
          <div className={styles.content}>
            <p style={{ padding: '80px 24px', textAlign: 'center', fontSize: 12, letterSpacing: '0.2em' }}>
              NO PIECES LOADED
            </p>
          </div>
        </div>
      </div>
    )
  }

  const hexId = `0x${selectedPiece.id.toString(16).padStart(2, '0')}`.toUpperCase()
  const moodLabel = selectedPiece.mood[0]?.toUpperCase() ?? 'N/A'

  return (
    <div className={styles.mobileRoot}>
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusDot} />
          <span className={styles.statusLogo}>TONI.LTD</span>
        </div>
        <div className={styles.statusRight}>
          <span>{currentTime}</span>
          <span>{pieceCounter}</span>
        </div>
      </div>

      <div className={styles.readingProgress} style={{ width: '0%' }} aria-hidden />

      <div ref={contentWrapperRef} className={styles.contentWrapper}>
        <div className={styles.content}>
          <section className={styles.hero}>
            <div className={styles.pieceNav}>
              <button
                type="button"
                className={styles.navArrow}
                onClick={() => handleNavigate(prevPieceId)}
                disabled={!prevPieceId}
                aria-label="Previous piece"
              >
                ‹
              </button>
              <div className={styles.pieceProgress}>
                <div className={styles.pieceId}>
                  PIECE #{String(selectedPiece.id).padStart(3, '0')}
                  <span className={styles.pieceHex}>[{hexId}]</span>
                </div>
                <div className={styles.progressBar}>{progressBar}</div>
              </div>
              <button
                type="button"
                className={styles.navArrow}
                onClick={() => handleNavigate(nextPieceId)}
                disabled={!nextPieceId}
                aria-label="Next piece"
              >
                ›
              </button>
            </div>

            <h1 className={styles.pieceTitle}>{selectedPiece.title}</h1>
            <div className={styles.pieceAuthor}>{selectedPiece.date}</div>

            <div className={styles.fileInfo}>
              -rw-r--r-- 1 toni staff {selectedPiece.wordCount}W {selectedPiece.date} {selectedPiece.slug}.md
            </div>

            <div className={styles.metaCards}>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>READ</div>
                <div className={styles.metaValue}>{selectedPiece.readTime}</div>
              </div>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>WORDS</div>
                <div className={styles.metaValue}>{selectedPiece.wordCount}</div>
              </div>
              <div className={styles.metaCard}>
                <div className={styles.metaLabel}>MOOD</div>
                <div className={styles.metaMoodValue}>{moodLabel}</div>
              </div>
            </div>

            <div className={styles.quoteBlock}>
              <p className={styles.quoteText}>{selectedPiece.excerpt}</p>
            </div>
          </section>

          <section className={styles.contentSection}>
            <Markdown content={selectedPiece.content} pieceId={selectedPiece.id} />
          </section>
        </div>
      </div>

      <div className={styles.bottomNav}>
        <button type="button" className={`${styles.navItem}`}> 
          <span className={styles.navCmd}>$ ls -la</span>
          <span className={styles.navIcon}>[≡]</span>
          <span>LIST</span>
        </button>
        <button type="button" className={`${styles.navItem} ${styles.navItemActive}`}>
          <span className={styles.navCmd}>$ cat</span>
          <span className={styles.navIcon}>[▷]</span>
          <span>READ</span>
        </button>
        <button type="button" className={styles.navItem}>
          <span className={styles.navCmd}>$ grep</span>
          <span className={styles.navIcon}>[#]</span>
          <span>MOOD</span>
        </button>
        <button
          type="button"
          className={styles.navItem}
          onClick={() => setIsChatOpen(true)}
        >
          <span className={styles.navCmd}>$ man</span>
          <span className={styles.navIcon}>[i]</span>
          <span>INFO</span>
        </button>
      </div>
    </div>
  )
}

export default TacticalBlogMobile
