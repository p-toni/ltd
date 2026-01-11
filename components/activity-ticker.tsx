'use client'

import { useEffect, useState } from 'react'
import { formatTickerMessage, getRecentActivity, type TickerMessage } from '@/lib/activity-ticker'

interface ActivityTickerProps {
  refreshInterval?: number
  className?: string
}

export function ActivityTicker({ refreshInterval = 30000, className = '' }: ActivityTickerProps) {
  const [messages, setMessages] = useState<TickerMessage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animationState, setAnimationState] = useState<'visible' | 'exiting' | 'entering'>('visible')
  const [displayText, setDisplayText] = useState('')
  const [targetText, setTargetText] = useState('')

  // Fetch activity messages
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const activity = await getRecentActivity(10)
        setMessages(activity)
      } catch (error) {
        console.warn('Failed to fetch activity:', error)
      }
    }

    // Initial fetch
    fetchActivity()

    // Set up refresh interval
    const interval = setInterval(fetchActivity, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  // Initialize display text
  useEffect(() => {
    if (messages.length > 0 && displayText === '') {
      const firstMessage = formatTickerMessage(messages[0]).toUpperCase()
      setDisplayText(firstMessage)
      setTargetText(firstMessage)
    }
  }, [messages, displayText])

  // Whole-message flip animation
  const startMessageTransition = (newMessage: string, callback: () => void) => {
    // Start exit animation for entire message
    setAnimationState('exiting')

    setTimeout(() => {
      // Switch content and start entry animation
      setDisplayText(newMessage)
      setAnimationState('entering')

      setTimeout(() => {
        // Animation complete
        setAnimationState('visible')
        callback()
      }, 400) // Entry animation duration
    }, 300) // Exit animation duration
  }

  // Rotate through messages
  useEffect(() => {
    if (messages.length <= 1) return

    const rotationInterval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % messages.length
      const nextMessage = formatTickerMessage(messages[nextIndex]).toUpperCase()

      setTargetText(nextMessage)

      // Start whole-message flip transition
      startMessageTransition(nextMessage, () => {
        // Update index after animation completes
        setCurrentIndex(nextIndex)
      })
    }, 5000) // Show each message for 5 seconds

    return () => clearInterval(rotationInterval)
  }, [messages.length, currentIndex, displayText])

  if (messages.length === 0) {
    return (
      <span className={`text-[10px] tracking-wider ${className}`}>
        READY
      </span>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <span
        className={`text-[10px] tracking-wider ${
          animationState === 'exiting' ? 'animate-split-flap-exit' :
          animationState === 'entering' ? 'animate-split-flap-enter' : ''
        }`}
        style={{
          fontVariantNumeric: 'tabular-nums',
          minWidth: '300px', // Prevent layout shift
          display: 'inline-block',
          textAlign: 'left'
        }}
      >
        {displayText || 'READY'}
      </span>

      {/* Subtle activity indicator */}
      {messages.length > 1 && (
        <div className="absolute -right-1 top-0 h-full w-0.5 opacity-30">
          <div
            className="h-full bg-[color:var(--te-orange,#ff6600)] transition-transform duration-5000 ease-linear"
            style={{
              transform: `translateY(${(currentIndex / messages.length) * 100}%)`,
              height: `${100 / messages.length}%`
            }}
          />
        </div>
      )}

      <style jsx>{`
        .animate-split-flap-exit {
          animation: split-flap-exit 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-split-flap-enter {
          animation: split-flap-enter 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        @keyframes split-flap-exit {
          0% {
            opacity: 1;
            transform: scaleY(1) rotateX(0deg);
            filter: none;
            text-shadow: none;
          }
          25% {
            opacity: 0.8;
            transform: scaleY(0.8) rotateX(15deg);
            filter: contrast(1.1) brightness(1.05);
            text-shadow: 0.5px 0 0 currentColor, -0.5px 0 0 currentColor;
          }
          50% {
            opacity: 0.5;
            transform: scaleY(0.4) rotateX(45deg);
            filter: contrast(1.5) brightness(0.9);
            text-shadow: 1px 0 0 currentColor, -1px 0 0 currentColor, 0 1px 0 currentColor;
          }
          75% {
            opacity: 0.2;
            transform: scaleY(0.15) rotateX(75deg);
            filter: contrast(2.2) brightness(0.6);
            text-shadow: 1.5px 0 0 currentColor, -1.5px 0 0 currentColor, 0 1.5px 0 currentColor, 0 -0.5px 0 currentColor;
          }
          100% {
            opacity: 0;
            transform: scaleY(0.05) rotateX(90deg);
            filter: contrast(3) brightness(0.3);
            text-shadow: 2px 0 0 currentColor, -2px 0 0 currentColor;
          }
        }

        @keyframes split-flap-enter {
          0% {
            opacity: 0;
            transform: scaleY(0.05) rotateX(-90deg);
            filter: contrast(3) brightness(0.3);
            text-shadow: 2px 0 0 currentColor, -2px 0 0 currentColor;
          }
          25% {
            opacity: 0.2;
            transform: scaleY(0.15) rotateX(-75deg);
            filter: contrast(2.2) brightness(0.6);
            text-shadow: 1.5px 0 0 currentColor, -1.5px 0 0 currentColor, 0 1.5px 0 currentColor;
          }
          50% {
            opacity: 0.5;
            transform: scaleY(0.4) rotateX(-45deg);
            filter: contrast(1.5) brightness(0.9);
            text-shadow: 1px 0 0 currentColor, -1px 0 0 currentColor;
          }
          75% {
            opacity: 0.8;
            transform: scaleY(0.8) rotateX(-15deg);
            filter: contrast(1.1) brightness(1.05);
            text-shadow: 0.5px 0 0 currentColor, -0.5px 0 0 currentColor;
          }
          100% {
            opacity: 1;
            transform: scaleY(1) rotateX(0deg);
            filter: none;
            text-shadow: none;
          }
        }

        /* Dithering pattern overlay for character transitions */
        .dither-overlay {
          position: relative;
        }

        .dither-overlay::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 20% 20%, transparent 35%, currentColor 35%, currentColor 37%, transparent 37%),
            radial-gradient(circle at 60% 20%, transparent 35%, currentColor 35%, currentColor 37%, transparent 37%),
            radial-gradient(circle at 20% 60%, transparent 35%, currentColor 35%, currentColor 37%, transparent 37%),
            radial-gradient(circle at 60% 60%, transparent 35%, currentColor 35%, currentColor 37%, transparent 37%);
          background-size: 3px 3px;
          mix-blend-mode: difference;
          opacity: 0.4;
          animation: dither-dance 0.2s ease-in-out infinite alternate;
        }

        @keyframes dither-dance {
          0% {
            transform: translate(0, 0);
            opacity: 0.3;
          }
          50% {
            transform: translate(0.5px, 0);
            opacity: 0.5;
          }
          100% {
            transform: translate(0, 0.5px);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  )
}