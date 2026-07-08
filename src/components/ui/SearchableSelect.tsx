import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps {
  label?: string
  placeholder?: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SearchableSelect({
  label,
  placeholder = 'Select...',
  options,
  value,
  onChange,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = options.find((o) => o.value === value)

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className={cn('relative w-full', className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}

      {/* Selector Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-left text-sm text-slate-800 shadow-sm focus-ring hover:bg-slate-50"
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg max-h-60 flex flex-col">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="mb-2 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs focus-ring"
              autoFocus
            />
            <div className="flex-1 overflow-y-auto space-y-0.5 max-h-48 scrollbar-thin">
              {placeholder && (
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-400 hover:bg-slate-50'
                  )}
                >
                  {placeholder}
                </button>
              )}
              {filtered.map((o) => {
                const isSelected = o.value === value
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => handleSelect(o.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors',
                      isSelected ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <span>{o.label}</span>
                    {isSelected && <span className="text-brand-600 font-bold">✓</span>}
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="py-3 text-center text-xs text-slate-400">No options found</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
