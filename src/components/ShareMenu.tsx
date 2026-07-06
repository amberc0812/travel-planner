import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { createShare } from '../lib/api'
import type { Trip } from '../lib/types'

interface ShareMenuProps {
  trip: Trip
}

export function ShareMenu({ trip }: ShareMenuProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'menu' | 'invite'>('menu')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function close() {
    setOpen(false)
    setMode('menu')
    setEmail('')
  }

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  async function copyLink() {
    if (busy) return
    setBusy(true)
    try {
      const { link } = await createShare(trip)
      await navigator.clipboard.writeText(link)
      flash('Shareable link copied')
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not create link')
    } finally {
      setBusy(false)
      close()
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!value || busy) return
    setBusy(true)
    try {
      const { emailed, emailError } = await createShare(trip, value)
      if (emailed) flash(`Invite emailed to ${value}`)
      else flash(emailError ? `Couldn't email: ${emailError}` : 'Link saved, but email was not sent')
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not send invite')
    } finally {
      setBusy(false)
      close()
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focusable inline-flex items-center gap-1.5 rounded-button border border-hairline bg-surface px-3 py-1.5 text-caption font-medium text-ink transition-colors hover:border-ink-40"
      >
        <Icon name="share" size={15} />
        Share
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1.5 w-64 rounded-card border border-hairline bg-surface p-1.5 shadow-pop"
        >
          {mode === 'menu' ? (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={copyLink}
                disabled={busy}
                className="flex w-full items-center gap-2.5 rounded-button px-2.5 py-2 text-left text-caption text-ink transition-colors hover:bg-[rgba(2,16,52,0.05)] disabled:opacity-60"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-badge bg-canvas text-ink-60">
                  <Icon name="link" size={14} />
                </span>
                {busy ? 'Creating link…' : 'Copy link'}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => setMode('invite')}
                className="flex w-full items-center gap-2.5 rounded-button px-2.5 py-2 text-left text-caption text-ink transition-colors hover:bg-[rgba(2,16,52,0.05)]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-badge bg-canvas text-ink-60">
                  <Icon name="invite" size={14} />
                </span>
                Invite an editor
              </button>
            </>
          ) : (
            <form onSubmit={sendInvite} className="p-1.5">
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.4px] text-ink-40">
                Invite an editor
              </label>
              <input
                type="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="focusable mb-2 h-9 w-full rounded-button border border-hairline bg-canvas px-3 text-caption text-ink placeholder:text-ink-40"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMode('menu')}
                  className="rounded-button px-2.5 py-1.5 text-caption text-ink-60 transition-colors hover:text-ink"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="focusable rounded-button bg-ink px-3 py-1.5 text-caption font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {toast && (
        <div className="absolute left-0 top-full z-40 mt-1.5 whitespace-nowrap rounded-button border border-hairline bg-ink px-3 py-1.5 text-caption text-canvas shadow-pop">
          {toast}
        </div>
      )}
    </div>
  )
}
