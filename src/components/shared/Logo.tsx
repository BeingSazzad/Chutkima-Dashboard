import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Official brand assets in /public — used automatically when present:
 *   public/logo.png       → full logo (mark + "chutkima" wordmark)
 *   public/logo-mark.png  → just the mark (used when iconOnly)
 * Transparent background. On dark surfaces the file is auto-whitened.
 * If the file is missing, the inline fallback below is shown instead.
 */
const LOGO_SRC = '/logo.png'
const MARK_SRC = '/logo-mark.png'

interface LogoProps {
  /** Show only the mark, no wordmark. */
  iconOnly?: boolean
  className?: string
  onDark?: boolean
}

/** Chutkima crossed-fingers brand mark — inline fallback when no file is present. */
function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="currentColor" aria-hidden>
      <circle cx="10.5" cy="11" r="3.8" />
      <rect x="15.6" y="3" width="8.4" height="31" rx="4.2" transform="rotate(-16 20 30)" />
      <rect x="16" y="4" width="8.4" height="31" rx="4.2" transform="rotate(15 20 30)" />
    </svg>
  )
}

/** Chutkima logo — uses the official file from /public when present, else the inline mark. */
export function Logo({ iconOnly, className, onDark }: LogoProps) {
  const [hasFile, setHasFile] = useState(false)

  return (
    <div className={cn('flex items-center gap-2.5', onDark ? 'text-white' : 'text-brand-700', className)}>
      {/* Official asset — hidden until it loads, so a missing file never flashes a broken icon */}
      <img
        src={iconOnly ? MARK_SRC : LOGO_SRC}
        alt="Chutkima"
        onLoad={() => setHasFile(true)}
        className={cn(
          hasFile ? 'block' : 'hidden',
          iconOnly ? 'h-11 w-11' : 'h-11 w-auto',
          onDark && 'brightness-0 invert',
        )}
      />

      {/* Inline fallback (mark + wordmark) */}
      {!hasFile && <Mark className="h-11 w-11 shrink-0" />}
      {!hasFile && !iconOnly && (
        <span className="text-2xl font-extrabold lowercase leading-none tracking-tight">chutkima</span>
      )}
    </div>
  )
}
