'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { GridOverlay } from '@/components/grid-overlay'
import { Markdown } from '@/components/markdown'
import { BottomNav, type MobileNavTab } from '@/components/mobile/bottom-nav'
import { ChatSheet } from '@/components/mobile/chat-sheet'
import { FlashMessage } from '@/components/mobile/flash-message'
import { InfoSheet } from '@/components/mobile/info-sheet'
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
    chatMessages,
    agentInput,
    setAgentInput,
    handleAgentSubmit,
    isChatLoading,
    chatProvider,
    setChatProvider,
    chatApiKey,
    setChatApiKey,
    handleCitationClick,
    registerChatContainer,
    registerChatInput,
    focusChatInput,
    aiEnabled,
    themeMode,
    setThemeMode,
  } = useTacticalBlogContext()

  const isLight = themeMode === 'light'

  useEffect(() => {
    const root = document.documentElement
    if (isLight) {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    } else {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    }
    return () => {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    }
  }, [isLight])

  const contentWrapperRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<MobileNavTab>('read')
  const [isNavSheetOpen, setNavSheetOpen] = useState(false)
  const [isInfoOpen, setInfoOpen] = useState(false)
  const [isChatOpen, setChatOpen] = useState(false)
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
      setInfoOpen(false)
      setActiveTab('read')
    },
    [goToPiece, medium, resetScroll, triggerNavigationPulse],
  )

  const handleCloseNavSheet = useCallback(() => {
    setNavSheetOpen(false)
    setActiveTab('read')
    medium()
  }, [medium])

  const handleCloseInfo = useCallback(() => {
    setInfoOpen(false)
    setActiveTab('read')
  }, [])

  const handleCloseChat = useCallback(() => {
    setChatOpen(false)
    setActiveTab('read')
  }, [])

  useEffect(() => {
    if (!aiEnabled) {
      setChatOpen(false)
      if (activeTab === 'agent') {
        setActiveTab('read')
      }
    }
  }, [aiEnabled, activeTab])

  const handleNavSelect = useCallback(
    (tab: MobileNavTab) => {
      if (tab === 'list') {
        setNavSheetOpen((open) => {
          const nextOpen = !open
          setInfoOpen(false)
          setActiveTab(nextOpen ? 'list' : 'read')
          medium()
          return nextOpen
        })
        return
      }

      if (tab === 'info') {
        setInfoOpen((open) => {
          const nextOpen = !open
          setNavSheetOpen(false)
          setChatOpen(false)
          setActiveTab(nextOpen ? 'info' : 'read')
          medium()
          return nextOpen
        })
        return
      }

      if (tab === 'agent') {
        if (!aiEnabled) {
          setChatOpen(false)
          setActiveTab('read')
          return
        }
        setChatOpen((open) => {
          const nextOpen = !open
          setNavSheetOpen(false)
          setInfoOpen(false)
          setActiveTab(nextOpen ? 'agent' : 'read')
          medium()
          return nextOpen
        })
        return
      }

      setActiveTab('read')
      setNavSheetOpen(false)
      setInfoOpen(false)
      setChatOpen(false)
      medium()
    },
    [aiEnabled, medium],
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
      <div className={styles.mobileRoot} style={isLight ? { ['--bg' as string]: 'var(--bg)' } : undefined}>
        <div className={isLight ? 'dashboard-light' : ''}>
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
              <p style={{ padding: '80px 24px', textAlign: 'center', fontSize: 14, fontFamily: 'var(--font-mono)' }}>
                NO PIECES LOADED
              </p>
            </div>
          </div>
          <FlashMessage message={flashMessage} />
        </div>
      </div>
    )
  }

  const moodLabel = selectedPiece.mood[0]?.toUpperCase() ?? 'N/A'
  const publishedDate = new Date(selectedPiece.publishedAt)
  const hasValidPublishedDate = Number.isFinite(publishedDate.getTime())
  const lsDate = hasValidPublishedDate
    ? `${publishedDate.getFullYear()}.${String(publishedDate.getMonth() + 1).padStart(2, '0')}.${String(publishedDate.getDate()).padStart(2, '0')}`
    : selectedPiece.date
  const isListLoading = sortedPieces.length === 0 || !selectedPiece

  return (
    <div className={isLight ? 'dashboard-light' : ''}>
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
            <section className={styles.readingHeader}>
              <div className={styles.readingMetaLine}>
                <span className={styles.metaBadge}>#{String(selectedPiece.id).padStart(3, '0')}</span>
                <span className={styles.metaBadge}>{selectedPiece.readTime}</span>
                <span className={styles.metaBadge}>{moodLabel}</span>
              </div>
              <div className={styles.readingNav}>
                <button
                  type="button"
                  className={styles.navCompact}
                  onClick={handlePrevious}
                  disabled={!prevPieceId}
                  aria-label="Previous piece"
                >
                  ‹
                </button>
                <ProgressBar current={currentPosition} total={totalPieces} className={styles.progressCompact} />
                <button
                  type="button"
                  className={styles.navCompact}
                  onClick={handleNext}
                  disabled={!nextPieceId}
                  aria-label="Next piece"
                >
                  ›
                </button>
              </div>
              <h1 className={styles.readingTitle}>{selectedPiece.title}</h1>
              <p className={styles.readingExcerpt}>{selectedPiece.excerpt}</p>
              <div className={styles.readingSubline}>
                <span>{lsDate}</span>
                <span>{selectedPiece.wordCount.toLocaleString()} words</span>
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
          agentState={isChatOpen ? 'active' : 'idle'}
          readState={isNavigating ? 'active' : 'idle'}
          infoState={isInfoOpen ? 'active' : 'idle'}
          aiEnabled={aiEnabled}
        />
        <NavSheet
          pieces={sortedPieces}
          selectedPieceId={selectedPieceId}
          isOpen={isNavSheetOpen}
          onClose={handleCloseNavSheet}
          onSelect={handlePieceSelect}
        />
        <InfoSheet piece={selectedPiece} isOpen={isInfoOpen} onClose={handleCloseInfo} />
        <ChatSheet
          isOpen={aiEnabled && isChatOpen}
          onClose={handleCloseChat}
          messages={chatMessages}
          chatInput={agentInput}
          setChatInput={setAgentInput}
          onSubmit={handleAgentSubmit}
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
        <GridOverlay />
      </div>
    </div>
  )
}

export default TacticalBlogMobile
