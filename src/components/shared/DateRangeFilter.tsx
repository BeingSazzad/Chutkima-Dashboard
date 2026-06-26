import { useState } from 'react'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'

type Preset = 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'month' | 'day' | 'custom'

const iso = (d: Date) => d.toISOString().slice(0, 10)
const todayStr = () => iso(new Date())
const addDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}
const monthStart = () => {
  const d = new Date()
  return iso(new Date(d.getFullYear(), d.getMonth(), 1))
}

/** Compute the from/to for a fixed preset. */
function rangeFor(p: Preset): { from: string; to: string } {
  const today = todayStr()
  switch (p) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday': {
      const y = addDays(-1)
      return { from: y, to: y }
    }
    case 'last7':
      return { from: addDays(-6), to: today }
    case 'last30':
      return { from: addDays(-29), to: today }
    case 'month':
      return { from: monthStart(), to: today }
    default:
      return { from: '', to: '' } // all time
  }
}

interface DateRangeFilterProps {
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
  /** Upper bound for the date inputs (e.g. today). */
  max?: string
  /** Allow an "All time" (empty) selection. Set false when a range is required. */
  clearable?: boolean
  className?: string
}

/**
 * Friendly date filter: a presets dropdown (Today / Yesterday / Last 7 / Last 30 /
 * This month) plus "Single day" (one calendar) and "Custom range" (from–to).
 * Picking one day no longer needs the same date typed twice.
 */
export function DateRangeFilter({ from, to, onChange, max, clearable = true, className }: DateRangeFilterProps) {
  const inferPreset = (): Preset => {
    if (!from && !to) return clearable ? 'all' : 'last7'
    const today = todayStr()
    if (from && from === to) {
      if (from === today) return 'today'
      if (from === addDays(-1)) return 'yesterday'
      return 'day'
    }
    if (to === today) {
      if (from === addDays(-6)) return 'last7'
      if (from === addDays(-29)) return 'last30'
      if (from === monthStart()) return 'month'
    }
    return 'custom'
  }
  const [preset, setPreset] = useState<Preset>(inferPreset)

  const options = [
    ...(clearable ? [{ label: 'All time', value: 'all' }] : []),
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: 'last7' },
    { label: 'Last 30 days', value: 'last30' },
    { label: 'This month', value: 'month' },
    { label: 'Single day', value: 'day' },
    { label: 'Custom range', value: 'custom' },
  ]

  const choose = (p: Preset) => {
    setPreset(p)
    if (p === 'day') {
      // Default the single day to today if nothing valid is set yet.
      onChange({ from: from || todayStr(), to: from || todayStr() })
    } else if (p === 'custom') {
      // Seed a sensible range if currently empty.
      if (!from && !to) onChange({ from: addDays(-6), to: todayStr() })
    } else {
      onChange(rangeFor(p))
    }
  }

  const inputCls = 'focus-ring h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700'

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="w-36">
        <Select value={preset} onChange={(e) => choose(e.target.value as Preset)} options={options} />
      </div>

      {preset === 'day' && (
        <input
          type="date"
          value={from}
          max={max}
          onChange={(e) => onChange({ from: e.target.value, to: e.target.value })}
          aria-label="Day"
          className={inputCls}
        />
      )}

      {preset === 'custom' && (
        <>
          <input
            type="date"
            value={from}
            max={to || max}
            onChange={(e) => {
              const v = e.target.value
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
        </>
      )}
    </div>
  )
}
