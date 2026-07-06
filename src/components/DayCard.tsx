import { type ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Day } from '../lib/types'
import { useStore, newDetail } from '../lib/store'
import { SortableDestination } from './SortableDestination'
import { EditableText } from './EditableText'
import { Icon } from './Icon'

interface DayCardProps {
  tripId: string
  day: Day
  index: number
  dateLabel: string
  canDelete: boolean
  dragHandle?: ReactNode
}

export function DayCard({ tripId, day, index, dateLabel, canDelete, dragHandle }: DayCardProps) {
  const { dispatch } = useStore()
  const dayId = day.id
  const { setNodeRef, isOver } = useDroppable({ id: `drop:${dayId}`, data: { type: 'day-drop', dayId } })

  return (
    <section className="group/day rounded-card bg-dusty-blue p-5">
      <header className="mb-3 flex items-center gap-3 px-1">
        {dragHandle}
        <h3 className="font-display text-[20px] leading-none text-ink">Day {index + 1}</h3>
        <span className="text-caption text-ink-60">{dateLabel}</span>

        {day.accommodation === undefined ? (
          <button
            type="button"
            onClick={() => dispatch({ type: 'setAccommodation', tripId, dayId, text: '' })}
            title="Add accommodation"
            aria-label="Add accommodation"
            className="focusable inline-flex items-center gap-0.5 rounded-button px-1.5 py-0.5 text-ink-60 transition-colors hover:text-ink"
          >
            <Icon name="accommodation" size={14} />
            <Icon name="plus" size={10} />
          </button>
        ) : (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-caption text-ink-60">
            <Icon name="accommodation" size={14} className="shrink-0" />
            <EditableText
              value={day.accommodation}
              onChange={(v) => dispatch({ type: 'setAccommodation', tripId, dayId, text: v })}
              placeholder="Where you're staying"
              ariaLabel="Accommodation"
              className="text-ink"
            />
            <button
              type="button"
              onClick={() => dispatch({ type: 'setAccommodation', tripId, dayId, text: undefined })}
              aria-label="Remove accommodation"
              className="shrink-0 rounded p-0.5 text-ink-40 hover:text-terracotta"
            >
              <Icon name="close" size={11} />
            </button>
          </span>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'deleteDay', tripId, dayId })}
            aria-label={`Delete day ${index + 1}`}
            className="ml-auto rounded p-1 text-ink/40 opacity-0 transition-opacity hover:text-terracotta focus-visible:opacity-100 group-hover/day:opacity-100"
          >
            <Icon name="trash" size={16} />
          </button>
        )}
      </header>

      <SortableContext items={day.details.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-[12px] flex-col gap-3 rounded-button transition-colors ${
            isOver ? 'bg-white/25' : ''
          }`}
        >
          {day.details.map((dest) => (
            <SortableDestination
              key={dest.id}
              dayId={dayId}
              destination={dest}
              onUpdateDest={(patch) =>
                dispatch({ type: 'updateDetail', tripId, dayId, detailId: dest.id, patch })
              }
              onToggle={() => dispatch({ type: 'toggleCollapse', tripId, dayId, detailId: dest.id })}
              onDelete={() => dispatch({ type: 'deleteDetail', tripId, dayId, detailId: dest.id })}
              onAddChild={(type, childIndex) =>
                dispatch({
                  type: 'addChild',
                  tripId,
                  dayId,
                  parentId: dest.id,
                  detail: newDetail(type),
                  index: childIndex,
                })
              }
              onUpdateChild={(childId, patch) =>
                dispatch({ type: 'updateDetail', tripId, dayId, parentId: dest.id, detailId: childId, patch })
              }
              onDeleteChild={(childId) =>
                dispatch({ type: 'deleteDetail', tripId, dayId, parentId: dest.id, detailId: childId })
              }
            />
          ))}
          {day.details.length === 0 && (
            <p className="py-2 text-center text-caption italic text-ink/45">
              Drop a destination here, or add one below
            </p>
          )}
        </div>
      </SortableContext>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={() =>
            dispatch({ type: 'addDestination', tripId, dayId, detail: newDetail('destination') })
          }
          className="focusable rounded-button px-3 py-1.5 text-caption italic text-ink-60 transition-colors hover:text-ink"
        >
          + Add a destination
        </button>
      </div>
    </section>
  )
}
