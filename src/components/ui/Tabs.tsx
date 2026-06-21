import { cn } from '@/lib/utils'

export interface TabItem {
  label: string
  value: string
  count?: number
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

/** Underline-style segmented tabs used for filtering lists. */
export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-slate-100', className)}>
      {items.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold transition-colors',
              active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                    active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
            )}
          </button>
        )
      })}
    </div>
  )
}
