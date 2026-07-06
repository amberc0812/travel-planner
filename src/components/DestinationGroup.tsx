import { useState, type ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Detail, DetailType } from '../lib/types'
import { CHILD_DETAIL_TYPES } from '../lib/details'
import { SortableDetail } from './SortableDetail'
import { DetailMenu } from './DetailMenu'
import { EditableText } from './EditableText'
import { Icon, type IconName } from './Icon'

type InsertAt = number | 'end' | null

/** Selectable leading icons for a destination. */
const DEST_ICONS: IconName[] = ['destination', 'restaurant', 'nature', 'hotel']

interface DestinationGroupProps {
  destination: Detail
  dayId: string
  onUpdateDest: (patch: Partial<Detail>) => void
  onToggle: () => void
  onDelete: () => void
  onAddChild: (type: DetailType, index: number) => void
  onUpdateChild: (childId: string, patch: Partial<Detail>) => void
  onDeleteChild: (childId: string) => void
  dragHandle?: ReactNode
}

export function DestinationGroup({
  destination,
  dayId,
  onUpdateDest,
  onToggle,
  onDelete,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
  dragHandle,
}: DestinationGroupProps) {
  const destId = destination.id
  const children = destination.children ?? []
  const collapsed = !!destination.collapsed
  const [openAt, setOpenAt] = useState<InsertAt>(null)
  const [iconOpen, setIconOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(!!destination.time)
  const currentIcon = (DEST_ICONS.includes(destination.icon as IconName) ? destination.icon : 'destination') as IconName
  // A drop target so a detail can be dragged into this destination (even when empty).
  const { setNodeRef: dropRef, isOver } = useDroppable({
    id: `destdrop:${destId}`,
    data: { type: 'dest-drop', dayId, destId },
  })

  function add(type: DetailType) {
    const at = openAt === 'end' ? children.length : (openAt as number)
    onAddChild(type, at)
    setOpenAt(null)
  }

  return (
    <div className="group/dgroup">
      {/* Destination header (parent) */}
      <div className="group/dest flex items-center gap-2 rounded-button border border-hairline bg-surface px-3 py-2.5">
        {dragHandle}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand destination' : 'Collapse destination'}
          aria-expanded={!collapsed}
          className="focusable shrink-0 rounded p-0.5 text-ink-45 transition-colors hover:text-ink"
        >
          <Icon name="chevron-right" size={16} className={collapsed ? '' : 'rotate-90'} />
        </button>

        {/* Icon picker — frameless glyph in the main color */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIconOpen((o) => !o)}
            aria-label="Choose destination icon"
            title="Choose an icon"
            className="focusable flex h-6 w-6 items-center justify-center text-dusty-blue transition-colors hover:text-ink"
          >
            <Icon name={currentIcon} size={16} />
          </button>
          {iconOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 flex gap-1 rounded-card border border-hairline bg-surface p-1.5 shadow-pop">
              {DEST_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => {
                    onUpdateDest({ icon: ic })
                    setIconOpen(false)
                  }}
                  aria-label={`Use ${ic} icon`}
                  className={`flex h-8 w-8 items-center justify-center rounded-badge transition-colors ${
                    currentIcon === ic ? 'bg-canvas text-dusty-blue' : 'text-ink-45 hover:bg-canvas'
                  }`}
                >
                  <Icon name={ic} size={16} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Place name; the clock appears right after it once a place is entered */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <EditableText
            value={destination.text}
            onChange={(v) => onUpdateDest({ text: v })}
            placeholder="Add a place"
            ariaLabel="Destination"
            className="min-w-0 max-w-full truncate text-body font-medium text-ink"
          />
          {destination.text.trim() !== '' && (
            <span className="inline-flex shrink-0 items-center gap-1 text-caption text-ink-60">
              <button
                type="button"
                onClick={() => setTimeOpen((o) => !o)}
                aria-label={timeOpen ? 'Hide time' : 'Add time'}
                title={timeOpen ? 'Hide time' : 'Add a time'}
                className="focusable flex h-6 w-6 items-center justify-center text-dusty-blue transition-colors hover:text-ink"
              >
                <Icon name="time" size={15} />
              </button>
              {timeOpen && (
                <input
                  type="time"
                  value={destination.time ?? ''}
                  onChange={(e) => onUpdateDest({ time: e.target.value })}
                  aria-label="Destination time"
                  className="focusable bg-transparent text-ink"
                />
              )}
            </span>
          )}
        </div>

        {/* Right controls — add-detail (when empty) + delete, always visible */}
        <div className="flex shrink-0 items-center gap-2">
          {collapsed && children.length > 0 && (
            <span className="text-caption text-ink-45">
              {children.length} {children.length === 1 ? 'detail' : 'details'}
            </span>
          )}
          {children.length === 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenAt('end')}
                aria-label="Add a detail"
                title="Add a detail"
                className="focusable flex h-6 w-6 items-center justify-center text-ink-40 transition-colors hover:text-ink"
              >
                <Icon name="plus" size={15} />
              </button>
              {openAt === 'end' && (
                <div className="absolute right-0 top-full z-30 mt-1.5">
                  <DetailMenu items={CHILD_DETAIL_TYPES} onPick={add} onClose={() => setOpenAt(null)} />
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete destination"
            className="focusable flex h-6 w-6 items-center justify-center text-ink-40 transition-colors hover:text-terracotta"
          >
            <Icon name="trash" size={15} />
          </button>
        </div>
      </div>

      {/* Children (collapsible) — a drop zone for details from any destination */}
      {!collapsed && children.length > 0 && (
        <div
          ref={dropRef}
          className={`ml-[18px] mt-2 min-h-[28px] rounded-button pl-4 transition-colors ${
            isOver ? 'bg-[rgba(2,16,52,0.05)]' : ''
          }`}
        >
          <SortableContext items={children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {children.map((child, i) => (
                <div key={child.id} className="group/ins relative">
                  <SortableDetail
                    detail={child}
                    dayId={dayId}
                    destId={destId}
                    onPatch={(patch) => onUpdateChild(child.id, patch)}
                    onDelete={() => onDeleteChild(child.id)}
                  />
                  <button
                    type="button"
                    aria-label="Add a detail here"
                    onClick={() => setOpenAt(i + 1)}
                    className="absolute -bottom-[7px] left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-pill bg-surface text-ink-45 opacity-0 shadow-sm transition-opacity hover:text-ink group-hover/ins:opacity-100"
                  >
                    <Icon name="plus" size={13} />
                  </button>
                  {openAt === i + 1 && (
                    <div className="absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2">
                      <DetailMenu items={CHILD_DETAIL_TYPES} onPick={add} onClose={() => setOpenAt(null)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </div>
      )}
    </div>
  )
}
