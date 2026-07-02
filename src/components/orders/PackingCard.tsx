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
    if (!assigned?.phone) return
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
          <div className="flex flex-col gap-2 rounded-xl bg-mint-50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Assigned Packer</p>
                <p className="text-sm font-bold text-slate-800">{assigned.name}</p>
              </div>
              {assigned.phone && (
                <button
                  onClick={notifyPacker}
                  className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp pick-list
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <p className="text-sm text-slate-400">No packer assigned.</p>
            {!closed && order.status !== 'pending' && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                onClick={() => setAssignOpen(true)}
              >
                Assign packer
              </Button>
            )}
          </div>
        )}

        {order.status === 'pending' ? (
          <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-500">Confirm the order first, then assign a packer or mark it ready.</p>
        ) : (
          !closed && (
            <div className="flex flex-col gap-2 sm:flex-row">
              {assigned && (
                <Button
                  variant="outline"
                  className={order.packed ? 'w-full' : 'flex-1'}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                  onClick={() => setAssignOpen(true)}
                >
                  Reassign packer
                </Button>
              )}
              {!order.packed && (
                <Button variant="primary" className="flex-1" loading={marking} leftIcon={<PackageCheck className="h-4 w-4" />} onClick={() => markPacked(order.id)}>
                  Mark ready for pickup
                </Button>
              )}
            </div>
          )
        )}
      </CardContent>

      <AssignPackerModal order={order} open={assignOpen} onClose={() => setAssignOpen(false)} />
    </Card>
  )
}
