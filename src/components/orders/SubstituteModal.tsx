import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { cn, formatNPR } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { useGetProductsQuery } from '@/services/endpoints/productsApi'
import { useSubstituteItemMutation } from '@/services/endpoints/ordersApi'
import type { OrderItem } from '@/types/common.types'

interface Props {
  orderId: string
  item: OrderItem | null
  onClose: () => void
}

/** Swap an out-of-stock order item for an in-stock alternative. */
export function SubstituteModal({ orderId, item, onClose }: Props) {
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 250)
  const { data: products = [] } = useGetProductsQuery({ search: debounced || undefined })
  const [substitute, { isLoading }] = useSubstituteItemMutation()
  const [selected, setSelected] = useState('')

  const candidates = products.filter((p) => p.id !== item?.productId && p.stock > 0)

  const submit = async () => {
    if (!item || !selected) return
    await substitute({ orderId, productId: item.productId, newProductId: selected }).unwrap()
    setSelected('')
    setSearch('')
    onClose()
  }

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title="Substitute item"
      description={item ? `Replace "${item.name}" with an in-stock alternative` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!selected}>Substitute & notify customer</Button>
        </>
      }
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search replacement product…"
          className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
        />
      </div>
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {candidates.map((p) => {
          const on = selected === p.id
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={cn('flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors', on ? 'bg-brand-50 ring-1 ring-brand-500' : 'hover:bg-slate-50')}
            >
              <ProductThumb src={p.image} alt={p.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-400">{formatNPR(p.price)} · {p.stock} in stock</p>
              </div>
              {on && <Check className="h-4 w-4 text-brand-600" />}
            </button>
          )
        })}
        {candidates.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No in-stock products found.</p>}
      </div>
    </Modal>
  )
}
