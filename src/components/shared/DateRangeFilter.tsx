import { cn } from '@/lib/utils'

interface DateRangeFilterProps {
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
  /** Upper bound for both inputs (e.g. today). */
  max?: string
  /** Show a Clear button to reset both dates (default true). */
  clearable?: boolean
  className?: string
}

/** Reusable start–end date range picker (two native date inputs + optional Clear). */
export function DateRangeFilter({ from, to, onChange, max, clearable = true, className }: DateRangeFilterProps) {
  const inputCls = 'focus-ring h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700'
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="hidden text-xs font-medium text-slate-500 sm:block">From</span>
      <input
        type="date"
        value={from}
        max={to || max}
        onChange={(e) => {
          const v = e.target.value
          // Keep the range valid: if the new start is after the end, push the end out.
          onChange({ from: v, to: to && v && v > to ? v : to })
        }}
        aria-label="From date"
        className={inputCls}
      />
      <span className="text-slate-400">–</span>
      <input
        type="date"
        value={to}
        min={from || undefined}
        max={max}
        onChange={(e) => onChange({ from, to: e.target.value })}
        aria-label="To date"
        className={inputCls}
      />
      {clearable && (from || to) && (
        <button
          onClick={() => onChange({ from: '', to: '' })}
          className="focus-ring rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
        >
          Clear
        </button>
      )}
    </div>
  )
}
