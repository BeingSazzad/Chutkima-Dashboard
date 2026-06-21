import { useState } from 'react'
import { Check, ClipboardCopy, PackageCheck } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import {
  useAssignPackerMutation,
  useMarkPackedMutation,
} from '@/services/endpoints/ordersApi'
import { useGetPackersQuery, useGetPackerTemplateQuery } from '@/services/endpoints/packersApi'
import { useGetProductsQuery } from '@/services/endpoints/productsApi'
import type { Order } from '@/types/common.types'

/** Builds the WhatsApp pick-list from the editable template + order items. */
function buildPickList(template: string, order: Order, products: { id: string; sku: string; shelfNo: string }[]) {
  const itemsText = order.items
    .map((it, i) => {
      const p = products.find((x) => x.id === it.productId)
      return `[${i + 1}] SKU: ${p?.sku ?? '—'} | ${it.name} | Shelf: ${p?.shelfNo ?? '—'} | Qty: ${it.quantity} | NPR ${it.price}`
    })
    .join('\n')
  const unitCount = order.items.reduce((s, it) => s + it.quantity, 0)
  return template
    .replace('{orderNo}', order.reference)
    .replace('{customer}', order.customerName)
    .replace('{address}', order.address)
    .replace('{items}', itemsText)
    .replace('{skuCount}', String(order.items.length))
    .replace('{unitCount}', String(unitCount))
}

export function PackingCard({ order }: { order: Order }) {
  const { data: packers = [] } = useGetPackersQuery()
  const { data: template } = useGetPackerTemplateQuery()
  const { data: products = [] } = useGetProductsQuery()
  const [assign, { isLoading: assigning }] = useAssignPackerMutation()
  const [markPacked, { isLoading: marking }] = useMarkPackedMutation()
  const [pick, setPick] = useState('')
  const [copied, setCopied] = useState(false)

  const activePackers = packers.filter((p) => p.active)
  const assigned = packers.find((p) => p.id === order.packerId)
  const closed = order.status === 'delivered' || order.status === 'cancelled'

  const copyPickList = async () => {
    if (!template) return
    const msg = buildPickList(template.value, order, products)
    try {
      await navigator.clipboard.writeText(msg)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Card>
      <CardHeader
        title="Packing"
        subtitle="Optional — assign a packer, or skip straight to a rider."
        action={order.packed ? <Badge tone="bg-green-50 text-green-700 ring-green-600/15">Packed</Badge> : undefined}
      />
      <CardContent className="space-y-3 pt-2">
        {assigned ? (
          <div className="flex items-center justify-between rounded-xl bg-mint-50 px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-slate-800">{assigned.name}</p>
              <p className="text-xs text-slate-400">{assigned.whatsapp}</p>
            </div>
            <Button size="sm" variant="outline" leftIcon={copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />} onClick={copyPickList}>
              {copied ? 'Copied' : 'Copy pick-list'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No packer assigned.</p>
        )}

        {!closed && (
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={pick}
                onChange={(e) => setPick(e.target.value)}
                placeholder={activePackers.length ? 'Select a packer' : 'No active packers'}
                options={activePackers.map((p) => ({ label: p.name, value: p.id }))}
              />
            </div>
            <Button
              size="md"
              loading={assigning}
              disabled={!pick}
              onClick={async () => {
                await assign({ orderId: order.id, packerId: pick }).unwrap()
                setPick('')
              }}
            >
              {order.packerId ? 'Reassign' : 'Assign'}
            </Button>
          </div>
        )}

        {!closed && order.packerId && !order.packed && (
          <Button variant="secondary" className="w-full" loading={marking} leftIcon={<PackageCheck className="h-4 w-4" />} onClick={() => markPacked(order.id)}>
            Mark packing complete
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
