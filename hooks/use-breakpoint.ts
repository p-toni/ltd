import { useMatchMedia } from '@/hooks/use-mobile'

export function useBreakpoint(query: string, initialValue = false) {
  return useMatchMedia(query, initialValue)
}
