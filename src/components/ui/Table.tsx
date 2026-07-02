import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: string
  header: ReactNode
  /** Cell renderer. */
  cell: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  /** Rows per page. When set, the table paginates with a footer. */
  pageSize?: number
}

/** Reusable, lightly-styled data table with loading, empty + pagination states. */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  loading,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  pageSize,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const total = data.length

  // Reset to the first page whenever the dataset size changes (e.g. on search).
  const [prevTotal, setPrevTotal] = useState(total)
  if (prevTotal !== total) {
    setPrevTotal(total)
    setPage(1)
  }

  const pageCount = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1
  const current = Math.min(page, pageCount)
  const rows = pageSize ? data.slice((current - 1) * pageSize, current * pageSize) : data

  return (
    <div>
      <div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400',
                    c.headerClassName,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16">
                  <Spinner label="Loading…" />
                </td>
              </tr>
            ) : total === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-slate-50 transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-mint-50',
                  )}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-4 py-3 align-middle text-slate-700', c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageSize && !loading && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-400">
            Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, total)} of {total}
          </p>
          {pageCount > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(current - 1)}
                disabled={current <= 1}
                className="focus-ring flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="px-2 text-sm font-semibold text-slate-500">
                {current} / {pageCount}
              </span>
              <button
                onClick={() => setPage(current + 1)}
                disabled={current >= pageCount}
                className="focus-ring flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
