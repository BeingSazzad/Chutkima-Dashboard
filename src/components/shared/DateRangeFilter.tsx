import { useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Local-date helpers (avoid UTC off-by-one from toISOString) ─────────────── */
const pad = (n: number) => String(n).padStart(2, '0')
const fmtISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseISO = (s: string) => new Date(`${s}T00:00:00`)
const todayISO = () => fmtISO(new Date())
const weekStartISO = () => {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay()) // Sunday
  return fmtISO(d)
}
const monthStartISO = () => {
  const d = new Date()
  return fmtISO(new Date(d.getFullYear(), d.getMonth(), 1))
}
const fmtLong = (s: string) => parseISO(s).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
const fmtShort = (s: string) => parseISO(s).toLocaleDateString([], { day: '2-digit', month: 'short' })

type PresetKey = 'all' | 'today' | 'week' | 'month'

interface DateRangeFilterProps {
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
  /** Upper bound for selectable days (e.g. today). */
  max?: string
  /** Allow an "All Time" (empty) selection. Set false when a range is required. */
  clearable?: boolean
  className?: string
}

/**
 * Compact, reusable date filter: a presets-only dropdown + a separate calendar
 * icon. The calendar popover does single-date selection, with a "Custom Date
 * Range" toggle at the bottom for start–end. The trigger shows the applied label.
 */
export function DateRangeFilter({ from, to, onChange, max, clearable = true, className }: DateRangeFilterProps) {
  const [open, setOpen] = useState<null | 'presets' | 'cal'>(null)
  const [view, setView] = useState(() => parseISO(from || todayISO()))
  const [rangeMode, setRangeMode] = useState(false)
  const [rangeStart, setRangeStart] = useState<string | null>(null)

  const close = () => {
    setOpen(null)
    setRangeMode(false)
    setRangeStart(null)
  }

  /* Label shown on the trigger. */
  const label = (() => {
    if (!from && !to) return 'All Time'
    if (from === to) return from === todayISO() ? 'Today' : fmtLong(from)
    if (to === todayISO() && from === weekStartISO()) return 'This Week'
    if (to === todayISO() && from === monthStartISO()) return 'This Month'
    return `${fmtShort(from)} – ${fmtShort(to)}`
  })()

  const presets: { key: PresetKey; label: string; range: () => { from: string; to: string } }[] = [
    ...(clearable ? [{ key: 'all' as const, label: 'All Time', range: () => ({ from: '', to: '' }) }] : []),
    { key: 'today', label: 'Today', range: () => ({ from: todayISO(), to: todayISO() }) },
    { key: 'week', label: 'This Week', range: () => ({ from: weekStartISO(), to: todayISO() }) },
    { key: 'month', label: 'This Month', range: () => ({ from: monthStartISO(), to: todayISO() }) },
  ]

  const pickDay = (dayISO: string) => {
    if (!rangeMode) {
      onChange({ from: dayISO, to: dayISO })
      close()
      return
    }
    if (!rangeStart) {
      setRangeStart(dayISO)
      return
    }
    const a = rangeStart
    const lo = a <= dayISO ? a : dayISO
    const hi = a <= dayISO ? dayISO : a
    onChange({ from: lo, to: hi })
    close()
  }

  /* Calendar grid for the viewed month (Sunday-first). */
  const year = view.getFullYear()
  const month = view.getMonth()
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => fmtISO(new Date(year, month, i + 1))),
  ]
  const inSelected = (d: string) => (from && to ? d >= from && d <= to : d === from)

  const triggerCls = 'focus-ring inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:border-slate-300'

  return (
    <div className={cn('relative inline-flex items-center gap-1.5', className)}>
      {/* Presets dropdown trigger (also shows the applied label) */}
      <button type="button" onClick={() => setOpen(open === 'presets' ? null : 'presets')} className={cn(triggerCls, 'min-w-[7.5rem] justify-between')}>
        <span className="truncate">{label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {/* Separate calendar icon → opens the calendar popover */}
      <button
        type="button"
        onClick={() => { setOpen(open === 'cal' ? null : 'cal'); setView(parseISO(from || todayISO())) }}
        className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-brand-600"
        aria-label="Open calendar"
      >
        <CalendarDays className="h-4 w-4" />
      </button>

      {open === 'presets' && (
        <>
          <div className="fixed inset-0 z-20" onClick={close} />
          <div className="absolute left-0 top-12 z-30 w-44 rounded-xl border border-slate-100 bg-white p-1 shadow-card-hover">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => { onChange(p.range()); close() }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-mint-50',
                  label === p.label ? 'font-semibold text-brand-700' : 'text-slate-700',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}

      {open === 'cal' && (
        <>
          <div className="fixed inset-0 z-20" onClick={close} />
          <div className="absolute left-0 top-12 z-30 w-[18rem] rounded-2xl border border-slate-100 bg-white p-3 shadow-card-hover">
            {/* Month nav */}
            <div className="mb-2 flex items-center justify-between">
              <button onClick={() => setView(new Date(year, month - 1, 1))} className="focus-ring rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-slate-800">{view.toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
              <button
                onClick={() => setView(new Date(year, month + 1, 1))}
                disabled={!!max && fmtISO(new Date(year, month + 1, 1)) > max}
                className="focus-ring rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => <div key={w} className="py-1">{w}</div>)}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d, i) =>
                d == null ? (
                  <div key={i} />
                ) : (
                  <button
                    key={d}
                    onClick={() => pickDay(d)}
                    disabled={!!max && d > max}
                    className={cn(
                      'mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30',
                      d === rangeStart
                        ? 'bg-brand-600 text-white'
                        : inSelected(d)
                          ? 'bg-brand-600 text-white'
                          : from && to && d > from && d < to
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-700 hover:bg-slate-100',
                    )}
                  >
                    {parseISO(d).getDate()}
                  </button>
                ),
              )}
            </div>

            {/* Custom Date Range toggle */}
            <div className="mt-2 border-t border-slate-100 pt-2">
              {!rangeMode ? (
                <button onClick={() => setRangeMode(true)} className="focus-ring w-full rounded-lg px-3 py-2 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50">
                  Custom Date Range
                </button>
              ) : (
                <p className="flex items-center justify-between px-1 text-xs text-slate-500">
                  <span>{rangeStart ? `Start ${fmtShort(rangeStart)} · pick end` : 'Pick the start date'}</span>
                  <button onClick={() => { setRangeMode(false); setRangeStart(null) }} className="focus-ring rounded px-1.5 py-0.5 font-semibold text-brand-700 hover:bg-brand-50">
                    Single
                  </button>
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
