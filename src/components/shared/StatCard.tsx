import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn, pctChange } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  change?: number
  changeSuffix?: string
  icon: ReactNode
  iconClass?: string
}

/** KPI tile used across the dashboard overview. */
export function StatCard({ label, value, change, changeSuffix = 'vs yesterday', icon, iconClass }: StatCardProps) {
  const positive = (change ?? 0) >= 0
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-800">{value}</p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600',
            iconClass,
          )}
        >
          {icon}
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
              positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {pctChange(change)}
          </span>
          <span className="text-slate-400">{changeSuffix}</span>
        </div>
      )}
    </Card>
  )
}
