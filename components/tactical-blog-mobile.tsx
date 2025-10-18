'use client'

import clsx from 'clsx'
import { useCallback, useMemo, useRef, useState } from 'react'

import { Markdown } from '@/components/markdown'
import { AsciiNumber } from '@/components/mobile/ascii-number'
import { BottomNav, type MobileNavTab } from '@/components/mobile/bottom-nav'
import { FlashMessage } from '@/components/mobile/flash-message'
import { NavSheet } from '@/components/mobile/nav-sheet'
import { ProgressBar } from '@/components/mobile/progress-bar'
import { ReadingProgress } from '@/components/mobile/reading-progress'
import styles from '@/components/mobile/layout.module.css'
import { useTacticalBlogContext } from '@/components/tactical-blog-provider'
import { useHaptic } from '@/hooks/use-haptic'
import { useReadingProgress } from '@/hooks/use-reading-progress'
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
  const { light, medium, heavy } = useHaptic()
  const scrollProgress = useReadingProgress(contentWrapperRef)

  const currentIndex = useMemo(() => {
    if (!selectedPieceId) {
      return -1
    }
    return sortedPieces.findIndex((piece) => piece.id === selectedPieceId)
  }, [selectedPieceId, sortedPieces])

  const totalPieces = sortedPieces.length
  const currentPosition = currentIndex >= 0 ? currentIndex + 1 : 0
  const pieceCounter = totalPieces > 0 && currentIndex >= 0 ? `${currentPosition}/${totalPieces}` : `0/${totalPieces}`

  const prevPieceId = currentIndex > 0 ? sortedPieces[currentIndex - 1]?.id ?? null : null
  const nextPieceId = currentIndex >= 0 && currentIndex < totalPieces - 1 ? sortedPieces[currentIndex + 1]?.id ?? null : null

  const resetScroll = useCallback(() => {
    if (contentWrapperRef.current) {
      contentWrapperRef.current.scrollTop = 0
    }
  }, [])

  const handleNext = useCallback(() => {
    if (goToNextPiece()) {
      light()
      resetScroll()
    }
  }, [goToNextPiece, light, resetScroll])

  const handlePrevious = useCallback(() => {
    if (goToPreviousPiece()) {
      light()
      resetScroll()
    }
  }, [goToPreviousPiece, light, resetScroll])

  const handlePieceSelect = useCallback(
    (pieceId: number) => {
      const changed = goToPiece(pieceId, { announce: 'GOTO' })
      if (changed) {
        medium()
        resetScroll()
      }
      setNavSheetOpen(false)
      setActiveTab('read')
    },
    [goToPiece, medium, resetScroll],
  )

  const handleCloseNavSheet = useCallback(() => {
    setNavSheetOpen(false)
    setActiveTab('read')
    medium()
  }, [medium])

  const handleNavSelect = useCallback(
    (tab: MobileNavTab) => {
      if (tab === 'list') {
        setNavSheetOpen((open) => {
          const nextOpen = !open
          setActiveTab(nextOpen ? 'list' : 'read')
          medium()
          return nextOpen
        })
        return
      }

      if (tab === 'info') {
        setActiveTab('info')
        setIsChatOpen(true)
        medium()
        return
      }

      if (tab === 'mood') {
        setActiveTab('mood')
        showFlash('> MOOD_FILTER.sh\n> TODO: Coming soon', 1800)
        heavy()
        return
      }

      setActiveTab('read')
      setNavSheetOpen(false)
      medium()
    },
    [heavy, medium, setIsChatOpen, showFlash],
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
  const asciiValue = selectedPiece.id % 100
  const moodLabel = selectedPiece.mood[0]?.toUpperCase() ?? 'N/A'
  const fileInfo = `-rw-r--r-- 1 toni staff ${selectedPiece.wordCount}W ${selectedPiece.date} ${selectedPiece.slug}.md`

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

      <ReadingProgress value={scrollProgress} />

      <div ref={contentWrapperRef} className={styles.contentWrapper}>
        <div className={styles.content}>
          <section className={clsx(styles.hero, styles.heroCorners, styles.heroCornersBottom)}>
            <div className={styles.heroOverlay} aria-hidden />
            <div className={styles.heroHeader}>
              <AsciiNumber value={asciiValue} />
              <div className={styles.heroMeta}>
                <div className={styles.pieceNav}>
                  <button
                    type="button"
                    className={clsx(styles.navArrow, styles.glitchable)}
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
                    <ProgressBar current={currentPosition} total={totalPieces} />
                  </div>
                  <button
                    type="button"
                    className={clsx(styles.navArrow, styles.glitchable)}
                    onClick={handleNext}
                    disabled={!nextPieceId}
                    aria-label="Next piece"
                  >
                    ›
                  </button>
                </div>
                <h1 className={clsx(styles.pieceTitle, styles.glitchable)}>{selectedPiece.title}</h1>
                <div className={styles.pieceAuthor}>{selectedPiece.date}</div>

                <div className={styles.fileInfo}>{fileInfo}</div>

                <div className={styles.metaCards}>
                  <div className={styles.metaCard}>
                    <div className={styles.metaLabel}>READ</div>
                    <div className={styles.metaValue}>{selectedPiece.readTime}</div>
                  </div>
                  <div className={styles.metaCard}>
                    <div className={styles.metaLabel}>WORDS</div>
                    <div className={styles.metaValue}>{selectedPiece.wordCount.toLocaleString()}</div>
                  </div>
                  <div className={styles.metaCard}>
                    <div className={styles.metaLabel}>MOOD</div>
                    <div className={styles.metaMoodValue}>{moodLabel}</div>
                  </div>
                </div>
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
