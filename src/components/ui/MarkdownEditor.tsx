import { useRef } from 'react'
import { Bold, Heading2, Italic, Link2, List, ListOrdered } from 'lucide-react'

interface MarkdownEditorProps {
  label?: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  hint?: string
  id?: string
}

/**
 * Lightweight markdown editor — a formatting toolbar (bold / italic / heading /
 * lists / link) over a plain textarea. Inserts markdown around the selection, so
 * it round-trips with the markdown the customer app already renders.
 */
export function MarkdownEditor({ label, value, onChange, rows = 10, placeholder, hint, id }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  /** Wrap the current selection with markers (inserts a placeholder if nothing is selected). */
  const wrap = (before: string, after: string, placeholderText: string) => {
    const ta = ref.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const sel = value.slice(start, end) || placeholderText
    const next = value.slice(0, start) + before + sel + after + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + sel.length)
    })
  }

  /** Prefix every line in the selection (headings, list items). */
  const prefixLines = (prefix: string) => {
    const ta = ref.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const block = value.slice(lineStart, end) || placeholderText(prefix)
    const prefixed = block
      .split('\n')
      .map((line, i) => (prefix === '1. ' ? `${i + 1}. ${line}` : prefix + line))
      .join('\n')
    const next = value.slice(0, lineStart) + prefixed + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(lineStart, lineStart + prefixed.length)
    })
  }
  const placeholderText = (prefix: string) => (prefix === '## ' ? 'Heading' : 'List item')

  const tools = [
    { icon: Bold, label: 'Bold', run: () => wrap('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', run: () => wrap('*', '*', 'italic text') },
    { icon: Heading2, label: 'Heading', run: () => prefixLines('## ') },
    { icon: List, label: 'Bullet list', run: () => prefixLines('- ') },
    { icon: ListOrdered, label: 'Numbered list', run: () => prefixLines('1. ') },
    { icon: Link2, label: 'Link', run: () => wrap('[', '](https://)', 'link text') },
  ]

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 transition-colors focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/30">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-1.5 py-1">
          {tools.map((t) => (
            <button
              key={t.label}
              type="button"
              title={t.label}
              aria-label={t.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={t.run}
              className="focus-ring rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-brand-600"
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="block w-full resize-y bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
