import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { statusMeta } from '../lib/status'
import { addDays, daysBetween, fmtShort, parseISO, toISO } from '../lib/date'
import type { Trip } from '../lib/types'

interface MobileHomeProps {
  onOpenTrip: (id: string) => void
  onNewTrip: () => void
}

/** "2 travelers" / "Solo trip" — the second line of a trip row. */
function travelersLabel(trip: Trip): string {
  if (trip.solo) return 'Solo trip'
  const n = trip.people.split(',').filter((p) => p.trim()).length
  if (n === 0) return 'No travelers yet'
  return `${n} ${n === 1 ? 'traveler' : 'travelers'}`
}

/**
 * Compact range for the narrow date column — "Jun 10 – 17" within a month,
 * "Jun 28 – Jul 3" across one. A single-day trip is just "Jun 10".
 */
function tripDates(trip: Trip): string {
  const n = trip.days.length
  const start = parseISO(trip.startDate)
  if (n <= 1) return fmtShort(start)
  const end = addDays(trip.startDate, n - 1)
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  return sameMonth ? `${fmtShort(start)} – ${end.getDate()}` : `${fmtShort(start)} – ${fmtShort(end)}`
}

/** Where you are in an in-progress trip, clamped to the trip's length. */
function resumeLine(trip: Trip): string {
  const total = trip.days.length
  const current = Math.min(Math.max(daysBetween(trip.startDate, toISO(new Date())) + 1, 1), total || 1)
  const where = trip.cities?.[0]?.name || trip.title || 'your trip'
  return `Day ${current} of ${total || 1} in ${where}`
}

export function MobileHome({ onOpenTrip, onNewTrip }: MobileHomeProps) {
  const { trips } = useStore()

  const ordered = useMemo(
    () => [...trips].sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()),
    [trips],
  )
  const resume = trips.find((t) => t.status === 'intrip')

  if (trips.length === 0) {
    return (
      <div className="px-4 pb-6 pt-[22px]">
        <div className="flex min-h-[64vh] flex-col items-center justify-center gap-[22px] px-7 py-10 text-center">
          <p className="font-display text-[19px] font-normal italic leading-[1.5] text-ink-60">
            Somewhere, a trip is waiting to be planned.
          </p>
          <button
            type="button"
            onClick={onNewTrip}
            className="rounded-button bg-dusty-blue px-[30px] py-3.5 text-[16px] font-semibold text-surface"
          >
            Create your first trip
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pb-6 pt-[22px]">
      {resume && (
        <button
          type="button"
          onClick={() => onOpenTrip(resume.id)}
          className="mb-8 block w-full rounded-card bg-surface px-6 py-5 text-left shadow-card"
        >
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-40">
            Continue planning
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-[22px] font-semibold leading-[26px] text-ink">
              {resumeLine(resume)}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[15px] font-semibold text-dusty-blue">
              see more
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </button>
      )}

      <h1 className="mb-5 font-display text-[32px] font-semibold leading-[1.1] text-ink">Your trips</h1>

      {ordered.map((trip) => {
        const meta = statusMeta(trip.status)
        return (
          <button
            key={trip.id}
            type="button"
            onClick={() => onOpenTrip(trip.id)}
            className="flex w-full items-center gap-3.5 border-b border-hairline py-[18px] text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="mb-1 block truncate font-display text-[19px] font-semibold leading-[23px] text-ink">
                {trip.title || 'Untitled trip'}
              </span>
              <span className="block text-[14px] text-ink-60">{travelersLabel(trip)}</span>
            </span>
            <span className="w-[74px] shrink-0 text-right text-[13px] leading-tight tabular-nums text-ink-60">
              {tripDates(trip)}
            </span>
            <span className="flex w-[76px] shrink-0 justify-end">
              <span
                className="whitespace-nowrap rounded-badge px-2.5 py-1 text-[12px] font-semibold"
                style={{ background: meta.bg, color: meta.fg }}
              >
                {meta.label}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
