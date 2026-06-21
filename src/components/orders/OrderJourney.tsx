import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACTOR_META, ORDER_JOURNEY, ORDER_STAGE_ACTOR, ORDER_STATUS_META } from '@/lib/constants'
import type { OrderStatus } from '@/types/common.types'

/** Vertical stepper mirroring the customer app's "Order Journey". */
export function OrderJourney({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        This order was cancelled.
      </div>
    )
  }

  const currentIndex = ORDER_JOURNEY.indexOf(status)

  return (
    <ol className="relative space-y-5">
      {ORDER_JOURNEY.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        const meta = ORDER_STATUS_META[step]
        return (
          <li key={step} className="relative flex items-start gap-3">
            {i < ORDER_JOURNEY.length - 1 && (
              <span
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%+4px)] w-0.5',
                  done ? 'bg-brand-500' : 'bg-slate-200',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-white',
                done
                  ? 'bg-brand-500 text-white'
                  : active
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-200 text-slate-400',
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" />
              ) : active ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </span>
            <div className="pt-0.5">
              <div className="flex items-center gap-2">
                <p className={cn('text-sm font-semibold', done || active ? 'text-slate-800' : 'text-slate-400')}>
                  {meta.label}
                </p>
                <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset', ACTOR_META[ORDER_STAGE_ACTOR[step]].badge)}>
                  {ACTOR_META[ORDER_STAGE_ACTOR[step]].label}
                </span>
              </div>
              {active && <p className="text-xs text-brand-600">In progress…</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
