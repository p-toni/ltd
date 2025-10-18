export type HapticStyle = 'light' | 'medium' | 'heavy'

const DEFAULT_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 12,
  medium: [18, 6, 18],
  heavy: [32, 8, 32],
}

function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

export function useHaptic() {
  const trigger = (style: HapticStyle = 'light') => {
    if (!canVibrate()) {
      return
    }

    try {
      navigator.vibrate(DEFAULT_PATTERNS[style])
    } catch (error) {
      console.warn('Haptics unavailable:', error)
    }
  }

  return {
    haptic: trigger,
    light: () => trigger('light'),
    medium: () => trigger('medium'),
    heavy: () => trigger('heavy'),
  }
}
