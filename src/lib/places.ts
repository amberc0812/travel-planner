import type { Trip, TripStatus } from './types'
import { dayDate } from './date'

export interface Place {
  id: string
  name: string
  lat: number
  lon: number
  tripId: string
  tripTitle: string
  status: TripStatus
  /** The day this stop falls on, derived from the trip start date. */
  date: Date
  month: number
  year: number
  note?: string
}

/** Flatten every geocoded Destination across all trips into map points. */
export function collectPlaces(trips: Trip[]): Place[] {
  const places: Place[] = []
  for (const trip of trips) {
    trip.days.forEach((day, i) => {
      for (const d of day.details) {
        if (d.type === 'destination' && typeof d.lat === 'number' && typeof d.lon === 'number') {
          const date = dayDate(trip.startDate, i)
          const note = (d.children ?? []).find((c) => c.type === 'note' && c.text.trim())?.text
          places.push({
            id: d.id,
            name: d.text || 'Untitled place',
            lat: d.lat,
            lon: d.lon,
            tripId: trip.id,
            tripTitle: trip.title || 'Untitled trip',
            status: trip.status,
            date,
            month: date.getMonth(),
            year: date.getFullYear(),
            note,
          })
        }
      }
    })
  }
  return places
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
