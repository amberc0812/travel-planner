import type { CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DayCard } from './DayCard'
import { Icon } from './Icon'
import type { Day } from '../lib/types'

interface SortableDayProps {
  tripId: string
  day: Day
  index: number
  dateLabel: string
  canDelete: boolean
}

export function SortableDay(props: SortableDayProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.day.id, data: { type: 'day' } })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 30 : undefined,
    position: 'relative',
  }

  const handle = (
    <button
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Drag to reorder day ${props.index + 1}`}
      className="cursor-grab touch-none rounded p-0.5 text-ink/40 transition-colors hover:text-ink/70 active:cursor-grabbing"
    >
      <Icon name="grip" size={16} />
    </button>
  )

  return (
    <div ref={setNodeRef} style={style}>
      <DayCard {...props} dragHandle={handle} />
    </div>
  )
}
