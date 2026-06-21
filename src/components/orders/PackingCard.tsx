import { useState } from 'react'
import { PackageCheck } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useAssignPackerMutation, useMarkPackedMutation } from '@/services/endpoints/ordersApi'
import { useGetPackersQuery } from '@/services/endpoints/packersApi'
import type { Order } from '@/types/common.types'

/** Optional packing step — assign a packer, then mark packing complete. */
export function PackingCard({ order }: { order: Order }) {
  const { data: packers = [] } = useGetPackersQuery()
  const [assign, { isLoading: assigning }] = useAssignPackerMutation()
  const [markPacked, { isLoading: marking }] = useMarkPackedMutation()
  const [pick, setPick] = useState('')

  const activePackers = packers.filter((p) => p.active)
  const assigned = packers.find((p) => p.id === order.packerId)
  const closed = order.status === 'delivered' || order.status === 'cancelled'

  return (
    <Card>
      <CardHeader
        title="Packing"
        subtitle="Optional — assign a packer, or skip straight to a rider."
        action={order.packed ? <Badge tone="bg-green-50 text-green-700 ring-green-600/15">Packed</Badge> : undefined}
      />
      <CardContent className="space-y-3 pt-2">
        {assigned ? (
          <div className="rounded-xl bg-mint-50 px-3 py-2.5">
            <p className="text-sm font-semibold text-slate-800">{assigned.name}</p>
            <p className="text-xs text-slate-400">{assigned.phone}</p>
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
