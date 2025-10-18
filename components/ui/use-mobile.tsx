import { useIsMobile as useSharedIsMobile } from '@/hooks/use-mobile'

export function useIsMobile() {
  return useSharedIsMobile()
}
