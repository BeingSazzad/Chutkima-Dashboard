import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  'aria-label'?: string
}

const dims = {
  sm: { track: 'h-5 w-9', knob: 'h-3.5 w-3.5', on: 'translate-x-[18px]', off: 'translate-x-[3px]' },
  md: { track: 'h-6 w-11', knob: 'h-4 w-4', on: 'translate-x-[26px]', off: 'translate-x-[4px]' },
}

/** Accessible on/off toggle with a clearly visible knob. */
export function Switch({ checked, onChange, disabled, size = 'md', ...rest }: SwitchProps) {
  const d = dims[size]
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest['aria-label']}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-ring relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200',
        d.track,
        checked ? 'bg-brand-600' : 'bg-slate-300',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] ring-1 ring-black/5 transition-transform duration-200',
          d.knob,
          checked ? d.on : d.off,
        )}
      />
    </button>
  )
}
