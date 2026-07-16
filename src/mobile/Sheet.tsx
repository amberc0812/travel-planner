import { Icon, type IconName } from '../components/Icon'

export interface SheetOption {
  key: string
  label: string
  icon: IconName
  /** Dimmed + non-tappable — shown for context but not available here. */
  disabled?: boolean
}

interface SheetProps {
  title: string
  options: SheetOption[]
  onPick: (key: string) => void
  onClose: () => void
}

/** Bottom sheet — scrim + slide-up panel, per the mobile design. */
export function Sheet({ title, options, onPick, onClose }: SheetProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 z-50 animate-[tp-scrim-in_200ms] bg-[rgba(2,16,52,0.35)]"
      />
      <div
        role="dialog"
        aria-label={title}
        className="absolute inset-x-0 bottom-0 z-[51] animate-[tp-sheet-up_240ms_cubic-bezier(0.22,1,0.36,1)] rounded-t-[22px] bg-surface px-5 pb-[max(30px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_32px_rgba(2,16,52,0.12)]"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="mx-auto mb-[18px] mt-1 block h-[5px] w-9 rounded-pill bg-hairline"
        />
        <h2 className="mb-4 font-display text-[19px] font-semibold text-ink">{title}</h2>

        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            disabled={opt.disabled}
            onClick={() => onPick(opt.key)}
            className={`flex min-h-[44px] w-full items-center gap-3.5 px-1 py-3.5 text-left ${
              opt.disabled ? 'opacity-55' : ''
            }`}
          >
            <Icon name={opt.icon} size={20} className="shrink-0 text-ink" />
            <span className="text-[16px] text-ink">{opt.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}
