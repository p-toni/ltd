'use client'

import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Markdown } from '@/components/markdown'
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
  } = useTacticalBlogContext()

  const contentWrapperRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<MobileNavTab>('read')
  const [isNavSheetOpen, setNavSheetOpen] = useState(false)
  const [isNavigating, setNavigating] = useState(false)
  const { light, medium } = useHaptic()
  const scrollProgress = useReadingProgress(contentWrapperRef)
  const navigationPulseRef = useRef<number | null>(null)

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

  const triggerNavigationPulse = useCallback(() => {
    setNavigating(true)
    if (navigationPulseRef.current) {
      window.clearTimeout(navigationPulseRef.current)
    }
    navigationPulseRef.current = window.setTimeout(() => {
      setNavigating(false)
    }, 420)
  }, [])

  const handleNext = useCallback(() => {
    if (goToNextPiece()) {
      light()
      resetScroll()
      triggerNavigationPulse()
    }
  }, [goToNextPiece, light, resetScroll, triggerNavigationPulse])

  const handlePrevious = useCallback(() => {
    if (goToPreviousPiece()) {
      light()
      resetScroll()
      triggerNavigationPulse()
    }
  }, [goToPreviousPiece, light, resetScroll, triggerNavigationPulse])

  const handlePieceSelect = useCallback(
    (pieceId: number) => {
      const changed = goToPiece(pieceId, { announce: 'GOTO' })
      if (changed) {
        medium()
        resetScroll()
        triggerNavigationPulse()
      }
      setNavSheetOpen(false)
      setActiveTab('read')
    },
    [goToPiece, medium, resetScroll, triggerNavigationPulse],
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

      setActiveTab('read')
      setNavSheetOpen(false)
      medium()
    },
    [medium],
  )

  useSwipeable(contentWrapperRef, {
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    shouldAllow: () => {
      const node = contentWrapperRef.current
      return !node || node.scrollTop <= 8
    },
  })

  useEffect(() => {
    return () => {
      if (navigationPulseRef.current) {
        window.clearTimeout(navigationPulseRef.current)
      }
    }
  }, [])

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
  const publishedDate = new Date(selectedPiece.publishedAt)
  const hasValidPublishedDate = Number.isFinite(publishedDate.getTime())
  const lsDate = hasValidPublishedDate
    ? [
        publishedDate.toLocaleString('en-US', { month: 'short' }),
        publishedDate.toLocaleString('en-US', { day: '2-digit' }),
        publishedDate.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      ].join(' ')
    : selectedPiece.date
  const isListLoading = sortedPieces.length === 0 || !selectedPiece

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
              <div className={styles.heroMeta}>
                <div className={styles.heroTop}>
                  <div className={styles.heroIdBlock}>
                    <span className={styles.heroIdLabel}>PIECE</span>
                    <span className={styles.heroIdValue}>#{String(selectedPiece.id).padStart(3, '0')}</span>
                    <span className={styles.heroHex}>[{hexId}]</span>
                  </div>
                </div>
                <div className={styles.heroNavRow}>
                  <button
                    type="button"
                    className={clsx(styles.navButton, styles.glitchable)}
                    onClick={handlePrevious}
                    disabled={!prevPieceId}
                    aria-label="Previous piece"
                  >
                    <span className={styles.navButtonLabel}>PREV</span>
                    <span className={styles.navButtonArrow}>‹</span>
                  </button>
                  <ProgressBar current={currentPosition} total={totalPieces} className={styles.heroProgress} />
                  <button
                    type="button"
                    className={clsx(styles.navButton, styles.glitchable)}
                    onClick={handleNext}
                    disabled={!nextPieceId}
                    aria-label="Next piece"
                  >
                    <span className={styles.navButtonArrow}>›</span>
                    <span className={styles.navButtonLabel}>NEXT</span>
                  </button>
                </div>
                <h1 className={clsx(styles.pieceTitle, styles.glitchable)}>{selectedPiece.title}</h1>
                <p className={styles.heroExcerpt}>{selectedPiece.excerpt}</p>
                <div className={styles.metaRow}>
                  <div className={styles.metaChip}>
                    <span className={styles.metaChipLabel}>READ</span>
                    <span className={styles.metaChipValue}>{selectedPiece.readTime}</span>
                  </div>
                  <div className={styles.metaChip}>
                    <span className={styles.metaChipLabel}>WORDS</span>
                    <span className={styles.metaChipValue}>{selectedPiece.wordCount.toLocaleString()}</span>
                  </div>
                  <div className={styles.metaChip}>
                    <span className={styles.metaChipLabel}>MOOD</span>
                    <span className={styles.metaChipValue}>{moodLabel}</span>
                  </div>
                </div>
                <div className={styles.heroFooter}>
                  <span>{lsDate}</span>
                  <span>{selectedPiece.slug}.md</span>
                </div>
              </div>
            </div>

          </section>

          <section className={styles.contentSection}>
            <Markdown content={selectedPiece.content} pieceId={selectedPiece.id} headingVariant="ascii" />
          </section>
        </div>
      </div>

      <BottomNav
        active={activeTab}
        onSelect={handleNavSelect}
        listState={isListLoading ? 'active' : 'idle'}
        readState={isNavigating ? 'active' : 'idle'}
      />
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
