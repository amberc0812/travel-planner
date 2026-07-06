import { useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { useStore, useTrip, uid } from '../lib/store'
import { EditableText } from '../components/EditableText'
import { SortableDay } from '../components/SortableDay'
import { DetailRow } from '../components/DetailRow'
import { DownloadMenu } from '../components/DownloadMenu'
import { ShareMenu } from '../components/ShareMenu'
import { Icon, type IconName } from '../components/Icon'
import { dayDate, durationLabel, fmtDateYear, fmtDayLabel, parseISO } from '../lib/date'
import { CURRENCIES, parseAmount, parseMoney, stripSymbols, symbolOf } from '../lib/currency'
import { lookupCountry } from '../lib/geo-cities'
import type { CurrencyCode, City, Day, Detail } from '../lib/types'

interface EditorProps {
  tripId: string
  onBack: () => void
}

/** Which droppable types each dragged item may target — keeps day/destination/detail drags from interfering. */
const DROP_ACCEPTS: Record<string, Set<string>> = {
  day: new Set(['day', 'day-drop', 'city-drop']),
  destination: new Set(['destination', 'day-drop', 'day']),
  detail: new Set(['detail', 'dest-drop', 'destination']),
}

const collisionDetection: CollisionDetection = (args) => {
  const activeType = args.active.data.current?.type as string | undefined
  const accepts = activeType ? DROP_ACCEPTS[activeType] : undefined
  const containers = accepts
    ? args.droppableContainers.filter((c) => accepts.has((c.data.current?.type as string) ?? ''))
    : args.droppableContainers
  return closestCorners({ ...args, droppableContainers: containers })
}

export function Editor({ tripId, onBack }: EditorProps) {
  const { dispatch } = useStore()
  const trip = useTrip(tripId)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [focusCityId, setFocusCityId] = useState<string | null>(null)

  if (!trip) {
    return (
      <div className="px-10 py-12 lg:px-20">
        <button onClick={onBack} className="text-caption text-ink-45 hover:text-ink">
          ← All trips
        </button>
        <p className="mt-6 text-body text-ink-60">This trip no longer exists.</p>
      </div>
    )
  }

  const dayCount = trip.days.length
  const patch = (p: Partial<typeof trip>) => dispatch({ type: 'updateTrip', id: trip.id, patch: p })

  const currency = trip.currency ?? 'USD'
  const totalSpent = trip.days.reduce(
    (sum, day) =>
      sum +
      day.details.reduce(
        (ds, dest) =>
          ds +
          (dest.children ?? [])
            .filter((c) => c.type === 'money')
            .reduce((cs, c) => cs + parseMoney(c.text), 0),
        0,
      ),
    0,
  )
  const remaining = parseAmount(trip.budget) - totalSpent

  const titleCountry = trip.country ?? lookupCountry(trip.title)
  const extraCities = trip.cities ?? []
  const ordered = extraCities.flatMap((c) => trip.days.filter((d) => d.cityId === c.id))
  const dayMeta = (id: string) => {
    const i = ordered.findIndex((d) => d.id === id)
    return { index: i, label: i >= 0 ? fmtDayLabel(dayDate(trip.startDate, i)) : '' }
  }

  // For the drag preview (DragOverlay): the day or destination currently being dragged.
  const activeDay = activeId ? trip.days.find((d) => d.id === activeId) : undefined
  const activeDest =
    activeId && !activeDay ? trip.days.flatMap((d) => d.details).find((x) => x.id === activeId) : undefined
  const activeDetail =
    activeId && !activeDay && !activeDest
      ? trip.days
          .flatMap((d) => d.details)
          .flatMap((dest) => dest.children ?? [])
          .find((c) => c.id === activeId)
      : undefined

  const addCity = () => {
    const cityId = uid()
    dispatch({ type: 'addCity', tripId: trip.id, cityId })
    setFocusCityId(cityId)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const aType = active.data.current?.type

    if (aType === 'day') {
      const overType = over.data.current?.type
      if (overType === 'city-drop') {
        dispatch({
          type: 'moveDay',
          tripId: trip.id,
          activeId: String(active.id),
          toCityId: over.data.current?.cityId as string,
        })
      } else {
        const overDayId = overType === 'day-drop' ? (over.data.current?.dayId as string) : String(over.id)
        if (overDayId && overDayId !== active.id) {
          dispatch({ type: 'moveDay', tripId: trip.id, activeId: String(active.id), overId: overDayId })
        }
      }
      return
    }

    if (aType === 'destination') {
      const fromDayId = active.data.current?.dayId as string
      const overType = over.data.current?.type
      let toDayId: string
      let overDestId: string | null = null
      if (overType === 'destination') {
        toDayId = over.data.current?.dayId as string
        overDestId = String(over.id)
      } else if (overType === 'day-drop') {
        toDayId = over.data.current?.dayId as string
      } else if (overType === 'day') {
        toDayId = String(over.id)
      } else {
        return
      }
      const fromDay = trip.days.find((d) => d.id === fromDayId)
      const toDay = trip.days.find((d) => d.id === toDayId)
      if (!fromDay || !toDay) return
      const fromIndex = fromDay.details.findIndex((x) => x.id === active.id)
      let toIndex = overDestId
        ? toDay.details.findIndex((x) => x.id === overDestId)
        : toDay.details.length
      if (toIndex < 0) toIndex = toDay.details.length
      if (fromDayId === toDayId && fromIndex === toIndex) return
      dispatch({ type: 'moveDestination', tripId: trip.id, fromDayId, toDayId, fromIndex, toIndex })
      return
    }

    if (aType === 'detail') {
      const fromDayId = active.data.current?.dayId as string
      const fromDestId = active.data.current?.destId as string
      const overType = over.data.current?.type
      let toDayId: string
      let toDestId: string
      let overDetailId: string | undefined
      if (overType === 'detail') {
        toDayId = over.data.current?.dayId as string
        toDestId = over.data.current?.destId as string
        overDetailId = String(over.id)
      } else if (overType === 'dest-drop') {
        toDayId = over.data.current?.dayId as string
        toDestId = over.data.current?.destId as string
      } else if (overType === 'destination') {
        toDayId = over.data.current?.dayId as string
        toDestId = String(over.id)
      } else {
        return
      }
      if (overDetailId === String(active.id)) return
      dispatch({
        type: 'moveDetail',
        tripId: trip.id,
        fromDayId,
        fromDestId,
        toDayId,
        toDestId,
        detailId: String(active.id),
        overDetailId,
      })
    }
  }

  return (
    <div className="px-10 py-12 lg:px-20">
      <div className="mx-auto max-w-[760px]">
        <button
          type="button"
          data-export-ignore
          onClick={onBack}
          className="focusable mb-7 inline-flex items-center gap-1.5 text-caption text-ink-45 transition-colors hover:text-ink"
        >
          <Icon name="arrow-right" size={14} className="rotate-180" />
          All trips
        </button>

        <EditableText
          value={trip.title}
          onChange={(v) => patch({ title: v, country: lookupCountry(v) })}
          placeholder="Name a city"
          ariaLabel="Trip title"
          className="font-display text-display text-ink"
        />
        {titleCountry && (
          <p className="mt-1 inline-flex items-center gap-1 text-caption text-ink-45">
            <Icon name="destination" size={13} />
            {titleCountry}
          </p>
        )}
        {/* Trip actions — top-left, aligned under the title */}
        <div data-export-ignore className="mt-3 flex flex-wrap items-center gap-2">
          <DownloadMenu trip={trip} />
          <ShareMenu trip={trip} />
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete “${trip.title || 'this trip'}”? This can’t be undone.`)) {
                dispatch({ type: 'deleteTrip', id: trip.id })
                onBack()
              }
            }}
            className="focusable ml-1 inline-flex items-center gap-1 rounded-button px-2 py-1 text-[12px] text-ink-45 transition-colors hover:text-terracotta"
          >
            <Icon name="trash" size={13} />
            Delete
          </button>
        </div>

        {/* Inline meta row — Duration is derived, the rest are editable */}
        <div className="mt-7 grid grid-cols-4 overflow-hidden rounded-card border border-hairline bg-surface bg-[linear-gradient(135deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.12)_30%,rgba(255,255,255,0)_52%,rgba(255,255,255,0.28)_100%)] shadow-card backdrop-blur-sm">
          <MetaField label="Duration">
            <span className="text-body italic text-dusty-blue">{durationLabel(dayCount)}</span>
          </MetaField>
          <MetaField label="Start Date" divider>
            <StartDateField value={trip.startDate} onChange={(v) => patch({ startDate: v })} />
          </MetaField>
          <MetaField
            label="Budget"
            divider
            accessory={
              <select
                value={currency}
                onChange={(e) => patch({ currency: e.target.value as CurrencyCode })}
                aria-label="Currency"
                title="Click to change currency"
                className="focusable cursor-pointer appearance-none rounded bg-transparent text-[11px] font-medium text-ink-60 transition-colors hover:text-ink"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            }
          >
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="flex items-baseline text-body italic text-dusty-blue">
                {symbolOf(currency)}
                <EditableText
                  value={stripSymbols(trip.budget)}
                  onChange={(v) => patch({ budget: v })}
                  placeholder="0"
                  ariaLabel="Budget amount"
                  className="italic"
                />
              </span>
              {trip.budget.trim() !== '' && (
                <span className="text-caption text-ink-45">
                  {`${Math.round(Math.abs(remaining)).toLocaleString('en-US')} ${remaining >= 0 ? 'left' : 'over'}`}
                </span>
              )}
            </div>
          </MetaField>
          <MetaField
            divider
            label={
              <button
                type="button"
                onClick={() => patch({ solo: !trip.solo })}
                aria-label="Switch between people and solo trip"
                title="Click to switch between People and Solo trip"
                className="focusable rounded transition-colors hover:text-ink"
              >
                {trip.solo ? 'Solo trip' : 'People'}
              </button>
            }
          >
            {trip.solo ? (
              <span className="text-body italic text-dusty-blue">Just you</span>
            ) : (
              <EditableText
                value={trip.people}
                onChange={(v) => patch({ people: v })}
                placeholder="Add people, comma-separated"
                ariaLabel="People"
                className="text-body italic text-dusty-blue"
              />
            )}
          </MetaField>
        </div>

        {/* Cities & days — each city starts a section; "Add a city" sits by the newest one */}
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="mt-10 flex flex-col gap-6">
            {extraCities.length === 0 ? (
              <div className="rounded-card border border-dashed border-hairline py-8 text-center">
                <p className="mb-3 text-caption italic text-ink-45">No cities yet — add one to start.</p>
                <button
                  type="button"
                  onClick={addCity}
                  className="focusable inline-flex items-center gap-1.5 rounded-button border border-hairline px-4 py-2 text-caption italic text-ink-60 transition-colors hover:border-ink-40 hover:text-ink"
                >
                  <Icon name="plus" size={14} />
                  Add a city
                </button>
              </div>
            ) : (
              extraCities.map((city, i) => (
                <CitySection
                  key={city.id}
                  tripId={trip.id}
                  cityId={city.id}
                  city={city}
                  days={trip.days.filter((d) => d.cityId === city.id)}
                  dayMeta={dayMeta}
                  totalDays={dayCount}
                  autoFocusName={city.id === focusCityId}
                  onAddCity={addCity}
                  showAddCity={i === extraCities.length - 1}
                />
              ))
            )}
          </div>
          <DragOverlay>
            {activeDay ? (
              <DayCardPreview
                day={activeDay}
                index={dayMeta(activeDay.id).index}
                label={dayMeta(activeDay.id).label}
              />
            ) : activeDest ? (
              <DestinationPreview destination={activeDest} />
            ) : activeDetail ? (
              <div className="cursor-grabbing shadow-pop">
                <DetailRow detail={activeDetail} onPatch={() => {}} onDelete={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

function MetaField({
  label,
  divider,
  accessory,
  children,
}: {
  label: ReactNode
  divider?: boolean
  accessory?: ReactNode
  children: ReactNode
}) {
  return (
    <div className={`px-5 py-3 ${divider ? 'border-l border-hairline' : ''}`}>
      <div className="mb-1 flex items-center gap-1.5 text-caption text-ink-60">
        <span>{label}</span>
        {accessory}
      </div>
      {children}
    </div>
  )
}

function CitySection({
  tripId,
  cityId,
  city,
  days,
  dayMeta,
  totalDays,
  autoFocusName,
  onAddCity,
  showAddCity,
}: {
  tripId: string
  cityId: string
  city?: City
  days: Day[]
  dayMeta: (id: string) => { index: number; label: string }
  totalDays: number
  autoFocusName?: boolean
  onAddCity?: () => void
  showAddCity?: boolean
}) {
  const { dispatch } = useStore()
  const { setNodeRef, isOver } = useDroppable({ id: `citydrop:${cityId}`, data: { type: 'city-drop', cityId } })

  return (
    <section>
      {city && (
        <div className="group/city mb-3 flex items-center gap-2">
          <Icon name="destination" size={16} className="shrink-0 text-ink-45" />
          <EditableText
            value={city.name}
            onChange={(v) => dispatch({ type: 'updateCity', tripId, cityId, name: v })}
            placeholder="Add a city"
            ariaLabel="City name"
            autoFocus={autoFocusName}
            className="font-display text-[22px] text-ink"
          />
          {city.country && <span className="text-caption text-ink-45">· {city.country}</span>}
          <span className="text-caption text-ink-45">· {days.length} {days.length === 1 ? 'day' : 'days'}</span>
          <div className="ml-auto flex items-center gap-2">
            {showAddCity && onAddCity && (
              <button
                type="button"
                onClick={onAddCity}
                className="focusable inline-flex items-center gap-1.5 rounded-button border border-hairline px-3 py-1.5 text-caption italic text-ink-60 transition-colors hover:border-ink-40 hover:text-ink"
              >
                <Icon name="plus" size={14} />
                Add a city
              </button>
            )}
            <button
              type="button"
              onClick={() => dispatch({ type: 'deleteCity', tripId, cityId })}
              aria-label="Delete city"
              className="rounded p-1 text-ink-40 opacity-0 transition-opacity hover:text-terracotta focus-visible:opacity-100 group-hover/city:opacity-100"
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        </div>
      )}
      <SortableContext items={days.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-[8px] flex-col gap-4 rounded-card transition-colors ${
            isOver ? 'bg-[rgba(2,16,52,0.04)]' : ''
          }`}
        >
          {days.map((day) => {
            const m = dayMeta(day.id)
            return (
              <SortableDay
                key={day.id}
                tripId={tripId}
                day={day}
                index={m.index}
                dateLabel={m.label}
                canDelete={totalDays > 1}
              />
            )
          })}
          {days.length === 0 && (
            <p className="py-3 text-center text-caption italic text-ink-45">
              Drop a day here, or add one below
            </p>
          )}
        </div>
      </SortableContext>
      <button
        type="button"
        onClick={() => dispatch({ type: 'addDay', tripId, cityId })}
        className="focusable mt-3 w-full rounded-card border border-dashed border-ink-40 py-3 text-center text-caption italic text-ink-60 transition-colors hover:border-ink hover:text-ink"
      >
        + Add a day
      </button>
    </section>
  )
}

/** Lightweight, static clone shown under the cursor while dragging a day (keeps the drag smooth). */
function DayCardPreview({ day, index, label }: { day: Day; index: number; label: string }) {
  return (
    <section className="cursor-grabbing rounded-card bg-dusty-blue p-5 shadow-pop">
      <header className="mb-3 flex items-center gap-3 px-1">
        <Icon name="grip" size={16} className="text-ink/40" />
        <h3 className="font-display text-[20px] leading-none text-ink">Day {index + 1}</h3>
        <span className="text-caption text-ink-60">{label}</span>
      </header>
      <div className="flex flex-col gap-3">
        {day.details.map((dest) => (
          <div
            key={dest.id}
            className="truncate rounded-button border border-hairline bg-surface px-3 py-2.5 text-body font-medium text-ink"
          >
            {dest.text || 'Untitled place'}
          </div>
        ))}
        {day.details.length === 0 && (
          <p className="py-2 text-center text-caption italic text-ink/45">No destinations yet</p>
        )}
      </div>
    </section>
  )
}

/** Lightweight, static clone shown under the cursor while dragging a destination. */
function DestinationPreview({ destination }: { destination: Detail }) {
  const count = (destination.children ?? []).length
  return (
    <div className="flex cursor-grabbing items-center gap-2 rounded-button border border-hairline bg-surface px-3 py-2.5 shadow-pop">
      <Icon name="grip" size={14} className="text-ink-40" />
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-dusty-blue">
        <Icon name={(destination.icon as IconName) ?? 'destination'} size={16} />
      </span>
      <span className="flex-1 truncate text-body font-medium text-ink">{destination.text || 'Add a place'}</span>
      {count > 0 && (
        <span className="shrink-0 text-caption text-ink-45">
          {count} {count === 1 ? 'detail' : 'details'}
        </span>
      )}
    </div>
  )
}

function StartDateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative inline-block">
      <span className="text-body italic text-dusty-blue">{fmtDateYear(parseISO(value))}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        aria-label="Start date"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  )
}
