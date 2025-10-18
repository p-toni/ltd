'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

import { Markdown } from '@/components/markdown'
import { BottomNav, type MobileNavTab } from '@/components/mobile/bottom-nav'
import { FlashMessage } from '@/components/mobile/flash-message'
import { NavSheet } from '@/components/mobile/nav-sheet'
import styles from '@/components/mobile/layout.module.css'
import { useTacticalBlogContext } from '@/components/tactical-blog-provider'
import { useSwipeable } from '@/hooks/use-swipeable'

export function TacticalBlogMobile() {
  const {
    currentTime,
    sortedPieces,
    selectedPiece,
    selectedPieceId,
    goToPiece,
    goToNextPiece,
    goToPreviousPiece,
    flashMessage,
    showFlash,
    setIsChatOpen,
  } = useTacticalBlogContext()

  const contentWrapperRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<MobileNavTab>('read')
  const [isNavSheetOpen, setNavSheetOpen] = useState(false)

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

  const resetScroll = useCallback(() => {
    if (contentWrapperRef.current) {
      contentWrapperRef.current.scrollTop = 0
    }
  }, [])

  const handleNext = useCallback(() => {
    if (goToNextPiece()) {
      resetScroll()
    }
  }, [goToNextPiece, resetScroll])

  const handlePrevious = useCallback(() => {
    if (goToPreviousPiece()) {
      resetScroll()
    }
  }, [goToPreviousPiece, resetScroll])

  const handlePieceSelect = useCallback(
    (pieceId: number) => {
      const changed = goToPiece(pieceId, { announce: 'GOTO' })
      if (changed) {
        resetScroll()
      }
      setNavSheetOpen(false)
      setActiveTab('read')
    },
    [goToPiece, resetScroll],
  )

  const handleCloseNavSheet = useCallback(() => {
    setNavSheetOpen(false)
    setActiveTab('read')
  }, [])

  const handleNavSelect = useCallback(
    (tab: MobileNavTab) => {
      if (tab === 'list') {
        setNavSheetOpen((open) => {
          const nextOpen = !open
          setActiveTab(nextOpen ? 'list' : 'read')
          return nextOpen
        })
        return
      }

      if (tab === 'info') {
        setActiveTab('info')
        setIsChatOpen(true)
        return
      }

      if (tab === 'mood') {
        setActiveTab('mood')
        showFlash('> MOOD_FILTER.sh\n> TODO: Coming soon', 1800)
        return
      }

      setActiveTab('read')
      setNavSheetOpen(false)
    },
    [setIsChatOpen, showFlash],
  )

  useSwipeable(contentWrapperRef, {
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    shouldAllow: () => {
      const node = contentWrapperRef.current
      return !node || node.scrollTop <= 8
    },
  })

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
        <FlashMessage message={flashMessage} />
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
                onClick={handlePrevious}
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
                onClick={handleNext}
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

      <BottomNav active={activeTab} onSelect={handleNavSelect} />
      <NavSheet
        pieces={sortedPieces}
        selectedPieceId={selectedPieceId}
        isOpen={isNavSheetOpen}
        onClose={handleCloseNavSheet}
        onSelect={handlePieceSelect}
      />
      <FlashMessage message={flashMessage} />
    </div>
  )
}

export default TacticalBlogMobile
