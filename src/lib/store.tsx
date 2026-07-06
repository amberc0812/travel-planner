import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import type { City, Detail, DetailType, Folder, Trip } from './types'
import { toISO } from './date'
import { lookupCountry } from './geo-cities'

const STORAGE_KEY = 'travel-planner:v2'

export const uid = () => Math.random().toString(36).slice(2, 10)

export function newDetail(type: DetailType): Detail {
  if (type === 'destination') return { id: uid(), type, text: '', children: [], collapsed: false }
  return { id: uid(), type, text: '' }
}

export function newTrip(): Trip {
  return {
    id: uid(),
    title: '',
    description: '',
    startDate: toISO(new Date()),
    budget: '',
    currency: 'USD',
    people: '',
    status: 'planning',
    cities: [],
    days: [],
  }
}

/** Legacy trips kept days at the trip level ("main"); fold those into a real first city. */
function migrateTrips(trips: Trip[]): Trip[] {
  return trips.map((t) => {
    const hasLoose = t.days.some((d) => (d.cityId ?? 'main') === 'main')
    if (!hasLoose) return t
    const cityId = uid()
    const city: City = {
      id: cityId,
      name: t.title || 'Itinerary',
      country: t.country ?? lookupCountry(t.title),
    }
    return {
      ...t,
      cities: [city, ...(t.cities ?? [])],
      days: t.days.map((d) => ((d.cityId ?? 'main') === 'main' ? { ...d, cityId } : d)),
    }
  })
}

type Action =
  | { type: 'addTrip'; trip: Trip }
  | { type: 'updateTrip'; id: string; patch: Partial<Trip> }
  | { type: 'deleteTrip'; id: string }
  | { type: 'addDay'; tripId: string; cityId: string }
  | { type: 'deleteDay'; tripId: string; dayId: string }
  | { type: 'reorderDays'; tripId: string; from: number; to: number }
  | { type: 'moveDay'; tripId: string; activeId: string; overId?: string; toCityId?: string }
  | { type: 'addCity'; tripId: string; cityId: string }
  | { type: 'deleteCity'; tripId: string; cityId: string }
  | { type: 'updateCity'; tripId: string; cityId: string; name: string }
  | { type: 'setAccommodation'; tripId: string; dayId: string; text: string | undefined }
  // Destination (parent) ops
  | { type: 'addDestination'; tripId: string; dayId: string; detail: Detail; index?: number }
  | { type: 'reorderDestinations'; tripId: string; dayId: string; from: number; to: number }
  | { type: 'moveDestination'; tripId: string; fromDayId: string; toDayId: string; fromIndex: number; toIndex: number }
  | { type: 'toggleCollapse'; tripId: string; dayId: string; detailId: string }
  // Child ops (parentId = the destination they belong to)
  | { type: 'addChild'; tripId: string; dayId: string; parentId: string; detail: Detail; index?: number }
  | { type: 'reorderChildren'; tripId: string; dayId: string; parentId: string; from: number; to: number }
  // Move a child detail into any destination (same or different day), before `overDetailId` (or to the end).
  | {
      type: 'moveDetail'
      tripId: string
      fromDayId: string
      fromDestId: string
      toDayId: string
      toDestId: string
      detailId: string
      overDetailId?: string
    }
  // Works on a destination (parentId omitted) or a child (parentId set)
  | { type: 'updateDetail'; tripId: string; dayId: string; parentId?: string; detailId: string; patch: Partial<Detail> }
  | { type: 'deleteDetail'; tripId: string; dayId: string; parentId?: string; detailId: string }

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function mapTrip(trips: Trip[], id: string, fn: (t: Trip) => Trip): Trip[] {
  return trips.map((t) => (t.id === id ? fn(t) : t))
}

function mapDay(trip: Trip, dayId: string, fn: (d: Trip['days'][number]) => Trip['days'][number]): Trip {
  return { ...trip, days: trip.days.map((d) => (d.id === dayId ? fn(d) : d)) }
}

function mapDestination(
  day: Trip['days'][number],
  parentId: string,
  fn: (parent: Detail) => Detail,
): Trip['days'][number] {
  return { ...day, details: day.details.map((d) => (d.id === parentId ? fn(d) : d)) }
}

function reducer(state: Trip[], action: Action): Trip[] {
  switch (action.type) {
    case 'addTrip':
      return [action.trip, ...state]
    case 'updateTrip':
      return mapTrip(state, action.id, (t) => ({ ...t, ...action.patch }))
    case 'deleteTrip':
      return state.filter((t) => t.id !== action.id)

    case 'addDay':
      return mapTrip(state, action.tripId, (t) => {
        const day = { id: uid(), cityId: action.cityId, details: [] }
        const days = t.days.slice()
        let last = -1
        days.forEach((d, i) => {
          if ((d.cityId ?? 'main') === action.cityId) last = i
        })
        if (last === -1) days.push(day)
        else days.splice(last + 1, 0, day)
        return { ...t, days }
      })
    case 'moveDay':
      return mapTrip(state, action.tripId, (t) => {
        const days = t.days.slice()
        const from = days.findIndex((d) => d.id === action.activeId)
        if (from < 0) return t
        const [day] = days.splice(from, 1)
        if (action.overId) {
          const overIdx = days.findIndex((d) => d.id === action.overId)
          if (overIdx >= 0) day.cityId = days[overIdx].cityId ?? 'main'
          days.splice(overIdx < 0 ? days.length : overIdx, 0, day)
        } else if (action.toCityId) {
          day.cityId = action.toCityId
          let last = -1
          days.forEach((d, i) => {
            if ((d.cityId ?? 'main') === action.toCityId) last = i
          })
          if (last === -1) days.push(day)
          else days.splice(last + 1, 0, day)
        } else {
          days.splice(from, 0, day)
        }
        return { ...t, days }
      })
    case 'addCity': {
      const cid = action.cityId
      return mapTrip(state, action.tripId, (t) => ({
        ...t,
        cities: [...(t.cities ?? []), { id: cid, name: '', country: undefined }],
        days: [...t.days, { id: uid(), cityId: cid, details: [] }],
      }))
    }
    case 'deleteCity':
      return mapTrip(state, action.tripId, (t) => ({
        ...t,
        cities: (t.cities ?? []).filter((c) => c.id !== action.cityId),
        days: t.days.filter((d) => d.cityId !== action.cityId),
      }))
    case 'updateCity':
      return mapTrip(state, action.tripId, (t) => ({
        ...t,
        cities: (t.cities ?? []).map((c) =>
          c.id === action.cityId ? { ...c, name: action.name, country: lookupCountry(action.name) } : c,
        ),
      }))
    case 'deleteDay':
      return mapTrip(state, action.tripId, (t) => ({
        ...t,
        days: t.days.filter((d) => d.id !== action.dayId),
      }))
    case 'reorderDays':
      return mapTrip(state, action.tripId, (t) => ({ ...t, days: move(t.days, action.from, action.to) }))
    case 'setAccommodation':
      return mapTrip(state, action.tripId, (t) =>
        mapDay(t, action.dayId, (d) => ({ ...d, accommodation: action.text })),
      )

    case 'addDestination':
      return mapTrip(state, action.tripId, (t) =>
        mapDay(t, action.dayId, (d) => {
          const details = d.details.slice()
          details.splice(action.index ?? details.length, 0, action.detail)
          return { ...d, details }
        }),
      )
    case 'reorderDestinations':
      return mapTrip(state, action.tripId, (t) =>
        mapDay(t, action.dayId, (d) => ({ ...d, details: move(d.details, action.from, action.to) })),
      )
    case 'moveDestination':
      return mapTrip(state, action.tripId, (t) => {
        const fromDay = t.days.find((d) => d.id === action.fromDayId)
        const dest = fromDay?.details[action.fromIndex]
        if (!dest) return t
        return {
          ...t,
          days: t.days.map((d) => {
            if (action.fromDayId === action.toDayId && d.id === action.fromDayId) {
              const arr = d.details.slice()
              arr.splice(action.fromIndex, 1)
              arr.splice(action.toIndex, 0, dest)
              return { ...d, details: arr }
            }
            if (d.id === action.fromDayId) {
              const arr = d.details.slice()
              arr.splice(action.fromIndex, 1)
              return { ...d, details: arr }
            }
            if (d.id === action.toDayId) {
              const arr = d.details.slice()
              arr.splice(action.toIndex, 0, dest)
              return { ...d, details: arr }
            }
            return d
          }),
        }
      })
    case 'toggleCollapse':
      return mapTrip(state, action.tripId, (t) =>
        mapDay(t, action.dayId, (d) => ({
          ...d,
          details: d.details.map((x) =>
            x.id === action.detailId ? { ...x, collapsed: !x.collapsed } : x,
          ),
        })),
      )

    case 'addChild':
      return mapTrip(state, action.tripId, (t) =>
        mapDay(t, action.dayId, (d) =>
          mapDestination(d, action.parentId, (parent) => {
            const children = (parent.children ?? []).slice()
            children.splice(action.index ?? children.length, 0, action.detail)
            return { ...parent, children, collapsed: false }
          }),
        ),
      )
    case 'reorderChildren':
      return mapTrip(state, action.tripId, (t) =>
        mapDay(t, action.dayId, (d) =>
          mapDestination(d, action.parentId, (parent) => ({
            ...parent,
            children: move(parent.children ?? [], action.from, action.to),
          })),
        ),
      )

    case 'moveDetail': {
      const { fromDayId, fromDestId, toDayId, toDestId, detailId, overDetailId } = action
      return mapTrip(state, action.tripId, (t) => {
        let moved: Detail | undefined
        // Remove the detail from its source destination.
        let days = t.days.map((d) =>
          d.id !== fromDayId
            ? d
            : {
                ...d,
                details: d.details.map((dest) => {
                  if (dest.id !== fromDestId) return dest
                  const kids = dest.children ?? []
                  moved = kids.find((c) => c.id === detailId)
                  return { ...dest, children: kids.filter((c) => c.id !== detailId) }
                }),
              },
        )
        if (!moved) return t
        const movedDetail = moved
        // Insert into the target destination, before overDetailId (or at the end).
        days = days.map((d) =>
          d.id !== toDayId
            ? d
            : {
                ...d,
                details: d.details.map((dest) => {
                  if (dest.id !== toDestId) return dest
                  const kids = [...(dest.children ?? [])]
                  const at = overDetailId ? kids.findIndex((c) => c.id === overDetailId) : -1
                  if (at === -1) kids.push(movedDetail)
                  else kids.splice(at, 0, movedDetail)
                  return { ...dest, children: kids, collapsed: false }
                }),
              },
        )
        return { ...t, days }
      })
    }

    case 'updateDetail':
      return mapTrip(state, action.tripId, (t) =>
        mapDay(t, action.dayId, (d) => {
          if (action.parentId) {
            return mapDestination(d, action.parentId, (parent) => ({
              ...parent,
              children: (parent.children ?? []).map((c) =>
                c.id === action.detailId ? { ...c, ...action.patch } : c,
              ),
            }))
          }
          return {
            ...d,
            details: d.details.map((x) => (x.id === action.detailId ? { ...x, ...action.patch } : x)),
          }
        }),
      )
    case 'deleteDetail':
      return mapTrip(state, action.tripId, (t) =>
        mapDay(t, action.dayId, (d) => {
          if (action.parentId) {
            return mapDestination(d, action.parentId, (parent) => ({
              ...parent,
              children: (parent.children ?? []).filter((c) => c.id !== action.detailId),
            }))
          }
          return { ...d, details: d.details.filter((x) => x.id !== action.detailId) }
        }),
      )

    default:
      return state
  }
}

function load(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrateTrips(JSON.parse(raw) as Trip[])
  } catch {
    /* ignore */
  }
  // Fresh visitors start with a blank app to plan their own trips.
  return []
}

const FOLDERS_KEY = 'travel-planner:folders:v1'
function loadFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY)
    if (raw) return JSON.parse(raw) as Folder[]
  } catch {
    /* ignore */
  }
  return []
}

interface StoreValue {
  trips: Trip[]
  dispatch: React.Dispatch<Action>
  folders: Folder[]
  addFolder: () => void
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  setFolderOrder: (id: string, order: string[] | undefined) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [trips, dispatch] = useReducer(reducer, undefined, load)
  const [folders, setFolders] = useState<Folder[]>(loadFolders)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
    } catch {
      /* ignore */
    }
  }, [trips])

  useEffect(() => {
    try {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders))
    } catch {
      /* ignore */
    }
  }, [folders])

  const addFolder = () => setFolders((f) => [...f, { id: uid(), name: '' }])
  const renameFolder = (id: string, name: string) =>
    setFolders((f) => f.map((x) => (x.id === id ? { ...x, name } : x)))
  const deleteFolder = (id: string) => {
    setFolders((f) => f.filter((x) => x.id !== id))
    trips
      .filter((t) => t.folderId === id)
      .forEach((t) => dispatch({ type: 'updateTrip', id: t.id, patch: { folderId: undefined } }))
  }
  const setFolderOrder = (id: string, order: string[] | undefined) =>
    setFolders((f) => f.map((x) => (x.id === id ? { ...x, order } : x)))

  return (
    <StoreContext.Provider
      value={{ trips, dispatch, folders, addFolder, renameFolder, deleteFolder, setFolderOrder }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function useTrip(id: string | null): Trip | undefined {
  const { trips } = useStore()
  return trips.find((t) => t.id === id)
}
