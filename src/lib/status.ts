import type { TripStatus } from './types'

interface StatusMeta {
  label: string
  /** chip background + foreground */
  bg: string
  fg: string
  /** map dot color */
  dot: string
}

export const STATUS_META: Record<TripStatus, StatusMeta> = {
  planning: { label: 'Planning', bg: 'var(--chip-planning-bg)', fg: 'var(--chip-planning-fg)', dot: '#adc4cb' },
  intrip: { label: 'In trip', bg: 'var(--chip-intrip-bg)', fg: 'var(--chip-intrip-fg)', dot: '#8b302f' },
  done: { label: 'Completed', bg: '#021034', fg: '#ece7db', dot: '#021034' },
}

export const STATUS_ORDER: TripStatus[] = ['planning', 'intrip', 'done']

/** Safe lookup that tolerates legacy/removed statuses (e.g. the old "review"). */
export function statusMeta(status: TripStatus): StatusMeta {
  return STATUS_META[status] ?? STATUS_META.planning
}
