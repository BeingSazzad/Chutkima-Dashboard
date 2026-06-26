import { useState } from 'react'
import { PackageCheck, MessageCircle, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AssignPackerModal } from '@/components/orders/AssignPackerModal'
import { useMarkPackedMutation } from '@/services/endpoints/ordersApi'
import { useGetPackersQuery } from '@/services/endpoints/packersApi'
import { useGetProductsQuery } from '@/services/endpoints/productsApi'
import { buildPackerMessage, openWhatsApp } from '@/lib/whatsapp'
import type { Order } from '@/types/common.types'

/** Optional packing step — assign a packer, then mark packing complete. */
export function PackingCard({ order }: { order: Order }) {
  const { data: packers = [] } = useGetPackersQuery()
  const { data: products = [] } = useGetProductsQuery()
  const [markPacked, { isLoading: marking }] = useMarkPackedMutation()
  const [assignOpen, setAssignOpen] = useState(false)

  const assigned = packers.find((p) => p.id === order.packerId)
  const closed = order.status === 'delivered' || order.status === 'cancelled'

  const notifyPacker = () => {
    if (!assigned) return
    const byProductId = new Map(products.map((p) => [p.id, p]))
    openWhatsApp(assigned.phone, buildPackerMessage(order, assigned, byProductId))
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
          <div className="flex items-center justify-between gap-2 rounded-xl bg-mint-50 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">{assigned.name}</p>
              <p className="text-xs text-slate-400">{assigned.phone}</p>
            </div>
            <Button size="sm" variant="outline" leftIcon={<MessageCircle className="h-3.5 w-3.5" />} onClick={notifyPacker}>
              WhatsApp pick-list
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No packer assigned.</p>
        )}

        {order.status === 'pending' ? (
          <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-500">Confirm the order first, then assign a packer or mark it ready.</p>
        ) : (
          !closed && (
            <>
              {/* Packer is optional — admin can mark ready for pickup with or without one. */}
              {!order.packed && (
                <Button variant="primary" className="w-full" loading={marking} leftIcon={<PackageCheck className="h-4 w-4" />} onClick={() => markPacked(order.id)}>
                  Mark ready for pickup
                </Button>
              )}

              <Button
                variant="secondary"
                className="w-full"
                leftIcon={<UserPlus className="h-4 w-4" />}
                onClick={() => setAssignOpen(true)}
              >
                {order.packerId ? 'Reassign packer' : 'Assign packer'}
              </Button>
            </>
          )
        )}
      </CardContent>

      <AssignPackerModal order={order} open={assignOpen} onClose={() => setAssignOpen(false)} />
    </Card>
  )
}
