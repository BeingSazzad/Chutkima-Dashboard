import { ChevronDown } from 'lucide-react'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { ORDER_JOURNEY, ORDER_STATUS_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types/common.types'

/** Statuses the admin can pick inline: the full live journey + a cancel option. */
const SELECTABLE: OrderStatus[] = [...ORDER_JOURNEY, 'cancelled']

interface OrderStatusSelectProps {
  status: OrderStatus
  /** Disables the control while a change for this row is in flight. */
  loading?: boolean
  onChange: (status: OrderStatus) => void
}

/**
 * Inline, status-coloured dropdown for changing an order's status straight from
 * the Orders table — no need to open the detail page. Terminal states
 * (delivered / cancelled) render as a read-only badge.
 */
export function OrderStatusSelect({ status, loading, onChange }: OrderStatusSelectProps) {
  if (status === 'delivered' || status === 'cancelled') {
    return <OrderStatusBadge status={status} />
  }

  const meta = ORDER_STATUS_META[status]

  return (
    // Stop clicks from bubbling to the row (which navigates to the detail page).
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <select
        aria-label="Change order status"
        value={status}
        disabled={loading}
        onChange={(e) => {
          const next = e.target.value as OrderStatus
          if (next !== status) onChange(next)
        }}
        className={cn(
          'focus-ring cursor-pointer appearance-none rounded-full py-1 pl-3 pr-7 text-xs font-semibold ring-1 ring-inset transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-50',
          meta.badge,
        )}
      >
        {SELECTABLE.map((s) => (
          <option key={s} value={s} className="bg-white font-medium text-slate-700">
            {ORDER_STATUS_META[s].label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-70" />
    </div>
  )
}
