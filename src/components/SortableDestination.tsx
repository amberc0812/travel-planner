import type { CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DestinationGroup } from './DestinationGroup'
import { Icon } from './Icon'
import type { Detail, DetailType } from '../lib/types'

interface SortableDestinationProps {
  destination: Detail
  dayId: string
  onUpdateDest: (patch: Partial<Detail>) => void
  onToggle: () => void
  onDelete: () => void
  onAddChild: (type: DetailType, index: number) => void
  onUpdateChild: (childId: string, patch: Partial<Detail>) => void
  onDeleteChild: (childId: string) => void
}

export function SortableDestination(props: SortableDestinationProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.destination.id, data: { type: 'destination', dayId: props.dayId } })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 20 : undefined,
    position: 'relative',
  }

  const handle = (
    <button
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label="Drag to reorder destination"
      className="shrink-0 cursor-grab touch-none rounded p-0.5 text-ink-40 transition-colors hover:text-ink-60 active:cursor-grabbing"
    >
      <Icon name="grip" size={14} />
    </button>
  )

  return (
    <div ref={setNodeRef} style={style}>
      <DestinationGroup {...props} dragHandle={handle} />
    </div>
  )
}
