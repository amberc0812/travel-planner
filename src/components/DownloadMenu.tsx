import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { downloadTrip } from '../lib/export'
import type { Trip } from '../lib/types'

interface DownloadMenuProps {
  trip: Trip
}

export function DownloadMenu({ trip }: DownloadMenuProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<null | 'pdf' | 'jpg'>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  async function run(kind: 'pdf' | 'jpg') {
    if (busy) return
    setBusy(kind)
    try {
      await downloadTrip(trip, kind)
    } catch {
      /* export failed — leave UI as is */
    } finally {
      setBusy(null)
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focusable inline-flex items-center gap-1.5 rounded-button border border-hairline bg-surface px-3 py-1.5 text-caption font-medium text-ink transition-colors hover:border-ink-40"
      >
        <Icon name="export" size={15} />
        {busy ? 'Preparing…' : 'Download'}
        <Icon name="chevron-down" size={14} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1.5 w-48 rounded-card border border-hairline bg-surface p-1.5 shadow-pop"
        >
          <MenuItem icon="file" label="Download as PDF" onClick={() => run('pdf')} />
          <MenuItem icon="image" label="Download as JPG" onClick={() => run('jpg')} />
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: 'file' | 'image'
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-button px-2.5 py-2 text-left text-caption text-ink transition-colors hover:bg-[rgba(2,16,52,0.05)]"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-badge bg-canvas text-ink-60">
        <Icon name={icon} size={14} />
      </span>
      {label}
    </button>
  )
}
