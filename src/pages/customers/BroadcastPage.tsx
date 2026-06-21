import { useState } from 'react'
import { Check, Megaphone, Send, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { useGetSegmentCountQuery, useSendBroadcastMutation } from '@/services/endpoints/customersApi'

const SEGMENTS = [
  { label: 'All customers', value: 'all' },
  { label: 'Trusted only', value: 'trusted' },
  { label: 'VIP (spend > NPR 25k)', value: 'vip' },
  { label: 'Has wallet balance', value: 'wallet' },
  { label: 'Inactive (7+ days)', value: 'inactive' },
]

export default function BroadcastPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [segment, setSegment] = useState('all')
  const { data: count = 0 } = useGetSegmentCountQuery(segment)
  const [send, { isLoading }] = useSendBroadcastMutation()
  const [sent, setSent] = useState<{ recipients: number; title: string } | null>(null)

  const submit = async () => {
    const res = await send({ title, message, segment }).unwrap()
    setSent({ recipients: res.recipients, title })
    setTitle('')
    setMessage('')
  }

  return (
    <>
      <PageHeader title="Push Broadcast" description="Send a push notification to your customers (FCM in production)." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Compose" subtitle="Title + message + audience" />
          <CardContent className="space-y-3 pt-2">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. ⚡ 10-min delivery is live!" />
            <Textarea label="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Write your notification…" />
            <Select label="Audience" value={segment} onChange={(e) => setSegment(e.target.value)} options={SEGMENTS} />
            <div className="flex items-center justify-between rounded-xl bg-mint-50 px-3 py-2.5 text-sm">
              <span className="flex items-center gap-1.5 text-slate-600"><Users className="h-4 w-4 text-brand-500" /> Reaching</span>
              <span className="font-bold text-brand-700">{count} customers</span>
            </div>
            <div className="flex justify-end">
              <Button onClick={submit} loading={isLoading} disabled={!title.trim() || !message.trim()} leftIcon={<Send className="h-4 w-4" />}>
                Send broadcast
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Live preview */}
          <Card>
            <CardHeader title="Preview" />
            <CardContent className="pt-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{title || 'Notification title'}</p>
                    <p className="text-[11px] text-slate-400">Chutkima · now</p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{message || 'Your message preview appears here.'}</p>
              </div>
            </CardContent>
          </Card>

          {sent && (
            <div className="flex items-start gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Sent “{sent.title}” to {sent.recipients} customers.</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
