import { useEffect, useState } from 'react'
import type { Detail, Trip } from '../lib/types'
import { fetchSharedTrip } from '../lib/api'
import { dateRangeLabel, dayDate, durationLabel, fmtDayLabel } from '../lib/date'
import { DETAIL_META } from '../lib/details'
import { modeMeta } from '../lib/transport'
import { stripSymbols, symbolOf } from '../lib/currency'
import { lookupCountry } from '../lib/geo-cities'
import { Icon } from '../components/Icon'

interface SharedTripProps {
  shareId: string
  onImport: (trip: Trip) => void
  onBack: () => void
}

const stripMarkdown = (s: string) => s.replace(/[*_`>#]/g, '').trim()

/** One clean text line for a child detail — '' when there's nothing to show. */
function childLine(c: Detail): string {
  if (c.type === 'transportation') {
    const parts = [modeMeta(c.mode).label]
    if (c.mode === 'car' || c.mode === 'walk' || c.mode === 'bike') {
      if (c.durationMin) parts.push(`${c.durationMin} min`)
    } else {
      const route = [c.fromCity?.trim(), c.toCity?.trim()].filter(Boolean).join(' → ')
      if (route) parts.push(route)
      const times = [c.depTime, c.arrTime].filter(Boolean).join(' → ')
      if (times) parts.push(times)
    }
    return parts.join(' · ')
  }
  if (c.type === 'time') return c.text ? `Time — ${c.text}` : ''
  if (c.type === 'note') return c.text.trim() ? stripMarkdown(c.text) : ''
  if (!c.text.trim()) return ''
  return `${DETAIL_META[c.type]?.label ?? ''} — ${c.text.trim()}`
}

export function SharedTrip({ shareId, onImport, onBack }: SharedTripProps) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchSharedTrip(shareId)
      .then((t) => alive && setTrip(t))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Could not load the trip'))
    return () => {
      alive = false
    }
  }, [shareId])

  if (error) {
    return (
      <div className="px-10 py-12 lg:px-20">
        <div className="mx-auto max-w-[760px]">
          <p className="text-body text-ink-60">{error}</p>
          <button onClick={onBack} className="mt-4 text-caption text-ink-45 transition-colors hover:text-ink">
            ← Go to my trips
          </button>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="px-10 py-12 lg:px-20">
        <div className="mx-auto max-w-[760px]">
          <p className="text-body text-ink-60">Loading shared trip…</p>
        </div>
      </div>
    )
  }

  const country = trip.country ?? lookupCountry(trip.title)
  const meta: string[] = [dateRangeLabel(trip.startDate, trip.days.length), durationLabel(trip.days.length)]
  if (stripSymbols(trip.budget)) meta.push(symbolOf(trip.currency) + stripSymbols(trip.budget))
  if (trip.solo) meta.push('Solo trip')
  else if (trip.people.trim()) meta.push(trip.people.trim())

  const extraCities = trip.cities ?? []
  const groups: { name?: string; country?: string; days: Trip['days'] }[] = [
    { days: trip.days.filter((d) => (d.cityId ?? 'main') === 'main') },
    ...extraCities.map((c) => ({
      name: c.name,
      country: c.country ?? lookupCountry(c.name),
      days: trip.days.filter((d) => d.cityId === c.id),
    })),
  ]
  let dayNo = 0

  return (
    <div className="px-10 py-12 lg:px-20">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-7 flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-badge bg-canvas px-2.5 py-1 text-[11px] uppercase tracking-[0.4px] text-ink-45">
            Shared trip
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-button px-2.5 py-1.5 text-caption text-ink-60 transition-colors hover:text-ink"
            >
              My trips
            </button>
            <button
              type="button"
              onClick={() => onImport(trip)}
              className="focusable inline-flex items-center gap-1.5 rounded-button bg-ink px-3 py-1.5 text-caption font-medium text-canvas transition-opacity hover:opacity-90"
            >
              <Icon name="plus" size={14} />
              Save a copy
            </button>
          </div>
        </div>

        <h1 className="font-display text-[34px] leading-tight text-ink">{trip.title || 'Untitled trip'}</h1>
        {country && <p className="mt-1 text-caption text-ink-45">{country}</p>}
        {trip.description && <p className="mt-3 text-body italic text-ink-60">{trip.description}</p>}
        <p className="mt-4 text-caption text-ink-45">{meta.join('   ·   ')}</p>

        <div className="mt-6 border-t border-hairline" />

        {groups.map((g, gi) => (
          <div key={gi}>
            {g.name !== undefined && (
              <h2 className="mt-8 font-display text-[22px] text-ink">
                {g.name || 'Untitled city'}
                {g.country && <span className="ml-2 text-caption font-normal text-ink-45">· {g.country}</span>}
              </h2>
            )}
            {g.days.map((day) => {
              dayNo += 1
              return (
                <div key={day.id} className="mt-6">
                  <h3 className="font-display text-[18px] text-ink">
                    Day {dayNo} — {fmtDayLabel(dayDate(trip.startDate, dayNo - 1))}
                  </h3>
                  {day.accommodation && <p className="mt-0.5 text-caption text-ink-60">Staying: {day.accommodation}</p>}
                  {day.details.length === 0 ? (
                    <p className="mt-2 text-body italic text-ink-45">No plans yet.</p>
                  ) : (
                    day.details.map((dest) => (
                      <div key={dest.id} className="mt-3">
                        <p className="text-body font-medium text-ink">• {dest.text || 'Untitled place'}</p>
                        {(dest.children ?? []).map((c) => {
                          const line = childLine(c)
                          return line ? (
                            <p key={c.id} className="ml-4 mt-1 text-caption text-ink-60">
                              {line}
                            </p>
                          ) : null
                        })}
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
