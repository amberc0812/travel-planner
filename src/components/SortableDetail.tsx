import type { CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DetailRow } from './DetailRow'
import { Icon } from './Icon'
import type { Detail } from '../lib/types'

interface SortableDetailProps {
  detail: Detail
  dayId: string
  destId: string
  onPatch: (patch: Partial<Detail>) => void
  onDelete: () => void
}

export function SortableDetail({ detail, dayId, destId, onPatch, onDelete }: SortableDetailProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: detail.id, data: { type: 'detail', dayId, destId } })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : undefined,
    position: 'relative',
  }

  const handle = (
    <button
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label="Drag to reorder detail"
      className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-ink-40 opacity-0 transition-opacity hover:text-ink-60 focus-visible:opacity-100 group-hover/detail:opacity-100 active:cursor-grabbing"
    >
      <Icon name="grip" size={14} />
    </button>
  )

  return (
    <div ref={setNodeRef} style={style}>
      <DetailRow detail={detail} onPatch={onPatch} onDelete={onDelete} dragHandle={handle} />
    </div>
  )
}
