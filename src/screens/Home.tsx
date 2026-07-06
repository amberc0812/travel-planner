import { useMemo, useState, type CSSProperties } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../lib/store'
import { STATUS_ORDER, statusMeta } from '../lib/status'
import { Chip } from '../components/Chip'
import { Icon } from '../components/Icon'
import { EditableText } from '../components/EditableText'
import { daysBetween, fmtDateYear, parseISO, toISO } from '../lib/date'
import { lookupCountry } from '../lib/geo-cities'
import type { Folder, Trip } from '../lib/types'

interface HomeProps {
  onOpenTrip: (id: string) => void
  onNewTrip: () => void
}

function activeProgress(trip: Trip) {
  const y = trip.days.length
  const x = Math.min(Math.max(daysBetween(trip.startDate, toISO(new Date())) + 1, 1), y)
  return { x, y }
}

export function Home({ onOpenTrip, onNewTrip }: HomeProps) {
  const { trips, folders, addFolder } = useStore()
  const [query, setQuery] = useState('')
  const [sortAsc, setSortAsc] = useState(true)

  const active = trips.find((t) => t.status === 'intrip')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? trips.filter(
          (t) =>
            t.title.toLowerCase().includes(q) || t.people.toLowerCase().includes(q),
        )
      : trips
    return [...filtered].sort((a, b) => {
      const d = parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
      return sortAsc ? d : -d
    })
  }, [trips, query, sortAsc])

  return (
    <div className="px-10 py-12 lg:px-20">
      <div className="mx-auto max-w-[920px]">
        {/* Resume banner — single primary action */}
        {active && (
          <button
            type="button"
            onClick={() => onOpenTrip(active.id)}
            className="group mb-14 flex w-full items-center justify-between rounded-card border border-dusty-blue px-8 py-6 text-left transition-colors duration-200 ease-calm hover:bg-surface"
          >
            <span className="font-display text-[28px] leading-tight">
              Day {activeProgress(active).x} of {activeProgress(active).y} in{' '}
              <span className="text-terracotta">{active.title}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-body italic text-ink-45 transition-colors group-hover:text-ink-60">
              see more
              <Icon name="arrow-right" size={16} />
            </span>
          </button>
        )}

        {/* Section header: page title + sort */}
        <div className="mb-4 flex items-center gap-2">
          <h1 className="font-display text-[32px]">All Trips</h1>
          <button
            type="button"
            title={sortAsc ? 'Sort by date, newest first' : 'Sort by date, oldest first'}
            aria-label="Toggle sort order"
            onClick={() => setSortAsc((s) => !s)}
            className="focusable rounded-button p-1.5 text-ink-45 transition-colors hover:text-ink"
          >
            <Icon name="sort" size={18} />
          </button>
        </div>

        {/* Trips list card */}
        <div className="rounded-card border border-hairline bg-surface px-7 py-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative w-[180px] max-w-full">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-40">
                <Icon name="search" size={13} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a trip"
                aria-label="Search trips"
                className="focusable h-8 w-full rounded-button border border-hairline bg-canvas pl-7 pr-2.5 text-[13px] text-ink placeholder:text-ink-40"
              />
            </div>
            <button
              type="button"
              onClick={onNewTrip}
              aria-label="New trip"
              title="New trip"
              className="focusable inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dusty-blue text-ink transition-transform hover:scale-105 active:scale-95"
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
          {visible.length === 0 ? (
            <EmptyState query={query} onNewTrip={onNewTrip} />
          ) : (
            <>
              <div className="grid grid-cols-[1fr_120px_100px] items-center gap-4 border-b border-hairline pb-2 text-[11px] uppercase tracking-[0.5px] text-ink-40">
                <span>Trip · Travelers</span>
                <span className="text-right">Date</span>
                <span className="text-center">Status</span>
              </div>
              <ul className="max-h-[600px] overflow-y-auto">
                {visible.map((trip) => (
                  <li
                    key={trip.id}
                    className="grid grid-cols-[1fr_120px_100px] items-center gap-4 border-b border-hairline transition-colors duration-150 hover:bg-[rgba(2,16,52,0.03)]"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenTrip(trip.id)}
                      className="min-w-0 py-3.5 text-left"
                    >
                      <span className="block truncate font-display text-[19px] leading-snug text-ink">
                        {trip.title || 'Untitled trip'}
                      </span>
                      <span className="block truncate text-caption text-ink-45">
                        {[trip.country ?? lookupCountry(trip.title), trip.solo ? 'Solo trip' : trip.people]
                          .filter(Boolean)
                          .join(' · ') || 'No travelers yet'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenTrip(trip.id)}
                      className="py-3.5 text-right text-caption tabular-nums text-ink-60"
                    >
                      {fmtDateYear(parseISO(trip.startDate))}
                    </button>
                    <span className="flex justify-center py-3.5">
                      <StatusButton trip={trip} />
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Travel Collection — grouped trips, below the All Trips list */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[24px]">Travel Collection</h2>
            <button
              type="button"
              onClick={addFolder}
              className="focusable inline-flex items-center gap-1.5 rounded-button border border-hairline bg-surface px-3.5 py-2 text-caption font-medium text-ink transition-colors hover:border-ink-40"
            >
              <Icon name="plus" size={16} />
              New collection
            </button>
          </div>
          {folders.length === 0 ? (
            <p className="text-caption text-ink-45">
              No collections yet — group trips into collections like “Europe 2026”.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {folders.map((f) => (
                <FolderCard key={f.id} folder={f} trips={trips} onOpenTrip={onOpenTrip} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Chip that cycles Planning → In trip → Completed on click, in the All Trips list. */
function StatusButton({ trip }: { trip: Trip }) {
  const { dispatch } = useStore()
  const cycle = () => {
    const i = STATUS_ORDER.indexOf(trip.status)
    const next = STATUS_ORDER[(i + 1) % STATUS_ORDER.length]
    dispatch({ type: 'updateTrip', id: trip.id, patch: { status: next } })
  }
  return (
    <button
      type="button"
      onClick={cycle}
      title="Click to change status"
      aria-label={`Status: ${statusMeta(trip.status).label}. Click to change.`}
      className="focusable rounded-pill transition-transform hover:scale-105 active:scale-95"
    >
      <Chip status={trip.status} />
    </button>
  )
}

function FolderCard({
  folder,
  trips,
  onOpenTrip,
}: {
  folder: Folder
  trips: Trip[]
  onOpenTrip: (id: string) => void
}) {
  const { dispatch, renameFolder, deleteFolder, setFolderOrder } = useStore()
  const [addOpen, setAddOpen] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const candidates = trips.filter((t) => t.folderId !== folder.id)

  // Manual order if set, otherwise auto-sort by start date (earliest first).
  const members = useMemo(() => {
    const raw = trips.filter((t) => t.folderId === folder.id)
    const byDate = (a: Trip, b: Trip) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    if (!folder.order) return [...raw].sort(byDate)
    const rank = (id: string) => {
      const i = folder.order?.indexOf(id) ?? -1
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }
    return [...raw].sort((a, b) => rank(a.id) - rank(b.id) || byDate(a, b))
  }, [trips, folder.id, folder.order])

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = members.map((t) => t.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    setFolderOrder(folder.id, arrayMove(ids, from, to))
  }

  return (
    <div className="rounded-card border border-hairline bg-surface p-5">
      <div className="group/folder flex items-center gap-2">
        <Icon name="folder" size={18} className="shrink-0 text-ink-45" />
        <EditableText
          value={folder.name}
          onChange={(v) => renameFolder(folder.id, v)}
          placeholder="Name this collection"
          ariaLabel="Collection name"
          className="min-w-0 flex-1 font-display text-[20px] text-ink"
        />
        <span className="shrink-0 text-caption text-ink-45">{members.length}</span>
        {members.length > 1 && (
          <button
            type="button"
            onClick={() => setFolderOrder(folder.id, undefined)}
            title="Sort by start date"
            aria-label="Sort by start date"
            className="shrink-0 rounded p-1 text-ink-40 opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover/folder:opacity-100"
          >
            <Icon name="sort" size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => deleteFolder(folder.id)}
          aria-label="Delete collection"
          className="shrink-0 rounded p-1 text-ink-40 opacity-0 transition-opacity hover:text-terracotta focus-visible:opacity-100 group-hover/folder:opacity-100"
        >
          <Icon name="trash" size={15} />
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={members.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="mt-3 flex flex-col">
            {members.map((t) => (
              <SortableTripRow
                key={t.id}
                trip={t}
                onOpen={() => onOpenTrip(t.id)}
                onRemove={() => dispatch({ type: 'updateTrip', id: t.id, patch: { folderId: undefined } })}
              />
            ))}
            {members.length === 0 && (
              <li className="py-2 text-caption text-ink-45">No trips yet — add some below.</li>
            )}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="relative mt-2">
        <button
          type="button"
          onClick={() => setAddOpen((o) => !o)}
          className="focusable inline-flex items-center gap-1 rounded-button px-2 py-1 text-caption italic text-ink-60 transition-colors hover:text-ink"
        >
          <Icon name="plus" size={13} />
          Add trips
        </button>
        {addOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 max-h-64 w-64 overflow-auto rounded-card border border-hairline bg-surface p-1.5 shadow-pop">
            {candidates.length === 0 ? (
              <p className="px-2 py-2 text-caption text-ink-45">Every trip is already here.</p>
            ) : (
              candidates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'updateTrip', id: t.id, patch: { folderId: folder.id } })
                    setAddOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-button px-2 py-1.5 text-left text-caption text-ink hover:bg-[rgba(2,16,52,0.05)]"
                >
                  <span className="min-w-0 flex-1 truncate">{t.title || 'Untitled trip'}</span>
                  <Chip status={t.status} />
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SortableTripRow({
  trip,
  onOpen,
  onRemove,
}: {
  trip: Trip
  onOpen: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: trip.id })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border-t border-hairline py-2 first:border-t-0"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder trip"
        className="shrink-0 cursor-grab touch-none rounded p-0.5 text-ink-40 transition-colors hover:text-ink-60 active:cursor-grabbing"
      >
        <Icon name="grip" size={14} />
      </button>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="block truncate font-display text-[16px] leading-snug text-ink">
          {trip.title || 'Untitled trip'}
        </span>
        <span className="block text-caption text-ink-45">
          {trip.days.length} {trip.days.length === 1 ? 'day' : 'days'} · {fmtDateYear(parseISO(trip.startDate))}
        </span>
      </button>
      <Chip status={trip.status} />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove from collection"
        className="shrink-0 rounded p-1 text-ink-40 hover:text-terracotta"
      >
        <Icon name="close" size={13} />
      </button>
    </li>
  )
}

function EmptyState({ query, onNewTrip }: { query: string; onNewTrip: () => void }) {
  if (query.trim()) {
    return (
      <div className="py-12 text-center">
        <p className="text-body text-ink-60">No trips match “{query}”.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <p className="max-w-sm font-display text-[22px] leading-snug text-ink">
        Nowhere planned yet — where does the wandering begin?
      </p>
      <button
        type="button"
        onClick={onNewTrip}
        className="focusable inline-flex items-center gap-1.5 rounded-button bg-ink px-4 py-2.5 text-caption font-medium text-canvas transition-opacity hover:opacity-90"
      >
        <Icon name="plus" size={16} />
        Start a new trip
      </button>
    </div>
  )
}
