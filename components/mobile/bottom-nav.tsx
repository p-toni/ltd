'use client'

import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'

import styles from '@/components/mobile/layout.module.css'

export type MobileNavTab = 'list' | 'read' | 'info' | 'agent'

type ActivityState = 'idle' | 'active'

interface NavConfig {
  id: MobileNavTab
  cmd: string
  label: string
}

const NAV_ITEMS: NavConfig[] = [
  { id: 'list', cmd: '$ ls -la', label: 'LIST' },
  { id: 'agent', cmd: '$ agent', label: 'AGENT' },
  { id: 'read', cmd: '$ cat', label: 'READ' },
  { id: 'info', cmd: '$ stat', label: 'INFO' },
]

const LIST_FRAMES = ['▦', '▥', '▧'] as const
const READ_FRAMES = ['▭', '▮'] as const
const INFO_FRAMES = ['◌', '◉'] as const
const AGENT_FRAMES = ['◎', '◉', '●'] as const

interface BottomNavProps {
  active: MobileNavTab
  onSelect: (tab: MobileNavTab) => void
  listState?: ActivityState
  agentState?: ActivityState
  readState?: ActivityState
  infoState?: ActivityState
  aiEnabled?: boolean
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
  agentState = 'idle',
  readState = 'idle',
  infoState = 'idle',
  aiEnabled = true,
}: BottomNavProps) {
  const listIcon = useAnimatedIcon('▦', LIST_FRAMES, listState, 300)
  const agentIcon = useAnimatedIcon('◎', AGENT_FRAMES, agentState, 240)
  const readIcon = useAnimatedIcon('▭', READ_FRAMES, readState, 220)
  const infoIcon = useAnimatedIcon('◌', INFO_FRAMES, infoState, 380)

  const iconMap: Record<MobileNavTab, string> = {
    list: listIcon,
    agent: agentIcon,
    read: readIcon,
    info: infoIcon,
  }

  const items = aiEnabled ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.id !== 'agent')

  return (
    <nav className={styles.bottomNav} aria-label="Terminal navigation">
      {items.map((item) => {
        const icon = iconMap[item.id]
        return (
          <button
            key={item.id}
            type="button"
            className={clsx(styles.navItem, active === item.id && styles.navItemActive)}
            onClick={() => onSelect(item.id)}
          >
            <span className={styles.navIndicator} aria-hidden />
            <span className={styles.navIcon} aria-hidden>
              {icon}
            </span>
            <span className={styles.navLabel}>{item.label}</span>
            <span className={styles.navCmd}>{item.cmd}</span>
          </button>
        )
      })}
    </nav>
  )
}
