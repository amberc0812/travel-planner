import { Icon, type IconName } from './Icon'
import { Switch } from './Switch'
import { useSettings } from '../lib/settings'

export type NavView = 'home' | 'map' | 'settings'

interface NavItem {
  key: string
  icon: IconName
  label: string
}

const NAV: NavItem[] = [
  { key: 'home', icon: 'home', label: 'Home' },
  { key: 'map', icon: 'map', label: 'Map' },
  { key: 'settings', icon: 'settings', label: 'Settings' },
]

interface NavRailProps {
  active: NavView
  onSelect: (key: string) => void
}

export function NavRail({ active, onSelect }: NavRailProps) {
  const { isDark, setTheme } = useSettings()

  return (
    <nav
      aria-label="Primary"
      className="flex w-[76px] shrink-0 flex-col items-center bg-dusty-blue py-7"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-10">
        {NAV.map((item) => {
          const isActive = item.key === active
          return (
            <button
              key={item.key}
              type="button"
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(item.key)}
              className={`flex h-11 w-11 items-center justify-center rounded-button text-canvas transition-opacity duration-200 ease-calm ${
                isActive ? 'opacity-100' : 'opacity-75 hover:opacity-100'
              }`}
            >
              <Icon name={item.icon} size={24} />
            </button>
          )
        })}
      </div>

      <Switch
        checked={isDark}
        onChange={(v) => setTheme(v ? 'dark' : 'light')}
        ariaLabel="Toggle dark mode"
        knobIcon={{ on: 'moon', off: 'sun' }}
      />
    </nav>
  )
}
