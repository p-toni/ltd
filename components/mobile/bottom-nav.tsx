'use client'

import clsx from 'clsx'

import styles from '@/components/mobile/layout.module.css'

export type MobileNavTab = 'list' | 'read' | 'mood' | 'info'

const NAV_ITEMS: Array<{ id: MobileNavTab; cmd: string; icon: string; label: string }> = [
  { id: 'list', cmd: '$ ls -la', icon: '[≡]', label: 'LIST' },
  { id: 'read', cmd: '$ cat', icon: '[▷]', label: 'READ' },
  { id: 'mood', cmd: '$ grep', icon: '[#]', label: 'MOOD' },
  { id: 'info', cmd: '$ man', icon: '[i]', label: 'INFO' },
]

interface BottomNavProps {
  active: MobileNavTab
  onSelect: (tab: MobileNavTab) => void
}

export function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <nav className={styles.bottomNav} aria-label="Terminal navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={clsx(styles.navItem, active === item.id && styles.navItemActive)}
          onClick={() => onSelect(item.id)}
        >
          <span className={styles.navCmd}>{item.cmd}</span>
          <span className={styles.navIcon}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
