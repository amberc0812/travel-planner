import type { TripStatus } from '../lib/types'
import { statusMeta } from '../lib/status'

export function Chip({ status }: { status: TripStatus }) {
  const m = statusMeta(status)
  return (
    <span
      className="inline-flex items-center justify-center rounded-pill px-3 py-1 text-caption font-medium"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  )
}
