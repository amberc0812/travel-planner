import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

export const ACCENTS: { name: string; value: string }[] = [
  { name: 'Dusty blue', value: '#adc4cb' },
  { name: 'Sage', value: '#cdd0a6' },
  { name: 'Sand', value: '#e0cf95' },
  { name: 'Blush', value: '#e6c3b5' },
  { name: 'Stone', value: '#cbc6b8' },
]

const DEFAULT_ACCENT = '#adc4cb'
const KEY = 'travel-planner:settings'

interface SettingsState {
  accent: string
  theme: ThemeMode
}

function load(): SettingsState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { accent: DEFAULT_ACCENT, theme: 'system', ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { accent: DEFAULT_ACCENT, theme: 'system' }
}

interface SettingsContextValue extends SettingsState {
  setAccent: (v: string) => void
  setTheme: (t: ThemeMode) => void
  /** The currently-resolved appearance (system resolved to light/dark). */
  isDark: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [accent, setAccent] = useState<string>(() => load().accent)
  const [theme, setTheme] = useState<ThemeMode>(() => load().theme)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ accent, theme }))
    } catch {
      /* ignore */
    }
  }, [accent, theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--dusty-blue', accent)
  }, [accent])

  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      root.setAttribute('data-theme', dark ? 'dark' : 'light')
      setIsDark(dark)
    }
    apply()
    if (theme === 'system') {
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  return (
    <SettingsContext.Provider value={{ accent, theme, setAccent, setTheme, isDark }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
