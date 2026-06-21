import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants'

interface LogoProps {
  /** Hide the wordmark, show only the leaf mark. */
  iconOnly?: boolean
  className?: string
  onDark?: boolean
}

/** Chutkima brand mark (leaf/sprout) + wordmark. */
export function Logo({ iconOnly, className, onDark }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          onDark ? 'bg-white/15' : 'bg-brand-600',
        )}
      >
        <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none" aria-hidden>
          <path
            d="M40 16c-2.2 2-4 4.6-5.2 7.6l-3.6 9c-.5 1.2-1.6 2-2.9 2H22c-2.2 0-3.7 2.2-2.9 4.2l3.4 8.4c.9 2.2 3 3.6 5.4 3.6h2.7c3.9 0 7.4-2.4 8.8-6l5.1-13.1c.6-1.6.9-3.3.9-5C45.4 22.6 43.4 18.6 40 16z"
            fill={onDark ? '#ffffff' : '#ffffff'}
          />
          <circle cx="25" cy="20" r="3.4" fill="#ffffff" />
        </svg>
      </div>
      {!iconOnly && (
        <div className="leading-none">
          <span
            className={cn(
              'block text-lg font-extrabold tracking-tight',
              onDark ? 'text-white' : 'text-slate-800',
            )}
          >
            {BRAND.name}
          </span>
          <span
            className={cn(
              'text-[10px] font-semibold uppercase tracking-[0.18em]',
              onDark ? 'text-white/60' : 'text-brand-500',
            )}
          >
            Admin
          </span>
        </div>
      )}
    </div>
  )
}
