import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bike,
  ChevronRight,
  CreditCard,
  RotateCcw,
  ShoppingBag,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn, timeAgo } from '@/lib/utils'
import { useGetActivityQuery } from '@/services/endpoints/activityApi'
import type { ActivityEvent, ActivityType } from '@/types/common.types'

const TYPE_META: Record<ActivityType, { label: string; icon: LucideIcon; className: string }> = {
  order: { label: 'Orders', icon: ShoppingBag, className: 'bg-brand-50 text-brand-600' },
  payment: { label: 'Payments', icon: CreditCard, className: 'bg-green-50 text-green-600' },
  stock: { label: 'Stock', icon: AlertTriangle, className: 'bg-amber-50 text-amber-600' },
  rider: { label: 'Riders', icon: Bike, className: 'bg-violet-50 text-violet-600' },
  return: { label: 'Returns', icon: RotateCcw, className: 'bg-sky-50 text-sky-600' },
  customer: { label: 'Customers', icon: Users, className: 'bg-blue-50 text-blue-600' },
  review: { label: 'Reviews', icon: Star, className: 'bg-yellow-50 text-yellow-600' },
}

/** Ordered list of filter tabs. */
const TYPE_ORDER: ActivityType[] = ['order', 'payment', 'stock', 'rider', 'return', 'customer', 'review']

function dayBucket(iso: string): string {
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86_400_000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return 'Earlier'
}

export default function ActivityPage() {
  const navigate = useNavigate()
  const { data: events = [], isLoading } = useGetActivityQuery()
  const [filter, setFilter] = useState<'all' | ActivityType>('all')

  const filtered = useMemo(
    () => (filter === 'all' ? events : events.filter((e) => e.type === filter)),
    [events, filter],
  )

  // Group the filtered feed into Today / Yesterday / Earlier, preserving order.
  const groups = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>()
    for (const e of filtered) {
      const b = dayBucket(e.at)
      if (!map.has(b)) map.set(b, [])
      map.get(b)!.push(e)
    }
    return [...map.entries()]
  }, [filtered])

  const tabs = useMemo(() => {
    const present = TYPE_ORDER.filter((t) => events.some((e) => e.type === t))
    return [
      { label: 'All', value: 'all', count: events.length },
      ...present.map((t) => ({
        label: TYPE_META[t].label,
        value: t,
        count: events.filter((e) => e.type === t).length,
      })),
    ]
  }, [events])

  return (
    <>
      <PageHeader title="Activity" description="Everything happening across your stores — orders, payments, stock, riders and returns." />

      <div className="mb-4">
        <Tabs items={tabs} value={filter} onChange={(v) => setFilter(v as 'all' | ActivityType)} />
      </div>

      <Card>
        {isLoading ? (
          <div className="py-16">
            <Spinner label="Loading activity…" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState title="Nothing here yet" description="Activity for this filter will show up as it happens." />
          </div>
        ) : (
          <div className="p-2 sm:p-4">
            {groups.map(([bucket, items]) => (
              <div key={bucket} className="mb-4 last:mb-0">
                <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{bucket}</p>
                <div className="space-y-0.5">
                  {items.map((e) => {
                    const meta = TYPE_META[e.type]
                    const Icon = meta.icon
                    return (
                      <button
                        key={e.id}
                        onClick={() => navigate(e.to)}
                        className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-mint-50"
                      >
                        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.className)}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{e.title}</p>
                          <p className="truncate text-xs text-slate-400">{e.desc}</p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">{timeAgo(e.at)}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-brand-500" />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
