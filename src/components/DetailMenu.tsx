import { useEffect, useMemo, useRef, useState } from 'react'
import { DETAIL_TYPES, type DetailTypeMeta } from '../lib/details'
import type { DetailType } from '../lib/types'
import { Icon } from './Icon'

interface DetailMenuProps {
  onPick: (type: DetailType) => void
  onClose: () => void
  items?: DetailTypeMeta[]
  title?: string
}

/** Notion-style insert menu — a popover listing detail types, with search/slash filter. */
export function DetailMenu({ onPick, onClose, items: source = DETAIL_TYPES, title = 'Add a detail' }: DetailMenuProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  const items = useMemo(() => {
    const s = query.trim().toLowerCase()
    return s ? source.filter((d) => d.label.toLowerCase().includes(s)) : source
  }, [query, source])

  return (
    <div
      ref={rootRef}
      role="menu"
      aria-label="Add a detail"
      className="w-[256px] rounded-card border border-hairline bg-surface p-3 shadow-pop"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        } else if (e.key === 'Enter' && items[0]) {
          e.preventDefault()
          onPick(items[0].type)
        }
      }}
    >
      <p className="mb-2 px-1 text-caption font-medium text-ink-60">{title}</p>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search details"
        aria-label="Search detail types"
        className="focusable mb-2 h-9 w-full rounded-button border border-hairline bg-canvas px-3 text-caption text-ink placeholder:text-ink-40"
      />
      <ul className="max-h-[280px] overflow-auto">
        {items.map((d) => (
          <li key={d.type}>
            <button
              type="button"
              role="menuitem"
              onClick={() => onPick(d.type)}
              className="flex w-full items-center gap-2.5 rounded-button px-2 py-2 text-left text-body text-ink transition-colors hover:bg-[rgba(2,16,52,0.05)]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-badge bg-canvas text-ink-60">
                <Icon name={d.icon} size={16} />
              </span>
              {d.label}
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-2 py-3 text-caption text-ink-45">No matching detail</li>
        )}
      </ul>
    </div>
  )
}
