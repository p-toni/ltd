import { useEffect } from 'react'

interface SwipeableOptions {
  onSwipedLeft?: () => void
  onSwipedRight?: () => void
  threshold?: number
  maxVerticalOffset?: number
  shouldAllow?: () => boolean
}

export function useSwipeable<T extends HTMLElement>(
  targetRef: React.RefObject<T>,
  options: SwipeableOptions,
) {
  const { onSwipedLeft, onSwipedRight, threshold = 50, maxVerticalOffset = 30, shouldAllow } = options

  useEffect(() => {
    const target = targetRef.current
    if (!target) {
      return
    }

    let startX = 0
    let startY = 0
    let tracking = false

    const handleTouchStart = (event: TouchEvent) => {
      if (shouldAllow && !shouldAllow()) {
        tracking = false
        return
      }

      if (event.touches.length !== 1) {
        tracking = false
        return
      }

      const touch = event.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      tracking = true
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (!tracking) {
        return
      }

      if (event.changedTouches.length !== 1) {
        tracking = false
        return
      }

      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - startX
      const deltaY = Math.abs(touch.clientY - startY)

      if (Math.abs(deltaX) > threshold && deltaY < maxVerticalOffset) {
        if (deltaX > 0) {
          onSwipedRight?.()
        } else {
          onSwipedLeft?.()
        }
      }

      tracking = false
    }

    target.addEventListener('touchstart', handleTouchStart, { passive: true })
    target.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      target.removeEventListener('touchstart', handleTouchStart)
      target.removeEventListener('touchend', handleTouchEnd)
    }
  }, [maxVerticalOffset, onSwipedLeft, onSwipedRight, shouldAllow, targetRef, threshold])
}
