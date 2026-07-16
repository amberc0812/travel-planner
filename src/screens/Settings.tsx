import { useMemo, useRef } from 'react'
import { useStore } from '../lib/store'
import { ACCENTS, useSettings, type ThemeMode } from '../lib/settings'
import { Icon } from '../components/Icon'
import { exportData, importData } from '../lib/backup'

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Day' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

interface Traveler {
  name: string
  trips: string[]
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function Settings() {
  const { trips } = useStore()
  const { accent, setAccent, theme, setTheme } = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)

  const travelers = useMemo<Traveler[]>(() => {
    const map = new Map<string, Traveler>()
    const add = (name: string, tripTitle: string) => {
      const key = name.toLowerCase()
      const existing = map.get(key)
      if (existing) existing.trips.push(tripTitle)
      else map.set(key, { name, trips: [tripTitle] })
    }
    for (const trip of trips) {
      const title = trip.title || 'Untitled trip'
      // A solo trip is itself regarded as a co-traveler ("Solo trip").
      if (trip.solo) {
        add('Solo trip', title)
        continue
      }
      for (const raw of trip.people.split(',')) {
        const name = raw.trim()
        if (name) add(name, title)
      }
    }
    return [...map.values()].sort((a, b) => b.trips.length - a.trips.length)
  }, [trips])

  return (
    <div className="px-10 py-12 lg:px-20">
      <div className="mx-auto max-w-[680px]">
        <h1 className="font-display text-display">Settings</h1>
        <p className="mt-1 text-subhead italic text-ink-45">Make it yours.</p>

        {/* Main color */}
        <section className="mt-10">
          <h2 className="font-display text-heading">Main color</h2>
          <p className="mt-1 text-caption text-ink-45">Recolors the toolbar, day cards, and accents.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {ACCENTS.map((a) => {
              const selected = a.value.toLowerCase() === accent.toLowerCase()
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAccent(a.value)}
                  aria-pressed={selected}
                  title={a.name}
                  className="focusable flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-pill border transition-transform ${
                      selected ? 'border-ink' : 'border-hairline'
                    }`}
                    style={{ background: a.value }}
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-pill bg-ink" />}
                  </span>
                  <span className={`text-[11px] ${selected ? 'text-ink' : 'text-ink-45'}`}>{a.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Appearance */}
        <section className="mt-10">
          <h2 className="font-display text-heading">Appearance</h2>
          <p className="mt-1 text-caption text-ink-45">Day, dark, or follow your system.</p>
          <div className="mt-4 inline-flex rounded-button border border-hairline bg-surface p-1">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                aria-pressed={theme === opt.value}
                className={`rounded-[8px] px-4 py-1.5 text-caption font-medium transition-colors ${
                  theme === opt.value ? 'bg-ink text-canvas' : 'text-ink-60 hover:text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Co-travelers */}
        <section className="mt-10">
          <h2 className="font-display text-heading">Co-travelers</h2>
          <p className="mt-1 text-caption text-ink-45">Everyone you’re planning trips with.</p>
          {travelers.length === 0 ? (
            <p className="mt-4 text-body text-ink-60">No co-travelers yet — add people to a trip.</p>
          ) : (
            <ul className="mt-4 overflow-hidden rounded-card border border-hairline bg-surface">
              {travelers.map((t, i) => (
                <li
                  key={t.name}
                  className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-hairline' : ''}`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-caption font-medium text-ink"
                    style={{ background: accent }}
                  >
                    {initials(t.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body text-ink">{t.name}</span>
                    <span className="block truncate text-caption text-ink-45">{t.trips.join(' · ')}</span>
                  </span>
                  <span className="shrink-0 text-caption text-ink-45">
                    {t.trips.length} {t.trips.length === 1 ? 'trip' : 'trips'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Backup & restore */}
        <section className="mt-10">
          <h2 className="font-display text-heading">Backup &amp; restore</h2>
          <p className="mt-1 text-caption text-ink-45">
            Your trips are saved only in this browser. Export a file to move everything to another device or to the
            live app, then import it there.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportData}
              className="focusable inline-flex items-center gap-1.5 rounded-button border border-hairline bg-surface px-3.5 py-2 text-caption font-medium text-ink transition-colors hover:border-ink-40"
            >
              <Icon name="export" size={16} />
              Export data
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="focusable inline-flex items-center gap-1.5 rounded-button border border-hairline bg-surface px-3.5 py-2 text-caption font-medium text-ink transition-colors hover:border-ink-40"
            >
              <Icon name="file" size={16} />
              Import data
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importData(f)
                e.target.value = ''
              }}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
