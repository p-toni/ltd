'use client'

import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Markdown } from '@/components/markdown'
import { AsciiNumber } from '@/components/mobile/ascii-number'
import { BottomNav, type MobileNavTab } from '@/components/mobile/bottom-nav'
import { ChatSheet } from '@/components/mobile/chat-sheet'
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
    isChatOpen,
    chatMessages,
    chatInput,
    setChatInput,
    isChatLoading,
    handleChatSubmit,
    chatProvider,
    setChatProvider,
    chatApiKey,
    setChatApiKey,
    handleCitationClick,
    registerChatContainer,
    registerChatInput,
    focusChatInput,
  } = useTacticalBlogContext()

  const contentWrapperRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<MobileNavTab>('read')
  const [isNavSheetOpen, setNavSheetOpen] = useState(false)
  const { light, medium, heavy } = useHaptic()
  const scrollProgress = useReadingProgress(contentWrapperRef)

  useEffect(() => {
    if (isChatOpen) {
      if (activeTab !== 'info') {
        setActiveTab('info')
      }
      const handle = window.requestAnimationFrame(() => focusChatInput())
      return () => window.cancelAnimationFrame(handle)
    }
    if (activeTab === 'info') {
      setActiveTab('read')
    }
    return undefined
  }, [activeTab, focusChatInput, isChatOpen])

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

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false)
    setActiveTab('read')
    medium()
  }, [medium, setIsChatOpen])

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
        requestAnimationFrame(() => focusChatInput())
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
    [focusChatInput, heavy, medium, setIsChatOpen, showFlash],
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
  const publishedDate = new Date(selectedPiece.publishedAt)
  const hasValidPublishedDate = Number.isFinite(publishedDate.getTime())
  const lsDate = hasValidPublishedDate
    ? [
        publishedDate.toLocaleString('en-US', { month: 'short' }),
        publishedDate.toLocaleString('en-US', { day: '2-digit' }),
        publishedDate.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      ].join(' ')
    : selectedPiece.date
  const lsRows: Array<[string, string, string, string, string, string, string]> = [
    [
      '-rw-r--r--',
      '1',
      'toni',
      'staff',
      `${selectedPiece.wordCount}B`,
      lsDate,
      `${selectedPiece.slug}.md`,
    ],
  ]

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
                <div className={styles.heroTitleRow}>
                  <h1 className={clsx(styles.pieceTitle, styles.glitchable)}>{selectedPiece.title}</h1>
                  <AsciiNumber value={asciiValue} className={styles.heroTitleAscii} />
                </div>
                <p className={styles.heroExcerpt}>{selectedPiece.excerpt}</p>

                <div className={clsx(styles.fileInfo, styles.lsTable)}>
                  {lsRows.map(([perms, links, owner, group, size, dateValue, name], index) => (
                    <div key={`${name}-${index}`} className={styles.lsRow}>
                      <span className={styles.lsPerms}>{perms}</span>
                      <span className={styles.lsLinks}>{links}</span>
                      <span className={styles.lsOwner}>{owner}</span>
                      <span className={styles.lsGroup}>{group}</span>
                      <span className={styles.lsSize}>{size}</span>
                      <span className={styles.lsDate}>{dateValue}</span>
                      <span className={styles.lsName}>{name}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.metaCards}>
                  <div className={styles.metaCard}>
                    <span className={clsx(styles.metaCorner, styles.metaCornerTopLeft)} aria-hidden>
                      ┌
                    </span>
                    <span className={clsx(styles.metaCorner, styles.metaCornerTopRight)} aria-hidden>
                      ┐
                    </span>
                    <span className={clsx(styles.metaCorner, styles.metaCornerBottomLeft)} aria-hidden>
                      └
                    </span>
                    <span className={clsx(styles.metaCorner, styles.metaCornerBottomRight)} aria-hidden>
                      ┘
                    </span>
                    <div className={styles.metaLabel}>READ</div>
                    <div className={styles.metaValue}>{selectedPiece.readTime}</div>
                  </div>
                  <div className={styles.metaCard}>
                    <span className={clsx(styles.metaCorner, styles.metaCornerTopLeft)} aria-hidden>
                      ┌
                    </span>
                    <span className={clsx(styles.metaCorner, styles.metaCornerTopRight)} aria-hidden>
                      ┐
                    </span>
                    <span className={clsx(styles.metaCorner, styles.metaCornerBottomLeft)} aria-hidden>
                      └
                    </span>
                    <span className={clsx(styles.metaCorner, styles.metaCornerBottomRight)} aria-hidden>
                      ┘
                    </span>
                    <div className={styles.metaLabel}>WORDS</div>
                    <div className={styles.metaValue}>{selectedPiece.wordCount.toLocaleString()}</div>
                  </div>
                  <div className={styles.metaCard}>
                    <span className={clsx(styles.metaCorner, styles.metaCornerTopLeft)} aria-hidden>
                      ┌
                    </span>
                    <span className={clsx(styles.metaCorner, styles.metaCornerTopRight)} aria-hidden>
                      ┐
                    </span>
                    <span className={clsx(styles.metaCorner, styles.metaCornerBottomLeft)} aria-hidden>
                      └
                    </span>
                    <span className={clsx(styles.metaCorner, styles.metaCornerBottomRight)} aria-hidden>
                      ┘
                    </span>
                    <div className={styles.metaLabel}>MOOD</div>
                    <div className={styles.metaMoodValue}>{moodLabel}</div>
                  </div>
                </div>
              </div>
            </div>

          </section>

          <section className={styles.contentSection}>
            <Markdown content={selectedPiece.content} pieceId={selectedPiece.id} headingVariant="ascii" />
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
      <ChatSheet
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        messages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        onSubmit={handleChatSubmit}
        isLoading={isChatLoading}
        provider={chatProvider}
        setProvider={setChatProvider}
        apiKey={chatApiKey}
        setApiKey={setChatApiKey}
        onCitation={handleCitationClick}
        registerContainer={registerChatContainer}
        registerInput={registerChatInput}
        focusInput={focusChatInput}
      />
      <FlashMessage message={flashMessage} />
    </div>
  )
}

export default TacticalBlogMobile
