import { Check, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACTOR_META, ORDER_JOURNEY, ORDER_STAGE_ACTOR, ORDER_STATUS_META } from '@/lib/constants'
import { stageTiming } from '@/lib/orderTiming'
import type { Order, OrderStatus } from '@/types/common.types'

const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

/** Vertical stepper mirroring the customer app's "Order Journey". */
export function OrderJourney({
  status,
  timestamps = {},
  order,
}: {
  status: OrderStatus
  timestamps?: Partial<Record<OrderStatus, string>>
  /** When provided, each reached stage shows an on-time / delayed chip. */
  order?: Order
}) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        <XCircle className="h-4 w-4 shrink-0" /> This order was cancelled.
      </div>
    )
  }

  const total = ORDER_JOURNEY.length
  const currentIndex = ORDER_JOURNEY.indexOf(status)
  const isDelivered = status === 'delivered'
  // Progress along the track: 0% at "placed", 100% at "delivered".
  const pct = Math.round((currentIndex / (total - 1)) * 100)

  return (
    <div className="space-y-4">
      {/* Progress summary — quick read of where the order is right now. */}
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">{ORDER_STATUS_META[status].label}</span>
          <span className="text-slate-400">{isDelivered ? 'Completed' : `Step ${currentIndex + 1} of ${total}`}</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ol className="relative space-y-1">
        {ORDER_JOURNEY.map((step, i) => {
          const done = i < currentIndex || (isDelivered && i === currentIndex)
          const active = i === currentIndex && !isDelivered
          const isNext = i === currentIndex + 1 && !isDelivered
          const meta = ORDER_STATUS_META[step]
          const t = order && timestamps[step] ? stageTiming(order, step) : null
          return (
            <li key={step} className="relative flex items-start gap-3">
              {i < total - 1 && (
                <span
                  className={cn(
                    'absolute left-[15px] top-7 h-[calc(100%-12px)] w-0.5',
                    done ? 'bg-brand-500' : 'bg-slate-200',
                  )}
                />
              )}
              <span
                className={cn(
                  'relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white transition-colors',
                  done ? 'bg-brand-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  <span className="flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>

              <div className={cn('min-w-0 flex-1 rounded-xl px-3 py-2 transition-colors', active && 'bg-brand-50')}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn('text-sm font-semibold', done || active ? 'text-slate-800' : 'text-slate-400')}>
                    {meta.label}
                  </p>
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset', ACTOR_META[ORDER_STAGE_ACTOR[step]].badge)}>
                    {ACTOR_META[ORDER_STAGE_ACTOR[step]].label}
                  </span>
                  {active && (
                    <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">In progress</span>
                  )}
                  {isNext && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Up next</span>
                  )}
                  {t && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
                        t.tone === 'green' ? 'bg-green-50 text-green-700 ring-green-600/15' : 'bg-red-50 text-red-700 ring-red-600/15',
                      )}
                    >
                      {t.label}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {timestamps[step] ? fmtTime(timestamps[step]) : active ? 'Happening now…' : 'Pending'}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
