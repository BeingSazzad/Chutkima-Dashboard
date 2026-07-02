import { useState } from 'react'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  label: string
  placeholder?: string
  options: { label: string; value: string }[]
  selectedValues: string[]
  onChange: (values: string[]) => void
}

export function SearchableMultiSelect({
  label,
  placeholder = 'Search...',
  options,
  selectedValues,
  onChange,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val))
    } else {
      onChange([...selectedValues, val])
    }
  }

  const removeValue = (val: string) => {
    onChange(selectedValues.filter((v) => v !== val))
  }

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOptions = options.filter((o) => selectedValues.includes(o.value))

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>

      {/* Selected tags */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedOptions.map((o) => (
            <span
              key={o.value}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
            >
              {o.label}
              <button
                type="button"
                onClick={() => removeValue(o.value)}
                className="text-brand-400 hover:text-brand-600 focus:outline-none ml-1 text-sm font-bold"
                aria-label={`Remove ${o.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Selector Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 shadow-sm focus-ring hover:bg-slate-50"
      >
        <span className="truncate text-slate-500">
          {selectedValues.length > 0 ? `${selectedValues.length} selected` : placeholder}
        </span>
        <span className="text-slate-400 text-xs">▼</span>
      </button>

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
            <div className="flex-1 overflow-y-auto space-y-0.5">
              {filtered.map((o) => {
                const isSelected = selectedValues.includes(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleValue(o.value)}
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
