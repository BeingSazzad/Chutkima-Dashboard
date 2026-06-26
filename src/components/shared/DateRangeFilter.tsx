import { useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
type Mode = 'single' | 'range'

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
 * Compact date filter: a presets-only dropdown + a separate calendar icon.
 * The calendar popover selects a single date or a custom range, then APPLY
 * confirms it (nothing is applied just by clicking a day). The trigger shows
 * the applied label.
 */
export function DateRangeFilter({ from, to, onChange, max, clearable = true, className }: DateRangeFilterProps) {
  const [open, setOpen] = useState<null | 'presets' | 'cal'>(null)
  const [view, setView] = useState(() => parseISO(from || todayISO()))
  const [mode, setMode] = useState<Mode>('single')
  const [pendFrom, setPendFrom] = useState<string | null>(null)
  const [pendTo, setPendTo] = useState<string | null>(null)

  const close = () => setOpen(null)

  const openCalendar = () => {
    setView(parseISO(from || todayISO()))
    setMode(from && to && from !== to ? 'range' : 'single')
    setPendFrom(from || null)
    setPendTo(to || null)
    setOpen(open === 'cal' ? null : 'cal')
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    if (m === 'single') {
      setPendTo(pendFrom)
    } else {
      // Start the range fresh: pick start, then end.
      setPendFrom(null)
      setPendTo(null)
    }
  }

  /* Trigger label. */
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

  /* Day click only stages a pending selection — never applies on its own. */
  const pickDay = (d: string) => {
    if (mode === 'single') {
      setPendFrom(d)
      setPendTo(d)
      return
    }
    if (!pendFrom || pendTo) {
      setPendFrom(d)
      setPendTo(null)
    } else {
      const lo = d < pendFrom ? d : pendFrom
      const hi = d < pendFrom ? pendFrom : d
      setPendFrom(lo)
      setPendTo(hi)
    }
  }

  const canApply = mode === 'single' ? !!pendFrom : !!pendFrom && !!pendTo
  const apply = () => {
    if (!canApply || !pendFrom) return
    onChange({ from: pendFrom, to: pendTo ?? pendFrom })
    close()
  }

  const hint =
    mode === 'single'
      ? pendFrom
        ? `Selected ${fmtShort(pendFrom)}`
        : 'Pick a date'
      : !pendFrom
        ? 'Pick the start date'
        : !pendTo
          ? 'Now pick the end date'
          : `${fmtShort(pendFrom)} – ${fmtShort(pendTo)}`

  /* Calendar grid (Sunday-first) for the viewed month. */
  const year = view.getFullYear()
  const month = view.getMonth()
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => fmtISO(new Date(year, month, i + 1))),
  ]

  const triggerCls = 'focus-ring inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:border-slate-300'
  const segCls = (active: boolean) =>
    cn('rounded-lg px-3 py-1.5 text-sm transition-colors', active ? 'bg-white font-semibold text-brand-700 shadow-sm' : 'font-medium text-slate-500 hover:text-slate-700')

  return (
    <div className={cn('relative inline-flex items-center gap-1.5', className)}>
      {/* Presets dropdown (also shows the applied label) */}
      <button type="button" onClick={() => setOpen(open === 'presets' ? null : 'presets')} className={cn(triggerCls, 'min-w-[7.5rem] justify-between')}>
        <span className="truncate">{label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {/* Separate calendar icon */}
      <button
        type="button"
        onClick={openCalendar}
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
                className={cn('flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-mint-50', label === p.label ? 'font-semibold text-brand-700' : 'text-slate-700')}
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
            {/* Mode toggle */}
            <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button onClick={() => switchMode('single')} className={segCls(mode === 'single')}>Single date</button>
              <button onClick={() => switchMode('range')} className={segCls(mode === 'range')}>Date range</button>
            </div>

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
                      d === pendFrom || d === pendTo
                        ? 'bg-brand-600 font-semibold text-white'
                        : pendFrom && pendTo && d > pendFrom && d < pendTo
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-slate-700 hover:bg-slate-100',
                    )}
                  >
                    {parseISO(d).getDate()}
                  </button>
                ),
              )}
            </div>

            {/* Confirm */}
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">{hint}</span>
              <Button size="sm" disabled={!canApply} onClick={apply}>Apply</Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
