import { useState } from 'react'
import { newDetail, useStore, useTrip, uid } from '../lib/store'
import { dateRangeLabel, dayDate, fmtDayLabel } from '../lib/date'
import { symbolOf } from '../lib/currency'
import { CHILD_DETAIL_TYPES, DETAIL_META } from '../lib/details'
import { EditableText } from '../components/EditableText'
import { Icon, type IconName } from '../components/Icon'
import { Sheet, type SheetOption } from './Sheet'
import type { Detail, DetailType, Trip } from '../lib/types'

interface MobileEditorProps {
  tripId: string
  onBack: () => void
}

/** What the day-level "+" offers. Only Destination lives at day level; the rest nest under one. */
const DAY_SHEET: SheetOption[] = [
  { key: 'destination', label: 'Destination', icon: 'destination' },
  { key: 'time', label: 'Time', icon: 'time', disabled: true },
  { key: 'transportation', label: 'Transportation', icon: 'transportation', disabled: true },
  { key: 'money', label: 'Cost', icon: 'money', disabled: true },
  { key: 'doc', label: 'Document', icon: 'doc', disabled: true },
  { key: 'note', label: 'Note', icon: 'note', disabled: true },
]

/** What a destination's "+" offers — time plus every nestable detail type. */
const DEST_SHEET: SheetOption[] = [
  { key: 'time', label: 'Time', icon: 'time' },
  ...CHILD_DETAIL_TYPES.map((d) => ({ key: d.type, label: d.label, icon: d.icon })),
]

function travelersLabel(trip: Trip): string {
  if (trip.solo) return 'Solo trip'
  const n = trip.people.split(',').filter((p) => p.trim()).length
  return n === 0 ? '' : `${n} ${n === 1 ? 'traveler' : 'travelers'}`
}

/** One line of a child detail, rendered read-first like the design. */
function childLine(child: Detail): string {
  if (child.type === 'transportation') {
    const mode = child.mode ? DETAIL_META.transportation.label : ''
    const parts = [
      child.fromCity && child.toCity ? `${child.fromCity} → ${child.toCity}` : '',
      child.durationMin ? `${child.durationMin} min` : '',
      child.depTime && child.arrTime ? `${child.depTime}–${child.arrTime}` : '',
    ].filter(Boolean)
    return parts.join(' · ') || child.text || mode || 'Transportation'
  }
  return child.text
}

export function MobileEditor({ tripId, onBack }: MobileEditorProps) {
  const { dispatch } = useStore()
  const trip = useTrip(tripId)
  const [openCities, setOpenCities] = useState<Record<string, boolean>>({})
  const [openDests, setOpenDests] = useState<Record<string, boolean>>({})
  const [daySheet, setDaySheet] = useState<string | null>(null)
  const [destSheet, setDestSheet] = useState<{ dayId: string; destId: string } | null>(null)

  if (!trip) {
    return (
      <div className="px-4 pt-5">
        <button type="button" onClick={onBack} className="text-[14px] text-ink-60">
          ← Your trips
        </button>
        <p className="mt-6 text-[15px] text-ink-60">This trip no longer exists.</p>
      </div>
    )
  }

  const cities = trip.cities ?? []
  // Day numbering/dates run across the whole trip in city order — same as the desktop editor.
  const ordered = cities.flatMap((c) => trip.days.filter((d) => d.cityId === c.id))
  const dayMeta = (id: string) => {
    const i = ordered.findIndex((d) => d.id === id)
    return { n: i + 1, date: i >= 0 ? fmtDayLabel(dayDate(trip.startDate, i)) : '' }
  }

  const metaLine =
    [
      trip.days.length ? dateRangeLabel(trip.startDate, trip.days.length) : '',
      trip.budget ? `${symbolOf(trip.currency)}${trip.budget}` : '',
      travelersLabel(trip),
    ]
      .filter(Boolean)
      .join(' · ') || 'Set your dates, budget, and travelers'

  function addFromDaySheet(type: string) {
    if (daySheet && type === 'destination') {
      const detail = newDetail('destination')
      dispatch({ type: 'addDestination', tripId, dayId: daySheet, detail })
      setOpenDests((o) => ({ ...o, [detail.id]: true }))
    }
    setDaySheet(null)
  }

  function addFromDestSheet(type: string) {
    if (!destSheet) return
    const { dayId, destId } = destSheet
    if (type === 'time') {
      dispatch({ type: 'updateDetail', tripId, dayId, detailId: destId, patch: { time: '09:00' } })
    } else {
      dispatch({
        type: 'addChild',
        tripId,
        dayId,
        parentId: destId,
        detail: newDetail(type as DetailType),
      })
    }
    setDestSheet(null)
  }

  return (
    <>
      <div className="px-4 pb-10 pt-5">
        <div className="mb-5 flex items-center">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to your trips"
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-surface"
          >
            <Icon name="chevron-right" size={16} className="rotate-180 text-ink" />
          </button>
        </div>

        <EditableText
          value={trip.title}
          onChange={(v) => dispatch({ type: 'updateTrip', id: tripId, patch: { title: v } })}
          placeholder="Untitled trip"
          ariaLabel="Trip title"
          className="mb-2 font-display text-[30px] font-semibold leading-[1.15] text-ink"
        />
        <EditableText
          value={trip.description}
          onChange={(v) => dispatch({ type: 'updateTrip', id: tripId, patch: { description: v } })}
          placeholder="Add a description…"
          ariaLabel="Trip description"
          className={`mb-4 font-display text-[17px] leading-[1.4] ${
            trip.description ? 'text-ink-60' : 'italic text-ink-45'
          }`}
        />
        <div className="mb-8 text-[14px] text-ink-60">{metaLine}</div>

        {cities.map((city) => {
          const isOpen = openCities[city.id] ?? true
          const days = trip.days.filter((d) => d.cityId === city.id)
          return (
            <div key={city.id} className="mb-7">
              <div className="flex items-center gap-2 py-1.5 pb-2.5">
                <button
                  type="button"
                  onClick={() => setOpenCities((o) => ({ ...o, [city.id]: !isOpen }))}
                  aria-label={isOpen ? `Collapse ${city.name || 'city'}` : `Expand ${city.name || 'city'}`}
                  aria-expanded={isOpen}
                  className="flex h-6 w-6 shrink-0 items-center justify-center"
                >
                  <Icon
                    name="chevron-down"
                    size={12}
                    className={`text-ink-60 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                  />
                </button>
                <EditableText
                  value={city.name}
                  onChange={(v) => dispatch({ type: 'updateCity', tripId, cityId: city.id, name: v })}
                  placeholder="Name this city"
                  ariaLabel="City name"
                  className="min-w-0 flex-1 font-display text-[22px] font-semibold leading-[1.2] text-ink"
                />
              </div>

              {isOpen && (
                <>
                  {days.map((day) => {
                    const { n, date } = dayMeta(day.id)
                    return (
                      <div key={day.id} className="my-3.5 mb-[18px] pl-1">
                        <div className="mb-2.5 flex items-center justify-between">
                          <span className="text-[15px] font-semibold text-ink">
                            Day {n} — {date}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDaySheet(day.id)}
                            aria-label={`Add to day ${n}`}
                            className="flex h-7 w-7 items-center justify-center rounded-pill border border-hairline text-[17px] leading-none text-ink-60"
                          >
                            +
                          </button>
                        </div>

                        {day.accommodation !== undefined && (
                          <div className="flex items-center gap-2.5 border-b border-hairline px-0.5 py-3">
                            <Icon name="accommodation" size={16} className="shrink-0 text-ink-60" />
                            <EditableText
                              value={day.accommodation}
                              onChange={(v) =>
                                dispatch({ type: 'setAccommodation', tripId, dayId: day.id, text: v })
                              }
                              placeholder="Where you're staying"
                              ariaLabel="Accommodation"
                              className="min-w-0 flex-1 text-[14px] text-ink-60"
                            />
                          </div>
                        )}

                        {day.details.map((dest) => {
                          const isDestOpen = !!openDests[dest.id]
                          const kids = dest.children ?? []
                          const count = kids.length + (dest.time ? 1 : 0)
                          return (
                            <div key={dest.id} className="border-b border-hairline">
                              <div className="flex min-h-[44px] items-center gap-2.5 px-0.5 py-3">
                                <Icon
                                  name={(dest.icon as IconName) || 'destination'}
                                  size={16}
                                  className="shrink-0 text-ink-60"
                                />
                                <span className="min-w-0 flex-1">
                                  <EditableText
                                    value={dest.text}
                                    onChange={(v) =>
                                      dispatch({
                                        type: 'updateDetail',
                                        tripId,
                                        dayId: day.id,
                                        detailId: dest.id,
                                        patch: { text: v },
                                      })
                                    }
                                    placeholder="Add a place"
                                    ariaLabel="Destination"
                                    className="text-[16px] font-medium text-ink"
                                  />
                                  {!isDestOpen && (
                                    <span className="mt-0.5 block text-[13px] text-ink-45">
                                      {count === 0 ? 'No details yet' : `${count} detail${count === 1 ? '' : 's'}`}
                                    </span>
                                  )}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setOpenDests((o) => ({ ...o, [dest.id]: !isDestOpen }))}
                                  aria-label={isDestOpen ? 'Collapse destination' : 'Expand destination'}
                                  aria-expanded={isDestOpen}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center"
                                >
                                  <Icon
                                    name="chevron-down"
                                    size={11}
                                    className={`text-ink-45 transition-transform duration-200 ${
                                      isDestOpen ? '-rotate-90' : ''
                                    }`}
                                  />
                                </button>
                              </div>

                              {isDestOpen && (
                                <div className="flex flex-col gap-3 pb-4 pl-[26px] pt-0.5">
                                  {dest.time && (
                                    <div className="flex items-center gap-2.5">
                                      <Icon name="time" size={15} className="shrink-0 text-ink-45" />
                                      <span className="text-[14px] text-ink-60">{dest.time}</span>
                                    </div>
                                  )}
                                  {kids.map((child) => (
                                    <div key={child.id} className="flex items-center gap-2.5">
                                      <Icon
                                        name={DETAIL_META[child.type].icon}
                                        size={15}
                                        className="shrink-0 text-ink-45"
                                      />
                                      <EditableText
                                        value={childLine(child)}
                                        onChange={(v) =>
                                          dispatch({
                                            type: 'updateDetail',
                                            tripId,
                                            dayId: day.id,
                                            parentId: dest.id,
                                            detailId: child.id,
                                            patch: { text: v },
                                          })
                                        }
                                        placeholder={DETAIL_META[child.type].placeholder}
                                        ariaLabel={DETAIL_META[child.type].label}
                                        className="min-w-0 flex-1 text-[14px] text-ink-60"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          dispatch({
                                            type: 'deleteDetail',
                                            tripId,
                                            dayId: day.id,
                                            parentId: dest.id,
                                            detailId: child.id,
                                          })
                                        }
                                        aria-label={`Delete ${DETAIL_META[child.type].label}`}
                                        className="shrink-0 p-1 text-ink-40"
                                      >
                                        <Icon name="close" size={12} />
                                      </button>
                                    </div>
                                  ))}
                                  {count === 0 && (
                                    <p className="text-[13px] italic text-ink-45">
                                      No details yet — tap + to add time, cost, or a note.
                                    </p>
                                  )}
                                  <div className="flex gap-4">
                                    <button
                                      type="button"
                                      onClick={() => setDestSheet({ dayId: day.id, destId: dest.id })}
                                      className="text-[13px] font-semibold text-dusty-blue"
                                    >
                                      + Add detail
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        dispatch({
                                          type: 'deleteDetail',
                                          tripId,
                                          dayId: day.id,
                                          detailId: dest.id,
                                        })
                                      }
                                      className="text-[13px] text-ink-45"
                                    >
                                      Delete place
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'addDay', tripId, cityId: city.id })}
                    className="mt-1 px-0.5 py-2 text-[14px] font-semibold text-dusty-blue"
                  >
                    + Add a new day
                  </button>
                </>
              )}
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => dispatch({ type: 'addCity', tripId, cityId: uid() })}
          className="mt-2 px-0.5 py-2 text-[14px] font-semibold text-dusty-blue"
        >
          + Add a city
        </button>
      </div>

      {daySheet && (
        <Sheet
          title="Add to this day"
          options={DAY_SHEET}
          onPick={addFromDaySheet}
          onClose={() => setDaySheet(null)}
        />
      )}
      {destSheet && (
        <Sheet
          title="Add a detail"
          options={DEST_SHEET}
          onPick={addFromDestSheet}
          onClose={() => setDestSheet(null)}
        />
      )}
    </>
  )
}
