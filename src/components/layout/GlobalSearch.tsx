import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, User } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { formatNPR } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { useDebounce } from '@/hooks/useDebounce'
import { useGetProductsQuery } from '@/services/endpoints/productsApi'
import { useGetCustomersQuery } from '@/services/endpoints/customersApi'
import { useGetOrdersQuery } from '@/services/endpoints/ordersApi'

/** Working global search — searches orders, products and customers client-side. */
export function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const q = useDebounce(query.trim(), 250)
  const active = q.length > 0

  const { data: orders = [] } = useGetOrdersQuery({ search: q }, { skip: !active })
  const { data: products = [] } = useGetProductsQuery({ search: q }, { skip: !active })
  const { data: customers = [] } = useGetCustomersQuery({ search: q }, { skip: !active })

  const go = (to: string) => {
    setOpen(false)
    setQuery('')
    navigate(to)
  }

  const empty = active && orders.length === 0 && products.length === 0 && customers.length === 0

  return (
    <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search orders, products, customers…"
        className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm placeholder:text-slate-400"
      />

      {open && active && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 max-h-[70vh] w-96 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-card-hover">
            {empty && <p className="px-3 py-6 text-center text-sm text-slate-400">No matches for “{q}”.</p>}

            {orders.length > 0 && (
              <Group title="Orders">
                {orders.slice(0, 4).map((o) => (
                  <button key={o.id} onClick={() => go(ROUTES.orderDetail(o.id))} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-mint-50">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><ShoppingBag className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{o.reference}</span>
                      <span className="block truncate text-xs text-slate-400">{o.customerName}</span>
                    </span>
                    <span className="text-xs font-bold text-slate-700">{formatNPR(o.grandTotal)}</span>
                  </button>
                ))}
              </Group>
            )}

            {products.length > 0 && (
              <Group title="Products">
                {products.slice(0, 4).map((p) => (
                  <button key={p.id} onClick={() => go(ROUTES.products)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-mint-50">
                    <ProductThumb src={p.image} alt={p.name} size="sm" contain />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{p.name}</span>
                      <span className="block truncate text-xs text-slate-400">{p.brand} · {formatNPR(p.price)}</span>
                    </span>
                  </button>
                ))}
              </Group>
            )}

            {customers.length > 0 && (
              <Group title="Customers">
                {customers.slice(0, 4).map((c) => (
                  <button key={c.id} onClick={() => go(ROUTES.customerDetail(c.id))} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-mint-50">
                    <Avatar name={c.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{c.name}</span>
                      <span className="block truncate text-xs text-slate-400">{c.phone}</span>
                    </span>
                    <User className="h-3.5 w-3.5 text-slate-300" />
                  </button>
                ))}
              </Group>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-2 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
      {children}
    </div>
  )
}
