import type { DetailType } from './types'
import type { IconName } from '../components/Icon'

export interface DetailTypeMeta {
  type: DetailType
  label: string
  icon: IconName
  placeholder: string
}

/** The insertable detail types (People is a trip-level meta field, not a detail). */
export const DETAIL_TYPES: DetailTypeMeta[] = [
  { type: 'destination', label: 'Destination', icon: 'destination', placeholder: 'Add a place' },
  { type: 'accommodation', label: 'Accommodation', icon: 'accommodation', placeholder: 'Add a stay' },
  { type: 'time', label: 'Time', icon: 'time', placeholder: 'Set a time' },
  { type: 'transportation', label: 'Transportation', icon: 'transportation', placeholder: 'Add transport' },
  { type: 'money', label: 'Cost', icon: 'money', placeholder: 'Add a cost' },
  { type: 'doc', label: 'Document', icon: 'doc', placeholder: 'Upload a PDF or JPG' },
  { type: 'note', label: 'Note', icon: 'note', placeholder: 'Write a note…' },
]

export const DETAIL_META = Object.fromEntries(
  DETAIL_TYPES.map((d) => [d.type, d]),
) as Record<DetailType, DetailTypeMeta>

/** Types that nest under a Destination. Destination is the parent; Accommodation is day-level. */
export const CHILD_DETAIL_TYPES: DetailTypeMeta[] = DETAIL_TYPES.filter(
  (d) => d.type !== 'destination' && d.type !== 'accommodation' && d.type !== 'time',
)
