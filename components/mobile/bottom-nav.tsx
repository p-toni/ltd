'use client'

import clsx from 'clsx'

import styles from '@/components/mobile/layout.module.css'

export type MobileNavTab = 'list' | 'read' | 'info' | 'agent'

type ActivityState = 'idle' | 'active'

interface NavConfig {
  id: MobileNavTab
  label: string
  icon: string
}

const NAV_ITEMS: NavConfig[] = [
  { id: 'list', label: 'LIST', icon: '≡' },
  { id: 'read', label: 'READ', icon: '¶' },
  { id: 'agent', label: 'CHAT', icon: '/' },
  { id: 'info', label: 'INFO', icon: 'i' },
]

interface BottomNavProps {
  active: MobileNavTab
  onSelect: (tab: MobileNavTab) => void
  listState?: ActivityState
  agentState?: ActivityState
  readState?: ActivityState
  infoState?: ActivityState
  aiEnabled?: boolean
}

export function BottomNav({
  active,
  onSelect,
  aiEnabled = true,
}: BottomNavProps) {
  const items = aiEnabled ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.id !== 'agent')

  return (
    <nav className={styles.bottomNav} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }} aria-label="Navigation">
      {items.map((item) => {
        return (
          <button
            key={item.id}
            type="button"
            className={clsx(styles.navItem, active === item.id && styles.navItemActive)}
            onClick={() => onSelect(item.id)}
          >
            <span className={styles.navIcon} aria-hidden>
              {item.icon}
            </span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
