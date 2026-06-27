import { useEffect, useState } from 'react'
import { PauseCircle, PlayCircle, Timer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useHoldOrderMutation, useReleaseHoldMutation } from '@/services/endpoints/ordersApi'
import type { Order } from '@/types/common.types'

const DURATIONS = [
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
]

const MAX_HOLD_MINUTES = 24 * 60 // 24 hours

/** Put an order on hold for X minutes/hours with a live countdown + finished notice. */
export function HoldControl({ order }: { order: Order }) {
  const [hold, { isLoading: holding }] = useHoldOrderMutation()
  const [release, { isLoading: releasing }] = useReleaseHoldMutation()
  const [menu, setMenu] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [customValue, setCustomValue] = useState('')
  const [customUnit, setCustomUnit] = useState<'minutes' | 'hours'>('minutes')

  const applyCustom = () => {
    const raw = Number(customValue)
    if (!raw || raw <= 0) return
    const minutes = Math.min(MAX_HOLD_MINUTES, Math.round(customUnit === 'hours' ? raw * 60 : raw))
    if (minutes < 1) return
    hold({ orderId: order.id, minutes })
    setMenu(false)
    setCustomValue('')
  }

  useEffect(() => {
    if (!order.holdUntil) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [order.holdUntil])

  if (order.holdUntil) {
    const remaining = Date.parse(order.holdUntil) - now
    if (remaining <= 0) {
      return (
        <div className="rounded-xl bg-green-50 px-3 py-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
            <Timer className="h-4 w-4" /> Hold finished — ready to resume processing.
          </p>
          <Button className="mt-2" size="sm" variant="secondary" loading={releasing} leftIcon={<PlayCircle className="h-4 w-4" />} onClick={() => release({ orderId: order.id })}>
            Resume order
          </Button>
        </div>
      )
    }
    const secs = Math.floor(remaining / 1000)
    const hh = Math.floor(secs / 3600)
    const mm = Math.floor((secs % 3600) / 60)
    const ss = secs % 60
    const text = hh > 0 ? `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${mm}:${String(ss).padStart(2, '0')}`
    return (
      <div className="rounded-xl bg-amber-50 px-3 py-3">
        <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
          <PauseCircle className="h-4 w-4" /> On hold — processing paused.
        </p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-amber-700">
          {text} <span className="text-sm font-medium">left</span>
        </p>
        <Button className="mt-1" size="sm" variant="outline" loading={releasing} onClick={() => release({ orderId: order.id })}>
          Release hold now
        </Button>
      </div>
    )
  }

  return (
    <div className="relative inline-block">
      <Button size="sm" variant="outline" leftIcon={<PauseCircle className="h-4 w-4" />} loading={holding} onClick={() => setMenu((o) => !o)}>
        Hold order
      </Button>
      {menu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
          <div className="absolute left-0 z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Hold for…</p>
            {DURATIONS.map((d) => (
              <button
                key={d.minutes}
                onClick={() => {
                  hold({ orderId: order.id, minutes: d.minutes })
                  setMenu(false)
                }}
                className="focus-ring block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-mint-50"
              >
                {d.label}
              </button>
            ))}

            {/* Custom duration */}
            <div className="mt-1 border-t border-slate-100 px-2 pb-1.5 pt-2">
              <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Custom</p>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
                  placeholder="e.g. 45"
                  className="focus-ring w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as 'minutes' | 'hours')}
                  className="focus-ring flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                >
                  <option value="minutes">min</option>
                  <option value="hours">hours</option>
                </select>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="mt-2 w-full"
                disabled={!Number(customValue) || Number(customValue) <= 0}
                onClick={applyCustom}
              >
                Hold order
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
