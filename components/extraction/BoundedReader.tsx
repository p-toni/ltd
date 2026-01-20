'use client'

import { useState, useEffect, useCallback } from 'react'
import { Markdown } from '@/components/markdown'
import { cn } from '@/lib/utils'

interface Fragment {
  id: number
  content: string
  type: 'heading' | 'paragraph-group'
  heading?: string
}

interface BoundedReaderProps {
  content: string
  pieceId: number
  onFragmentChange?: (fragmentIndex: number, totalFragments: number) => void
}

/**
 * Parse markdown content into semantic fragments
 * Fragments are defined by:
 * - H2/H3 headings (new sections)
 * - Groups of 2-3 paragraphs (for long sections)
 */
function parseContentIntoFragments(content: string): Fragment[] {
  const fragments: Fragment[] = []
  let currentFragment: string[] = []
  let fragmentId = 0
  let currentHeading: string | undefined

  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for heading (## or ###)
    if (line.startsWith('## ') || line.startsWith('### ')) {
      // Save previous fragment if exists
      if (currentFragment.length > 0) {
        fragments.push({
          id: fragmentId++,
          content: currentFragment.join('\n').trim(),
          type: 'paragraph-group',
          heading: currentHeading,
        })
        currentFragment = []
      }

      // Start new fragment with heading
      currentHeading = line.replace(/^#+\s*/, '')
      currentFragment.push(line)
    } else if (line.trim() === '') {
      // Empty line - potential fragment boundary
      if (currentFragment.length > 0) {
        const paragraphCount = currentFragment.filter((l) => l.trim() !== '').length
        // Create fragment if we have 2-3 paragraphs
        if (paragraphCount >= 3) {
          fragments.push({
            id: fragmentId++,
            content: currentFragment.join('\n').trim(),
            type: 'paragraph-group',
            heading: currentHeading,
          })
          currentFragment = []
        } else {
          currentFragment.push(line)
        }
      }
    } else {
      currentFragment.push(line)
    }
  }

  // Add final fragment
  if (currentFragment.length > 0) {
    fragments.push({
      id: fragmentId++,
      content: currentFragment.join('\n').trim(),
      type: 'paragraph-group',
      heading: currentHeading,
    })
  }

  return fragments
}

export function BoundedReader({ content, pieceId, onFragmentChange }: BoundedReaderProps) {
  const [fragments] = useState(() => parseContentIntoFragments(content))
  const [currentFragmentIndex, setCurrentFragmentIndex] = useState(0)
  const [showTransition, setShowTransition] = useState(false)

  const currentFragment = fragments[currentFragmentIndex]
  const isLastFragment = currentFragmentIndex === fragments.length - 1

  // Notify parent of fragment changes
  useEffect(() => {
    onFragmentChange?.(currentFragmentIndex, fragments.length)
  }, [currentFragmentIndex, fragments.length, onFragmentChange])

  // Handle spacebar to advance
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.shiftKey && !isLastFragment) {
        event.preventDefault()
        advanceFragment()
      } else if (event.code === 'Space' && event.shiftKey && currentFragmentIndex > 0) {
        event.preventDefault()
        previousFragment()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentFragmentIndex, isLastFragment])

  const advanceFragment = useCallback(() => {
    if (isLastFragment) return

    // Show scanline transition
    setShowTransition(true)
    setTimeout(() => {
      setCurrentFragmentIndex((prev) => prev + 1)
      setShowTransition(false)
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 300)
  }, [isLastFragment])

  const previousFragment = useCallback(() => {
    if (currentFragmentIndex === 0) return

    setShowTransition(true)
    setTimeout(() => {
      setCurrentFragmentIndex((prev) => prev - 1)
      setShowTransition(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 300)
  }, [currentFragmentIndex])

  return (
    <div className="relative">
      {/* Fragment Progress Indicator */}
      <div className="sticky top-0 z-20 border-b border-black bg-background py-2">
        <div className="mx-auto max-w-2xl px-12">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <div className="text-muted-foreground">
              FRAGMENT {currentFragmentIndex + 1}/{fragments.length}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-muted-foreground">
                [{Array.from({ length: fragments.length }).map((_, i) => (i <= currentFragmentIndex ? '▓' : '░')).join('')}]
              </div>
              <div className="text-[9px] text-muted-foreground">
                {Math.round(((currentFragmentIndex + 1) / fragments.length) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        {/* Scanline Transition Effect */}
        {showTransition && (
          <div
            className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-b from-transparent via-[var(--te-orange)] to-transparent opacity-50"
            style={{
              animation: 'scanline 0.3s ease-in-out',
              backgroundSize: '100% 4px',
            }}
          />
        )}

        {/* Current Fragment */}
        <div className={cn('p-12 transition-opacity duration-200', showTransition ? 'opacity-0' : 'opacity-100')}>
          <div className="mx-auto max-w-2xl">
            {currentFragment.heading && (
              <div className="mb-4 font-mono text-[10px] tracking-wider text-muted-foreground">
                SECTION: {currentFragment.heading.toUpperCase()}
              </div>
            )}

            <Markdown content={currentFragment.content} pieceId={pieceId} />
          </div>
        </div>
      </div>

      {/* Checkpoint Prompt */}
      <div className="sticky bottom-0 z-20 border-t border-black bg-background py-4">
        <div className="mx-auto max-w-2xl px-12">
          {!isLastFragment ? (
            <div className="flex items-center justify-between font-mono">
              <div className="text-[10px] text-muted-foreground">
                CHECKPOINT REACHED — <span className="text-[var(--te-orange)]">[SPACE]</span> TO CONTINUE
                {currentFragmentIndex > 0 && (
                  <>
                    {' '}
                    | <span className="text-muted-foreground">[SHIFT+SPACE]</span> TO GO BACK
                  </>
                )}
              </div>
              <button
                onClick={advanceFragment}
                className="rounded border border-black bg-black px-4 py-1 text-[10px] uppercase tracking-wider text-white transition-colors hover:bg-[var(--te-orange)] hover:border-[var(--te-orange)]"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="text-center font-mono text-[10px] text-muted-foreground">
              ✓ FINAL FRAGMENT — ALL CHECKPOINTS PASSED
            </div>
          )}
        </div>
      </div>

      {/* Add scanline animation */}
      <style jsx>{`
        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  )
}
