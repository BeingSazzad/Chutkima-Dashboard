import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { cn, openInNewTab } from '@/lib/utils'

type EntityKind = 'customer' | 'driver' | 'order'

const toPath: Record<EntityKind, (id: string) => string> = {
  customer: (id) => ROUTES.customerDetail(id),
  driver: (id) => ROUTES.driverDetail(id),
  order: (id) => ROUTES.orderDetail(id),
}

interface EntityLinkProps {
  kind: EntityKind
  id?: string | null
  children: ReactNode
  className?: string
  /** Open in a new browser tab instead of navigating in place. */
  newTab?: boolean
  title?: string
}

/**
 * Clickable name / id that opens the customer, rider or order profile.
 * Safe inside clickable table rows — it stops click propagation. Falls back to
 * plain text when no id is available.
 */
export function EntityLink({ kind, id, children, className, newTab, title }: EntityLinkProps) {
  const navigate = useNavigate()
  if (!id) return <>{children}</>
  const path = toPath[kind](id)
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        if (newTab) openInNewTab(path)
        else navigate(path)
      }}
      className={cn('focus-ring max-w-full truncate rounded text-left hover:text-brand-600 hover:underline', className)}
    >
      {children}
    </button>
  )
}
