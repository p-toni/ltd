import { useEffect, useState } from 'react'

export function useViewportHeight(fallback = 900) {
  const [height, setHeight] = useState(() => {
    if (typeof window === 'undefined') {
      return fallback
    }
    return window.innerHeight || fallback
  })

  useEffect(() => {
    const update = () => {
      setHeight(window.innerHeight || fallback)
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [fallback])

  return height
}
