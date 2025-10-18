import { useEffect, useState, type RefObject } from 'react'

export function useReadingProgress(containerRef: RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node) {
      return
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = node
      const total = Math.max(scrollHeight - clientHeight, 1)
      const value = Math.min((scrollTop / total) * 100, 100)
      setProgress(Number.isFinite(value) ? value : 0)
    }

    handleScroll()

    node.addEventListener('scroll', handleScroll, { passive: true })
    return () => node.removeEventListener('scroll', handleScroll)
  }, [containerRef])

  return progress
}
