import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useMatchMedia(query: string, initialValue = false) {
  const [matches, setMatches] = React.useState(initialValue)

  React.useEffect(() => {
    if (typeof window === 'undefined' || !query) {
      return
    }

    const mediaQuery = window.matchMedia(query)
    const updateMatch = (event?: MediaQueryListEvent) => {
      setMatches(event ? event.matches : mediaQuery.matches)
    }

    updateMatch()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMatch)
      return () => mediaQuery.removeEventListener('change', updateMatch)
    }

    mediaQuery.addListener(updateMatch)
    return () => mediaQuery.removeListener(updateMatch)
  }, [query])

  return matches
}

export function useIsMobile() {
  return useMatchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
}
