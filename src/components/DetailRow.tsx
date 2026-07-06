import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Detail } from '../lib/types'
import { DETAIL_META } from '../lib/details'
import { TRANSPORT_MODES, modeMeta } from '../lib/transport'
import { EditableText } from './EditableText'
import { Icon } from './Icon'

interface DetailRowProps {
  detail: Detail
  onPatch: (patch: Partial<Detail>) => void
  onDelete: () => void
  dragHandle?: ReactNode
}

export function DetailRow({ detail, onPatch, onDelete, dragHandle }: DetailRowProps) {
  const meta = DETAIL_META[detail.type]
  const [editingNote, setEditingNote] = useState(false)
  const leadingIcon = detail.type === 'transportation' ? modeMeta(detail.mode).icon : meta.icon

  return (
    <div className="group/detail flex items-start gap-2 rounded-button border border-hairline bg-surface px-3 py-2.5">
      {dragHandle}
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-dusty-blue">
        <Icon name={leadingIcon} size={16} />
      </span>

      <div className="min-w-0 flex-1">
        {detail.type === 'note' ? (
          editingNote ? (
            <textarea
              autoFocus
              defaultValue={detail.text}
              onBlur={(e) => {
                onPatch({ text: e.target.value })
                setEditingNote(false)
              }}
              placeholder={meta.placeholder}
              rows={Math.max(2, detail.text.split('\n').length)}
              className="focusable w-full resize-none rounded-md bg-transparent text-body text-ink placeholder:text-ink-45"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingNote(true)}
              className="block w-full text-left"
              aria-label="Edit note"
            >
              {detail.text ? (
                <div className="prose-note text-body text-ink">
                  <ReactMarkdown>{detail.text}</ReactMarkdown>
                </div>
              ) : (
                <span className="text-body text-ink-45">{meta.placeholder}</span>
              )}
            </button>
          )
        ) : detail.type === 'time' ? (
          <div className="flex items-center gap-1.5 text-body">
            <span className="shrink-0 text-ink">Time</span>
            <span className="shrink-0 text-ink-40">—</span>
            <input
              type="time"
              value={detail.text}
              onChange={(e) => onPatch({ text: e.target.value })}
              aria-label="Time"
              className="focusable bg-transparent text-body text-ink"
            />
          </div>
        ) : detail.type === 'transportation' ? (
          <TransportRow detail={detail} onPatch={onPatch} />
        ) : detail.type === 'doc' ? (
          <DocRow detail={detail} onPatch={onPatch} />
        ) : (
          <div className="flex items-baseline gap-1.5 text-body">
            <span className="shrink-0 text-ink">{meta.label}</span>
            <span className="shrink-0 text-ink-40">—</span>
            <EditableText
              value={detail.text}
              onChange={(v) => onPatch({ text: v })}
              placeholder={meta.placeholder}
              ariaLabel={meta.label}
              className="flex-1 text-ink"
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${meta.label}`}
        className="-mr-1 mt-0.5 shrink-0 rounded p-1 text-ink-40 opacity-0 transition-opacity hover:text-terracotta focus-visible:opacity-100 group-hover/detail:opacity-100"
      >
        <Icon name="trash" size={15} />
      </button>
    </div>
  )
}

const LOCAL_MODES = new Set(['car', 'walk', 'bike'])

function TransportRow({ detail, onPatch }: { detail: Detail; onPatch: (p: Partial<Detail>) => void }) {
  const mode = detail.mode ?? 'flight'
  const isLocal = LOCAL_MODES.has(mode)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-body">
      <select
        value={mode}
        onChange={(e) => onPatch({ mode: e.target.value })}
        aria-label="Transport mode"
        className="focusable cursor-pointer appearance-none rounded bg-transparent font-medium text-ink"
      >
        {TRANSPORT_MODES.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>

      {isLocal ? (
        <span className="inline-flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            value={detail.durationMin ?? ''}
            onChange={(e) => onPatch({ durationMin: e.target.value })}
            aria-label="Duration in minutes"
            placeholder="—"
            className="focusable w-14 bg-transparent text-ink"
          />
          <span className="text-ink-45">min</span>
        </span>
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="time" size={14} className="shrink-0 text-dusty-blue" />
            <input
              type="time"
              value={detail.depTime ?? ''}
              onChange={(e) => onPatch({ depTime: e.target.value })}
              aria-label="Departure time"
              className="focusable bg-transparent text-ink"
            />
            <span className="text-ink-40">→</span>
            <input
              type="time"
              value={detail.arrTime ?? ''}
              onChange={(e) => onPatch({ arrTime: e.target.value })}
              aria-label="Arrival time"
              className="focusable bg-transparent text-ink"
            />
          </span>

          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Icon name="destination" size={14} className="shrink-0 text-dusty-blue" />
            <EditableText
              value={detail.fromCity ?? ''}
              onChange={(v) => onPatch({ fromCity: v })}
              placeholder="From"
              ariaLabel="Departure city"
              className="text-ink"
            />
            <span className="text-ink-40">→</span>
            <EditableText
              value={detail.toCity ?? ''}
              onChange={(v) => onPatch({ toCity: v })}
              placeholder="To"
              ariaLabel="Arrival city"
              className="text-ink"
            />
          </span>
        </>
      )}
    </div>
  )
}

function DocRow({ detail, onPatch }: { detail: Detail; onPatch: (p: Partial<Detail>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hasFile = !!detail.fileData

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      window.alert('That file is larger than 2 MB. Please choose a smaller PDF or JPG.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onPatch({ text: file.name, fileData: reader.result as string })
    reader.readAsDataURL(file)
  }

  function openDoc() {
    if (!detail.fileData) return
    fetch(detail.fileData)
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener')
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      })
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-body">
      <span className="shrink-0 text-ink">Document</span>
      <span className="shrink-0 text-ink-40">—</span>
      {hasFile ? (
        <>
          <button
            type="button"
            onClick={openDoc}
            title="Open document"
            className="focusable min-w-0 truncate text-left text-ink underline decoration-ink-40 underline-offset-2 transition-colors hover:decoration-ink"
          >
            {detail.text || 'Document'}
          </button>
          <button
            type="button"
            onClick={() => onPatch({ text: '', fileData: undefined })}
            aria-label="Remove document"
            className="shrink-0 rounded p-0.5 text-ink-40 hover:text-terracotta"
          >
            <Icon name="close" size={12} />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="focusable italic text-ink-45 transition-colors hover:text-ink"
        >
          Upload PDF or JPG
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,.pdf,.jpg,.jpeg"
        onChange={onFile}
        className="hidden"
      />
    </div>
  )
}
