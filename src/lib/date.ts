const DAY_MS = 86_400_000

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(iso: string, n: number): Date {
  return new Date(parseISO(iso).getTime() + n * DAY_MS)
}

/** Date of day N (0-based) in a trip, derived from its start date. */
export function dayDate(startISO: string, index: number): Date {
  return addDays(startISO, index)
}

/** "Mon, Jun 12" */
export function fmtDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** "Jun 12" */
export function fmtShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** "Jun 12, 2026" */
export function fmtDateYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Duration is DERIVED from the day count — never stored. */
export function durationLabel(dayCount: number): string {
  return `${dayCount} ${dayCount === 1 ? 'day' : 'days'}`
}

export function dateRangeLabel(startISO: string, dayCount: number): string {
  if (dayCount <= 0) return fmtShort(parseISO(startISO))
  return `${fmtShort(parseISO(startISO))} – ${fmtShort(addDays(startISO, dayCount - 1))}`
}

/** Whole days between two ISO dates (b - a). */
export function daysBetween(aISO: string, bISO: string): number {
  return Math.round((parseISO(bISO).getTime() - parseISO(aISO).getTime()) / DAY_MS)
}
