'use client'

import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'

import styles from '@/components/mobile/layout.module.css'

export type MobileNavTab = 'list' | 'read' | 'mood' | 'info'

type ActivityState = 'idle' | 'active'

interface NavConfig {
  id: MobileNavTab
  cmd: string
  label: string
}

const NAV_ITEMS: NavConfig[] = [
  { id: 'list', cmd: '$ ls -la', label: 'LIST' },
  { id: 'read', cmd: '$ cat', label: 'READ' },
  { id: 'mood', cmd: '$ find', label: 'MOOD' },
  { id: 'info', cmd: '$ help', label: 'INFO' },
]

const LIST_FRAMES = ['[≡]', '[⋮]', '[∴]'] as const
const READ_FRAMES = ['[▷]', '[▶]'] as const
const INFO_FRAMES = ['[i]', '[ℹ]'] as const

interface BottomNavProps {
  active: MobileNavTab
  onSelect: (tab: MobileNavTab) => void
  listState?: ActivityState
  readState?: ActivityState
  infoState?: ActivityState
}

function useAnimatedIcon(base: string, frames: readonly string[], state: ActivityState, interval: number) {
  const stableFrames = useMemo(() => (frames.length ? frames : [base]), [base, frames])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (state !== 'active' || stableFrames.length <= 1) {
      setIndex(0)
      return
    }

    setIndex(0)
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % stableFrames.length)
    }, interval)
    return () => window.clearInterval(timer)
  }, [interval, stableFrames, state])

  return state === 'active' ? stableFrames[index] : base
}

export function BottomNav({
  active,
  onSelect,
  listState = 'idle',
  readState = 'idle',
  infoState = 'idle',
}: BottomNavProps) {
  const listIcon = useAnimatedIcon('[≡]', LIST_FRAMES, listState, 300)
  const readIcon = useAnimatedIcon('[▷]', READ_FRAMES, readState, 220)
  const infoIcon = useAnimatedIcon('[i]', INFO_FRAMES, infoState, 380)

  const iconMap: Record<MobileNavTab, string> = {
    list: listIcon,
    read: readIcon,
    mood: '[#]',
    info: infoIcon,
  }

  return (
    <nav className={styles.bottomNav} aria-label="Terminal navigation">
      {NAV_ITEMS.map((item) => {
        const icon = iconMap[item.id]
        return (
          <button
            key={item.id}
            type="button"
            className={clsx(styles.navItem, active === item.id && styles.navItemActive)}
            onClick={() => onSelect(item.id)}
          >
            <span className={styles.navCmd}>{item.cmd}</span>
            <span className={styles.navIcon}>{icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
