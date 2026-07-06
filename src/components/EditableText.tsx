import { useEffect, useRef } from 'react'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  className?: string
  ariaLabel?: string
  /** Focus the field and place the caret at the end on mount. */
  autoFocus?: boolean
}

/**
 * Seamless inline-editable text (contentEditable). Renders as plain text with a
 * placeholder when empty — no input chrome. Commits on every input; only
 * re-syncs the DOM from props when not focused, so the caret never jumps.
 */
export function EditableText({
  value,
  onChange,
  placeholder,
  multiline = false,
  className = '',
  ariaLabel,
  autoFocus = false,
}: EditableTextProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.textContent !== value) {
      el.textContent = value
    }
  }, [value])

  useEffect(() => {
    if (!autoFocus) return
    const el = ref.current
    if (!el) return
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [autoFocus])

  return (
    <div
      ref={ref}
      role="textbox"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-multiline={multiline}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={(e) => onChange((e.currentTarget as HTMLDivElement).textContent ?? '')}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault()
          ;(e.currentTarget as HTMLDivElement).blur()
        }
      }}
      className={`editable ${className}`}
    />
  )
}
