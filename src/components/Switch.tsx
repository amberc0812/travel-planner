import { Icon, type IconName } from './Icon'

interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
  ariaLabel: string
  /** Optional icon shown in the sliding knob for the on / off states. */
  knobIcon?: { on: IconName; off: IconName }
}

export function Switch({ checked, onChange, ariaLabel, knobIcon }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`focusable relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill border border-hairline transition-colors duration-200 ease-calm ${
        checked ? 'bg-ink' : 'bg-canvas'
      }`}
    >
      <span
        className={`absolute flex h-5 w-5 items-center justify-center rounded-pill bg-surface transition-transform duration-200 ease-calm ${
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        }`}
        style={{ boxShadow: '0 1px 3px rgba(2,16,52,0.25)' }}
      >
        {knobIcon && <Icon name={checked ? knobIcon.on : knobIcon.off} size={12} className="text-ink-60" />}
      </span>
    </button>
  )
}
