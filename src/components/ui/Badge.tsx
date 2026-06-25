import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Pre-composed Tailwind color classes (bg/text/ring). */
  tone?: string
  dot?: string
  children: ReactNode
}

/**
 * Generic pill badge. Pass `tone` with bg/text/ring classes from the
 * status meta maps (see lib/constants.ts) for consistent styling.
 */
export function Badge({ tone, dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        tone ?? 'bg-slate-100 text-slate-600 ring-slate-500/15',
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children}
    </span>
  )
}
