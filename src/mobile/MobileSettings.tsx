import { useRef } from 'react'
import { ACCENTS, useSettings } from '../lib/settings'
import { exportData, importData } from '../lib/backup'
import { Icon } from '../components/Icon'

export function MobileSettings() {
  const { accent, setAccent, isDark, setTheme } = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="px-4 pb-8 pt-[22px]">
      <h1 className="mb-7 font-display text-[30px] font-semibold text-ink">Settings</h1>

      <div className="mb-2.5 text-[12px] uppercase tracking-[0.06em] text-ink-40">Appearance</div>
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-pressed={isDark}
        className="mb-7 flex min-h-[44px] w-full items-center justify-between rounded-card bg-surface px-5 py-4"
      >
        <span className="text-[16px] text-ink">Dark mode</span>
        <span
          className="relative h-[27px] w-[46px] shrink-0 rounded-pill transition-colors duration-200"
          style={{ background: isDark ? accent : 'var(--hairline)' }}
        >
          <span
            className="absolute top-[2px] h-[23px] w-[23px] rounded-pill bg-[#FBF7EE] shadow-[0_1px_3px_rgba(2,16,52,0.2)] transition-[left] duration-200 ease-calm"
            style={{ left: isDark ? '21px' : '2px' }}
          />
        </span>
      </button>

      <div className="mb-2.5 text-[12px] uppercase tracking-[0.06em] text-ink-40">Main accent</div>
      <div className="mb-7 flex flex-wrap gap-3.5 rounded-card bg-surface p-5">
        {ACCENTS.map((a) => (
          <button
            key={a.value}
            type="button"
            onClick={() => setAccent(a.value)}
            aria-label={a.name}
            aria-pressed={a.value.toLowerCase() === accent.toLowerCase()}
            className="h-9 w-9 rounded-pill p-0"
            style={{
              background: a.value,
              border: `3px solid ${a.value.toLowerCase() === accent.toLowerCase() ? 'var(--ink)' : 'transparent'}`,
            }}
          />
        ))}
      </div>

      <div className="mb-2.5 text-[12px] uppercase tracking-[0.06em] text-ink-40">Your data</div>
      <p className="mb-3 text-[13px] leading-[1.5] text-ink-45">
        Trips are saved on this device. Export a file to move them to another device, then import it there.
      </p>
      <button
        type="button"
        onClick={exportData}
        className="mb-3 flex min-h-[44px] w-full items-center gap-3 rounded-card bg-surface px-5 py-4 text-left text-[15px] text-ink"
      >
        <Icon name="export" size={18} className="shrink-0 text-ink-60" />
        Export data
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex min-h-[44px] w-full items-center gap-3 rounded-card bg-surface px-5 py-4 text-left text-[15px] text-ink"
      >
        <Icon name="file" size={18} className="shrink-0 text-ink-60" />
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
  )
}
