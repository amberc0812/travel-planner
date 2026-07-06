import type { Trip } from './types'

export interface ShareResult {
  id: string
  link: string
  emailed: boolean
  emailError?: string
}

/** Save a trip snapshot server-side and, if a recipient is given, email them the link. */
export async function createShare(trip: Trip, recipient?: string): Promise<ShareResult> {
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ trip, recipient }),
  })
  const data = (await res.json().catch(() => null)) as (ShareResult & { error?: string }) | null
  if (!res.ok || !data) {
    throw new Error(data?.error ?? `Sharing is unavailable (${res.status}).`)
  }
  return data
}

/** Load a shared trip by its share id. */
export async function fetchSharedTrip(id: string): Promise<Trip> {
  const res = await fetch(`/api/share/${encodeURIComponent(id)}`)
  const data = (await res.json().catch(() => null)) as { trip?: Trip; error?: string } | null
  if (!res.ok || !data?.trip) {
    throw new Error(data?.error ?? 'This shared trip could not be found.')
  }
  return data.trip
}
