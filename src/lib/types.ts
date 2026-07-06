export type DetailType =
  | 'destination'
  | 'accommodation'
  | 'time'
  | 'transportation'
  | 'money'
  | 'doc'
  | 'note'

export type TripStatus = 'planning' | 'intrip' | 'done'

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY'

export interface Detail {
  id: string
  type: DetailType
  /** Primary editable text. For Note this is markdown. */
  text: string
  /** Destination geo — powers the Map view. */
  lat?: number
  lon?: number
  /** Only Destination details (parents) carry children + collapse state. */
  children?: Detail[]
  collapsed?: boolean
  /** Transportation: chosen mode + departure/arrival cities and times. */
  mode?: string
  location?: string
  time?: string
  fromCity?: string
  toCity?: string
  depTime?: string
  arrTime?: string
  /** Transportation by car/walk/bike: trip duration in minutes. */
  durationMin?: string
  /** Destination: chosen leading icon name (defaults to the pin). */
  icon?: string
  /** Document ('doc' detail): uploaded PDF/JPG as a data URL, filename kept in `text`. */
  fileData?: string
}

export interface Day {
  id: string
  /** Top-level details are Destinations (parents); other types nest as children. */
  details: Detail[]
  /** Where you're staying that night (added from the day header). */
  accommodation?: string
  /** Which city section this day belongs to. Undefined / 'main' = the primary city. */
  cityId?: string
}

/** An extra city section within a multi-city trip. */
export interface City {
  id: string
  name: string
  country?: string
}

/** A folder groups trips together on the Home page. */
export interface Folder {
  id: string
  name: string
  /** Manual trip order (trip ids). When absent, trips auto-sort by start date. */
  order?: string[]
}

export interface Trip {
  id: string
  title: string
  description: string
  /** ISO yyyy-mm-dd — the single source of truth for all day dates. */
  startDate: string
  budget: string
  currency?: CurrencyCode
  people: string
  /** Solo trip — when true, the People field reads "Solo trip". */
  solo?: boolean
  status: TripStatus
  /** Auto-generated from the trip title (primary city). */
  country?: string
  /** Additional city sections beyond the primary one. */
  cities?: City[]
  /** The folder this trip belongs to, if any. */
  folderId?: string
  days: Day[]
}
