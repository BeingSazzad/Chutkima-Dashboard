import { useEffect, useRef, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Order } from '@/types/common.types'

/** Customer cancellation window before a pending order is auto-confirmed. */
const WINDOW_SECS = 10
/** Only genuinely fresh orders auto-confirm on screen; older pending orders keep a manual button. */
const FRESH_SECS = 120

/**
 * Pending order: shows the 15-second cancellation countdown the customer sees,
 * and auto-confirms the order when it elapses (mock of the backend auto-confirm).
 * Admin can always confirm now to override.
 */
export function PendingConfirm({ order, confirm, confirming }: { order: Order; confirm: () => void; confirming: boolean }) {
  const placed = Date.parse(order.placedAt)
  const [now, setNow] = useState(() => Date.now())
  const fired = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const elapsed = (now - placed) / 1000
  const remaining = Math.max(0, Math.ceil(WINDOW_SECS - elapsed))
  const fresh = elapsed < FRESH_SECS
  const withinWindow = remaining > 0
  // Don't auto-confirm an order that's on hold or pre-booked for a future slot.
  const onHold = order.holdUntil != null && Date.parse(order.holdUntil) > now
  const scheduledFuture = order.scheduledFor != null && Date.parse(order.scheduledFor) > now
  const deferred = onHold || scheduledFuture

  useEffect(() => {
    if (fresh && !withinWindow && !deferred && !fired.current && order.status === 'pending') {
      fired.current = true
      confirm()
    }
  }, [fresh, withinWindow, deferred, order.status, confirm])

  // On hold / scheduled → processing is paused; surface that instead of a countdown.
  if (deferred) {
    return (
      <div className="rounded-xl bg-slate-50 px-3 py-3">
        <p className="text-sm font-medium text-slate-600">
          {onHold ? 'On hold — auto-confirm paused until the hold is released.' : 'Scheduled order — held until its delivery slot.'}
        </p>
        <Button className="mt-2" size="sm" variant="outline" loading={confirming} onClick={confirm}>
          Confirm now anyway
        </Button>
      </div>
    )
  }

  if (fresh && withinWindow) {
    return (
      <div className="rounded-xl bg-amber-50 px-3 py-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
          <ShieldAlert className="h-4 w-4" /> Cancellation window — the customer can still cancel.
        </p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums text-amber-700">{remaining}s</p>
        <p className="text-xs text-amber-600">Auto-confirms when the timer ends — dispatches to packer &amp; rider.</p>
        <Button className="mt-2" size="sm" variant="outline" loading={confirming} onClick={confirm}>
          Confirm now
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-blue-50 px-3 py-3">
      <p className="text-sm font-medium text-blue-700">New order — confirm to dispatch to packer &amp; rider.</p>
      <Button className="mt-2" loading={confirming} onClick={confirm}>
        Confirm order
      </Button>
      <p className="mt-1.5 text-xs text-blue-600">Orders auto-confirm {WINDOW_SECS}s after placement (the customer’s cancellation window).</p>
    </div>
  )
}
