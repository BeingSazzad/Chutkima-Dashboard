import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { WARNING_SEVERITY_META } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'
import { useIssueWarningMutation } from '@/services/endpoints/reviewsApi'
import type { WarningSeverity } from '@/types/common.types'

interface WarnRiderModalProps {
  open: boolean
  onClose: () => void
  driverId: string
  driverName: string
  /** When raised from a complaint, the warning is logged on it + marks it reviewed. */
  reportId?: string
  reportReason?: string
}

/** Reusable "issue a warning to a rider" dialog — used from a rider's profile and the Reports queue. */
export function WarnRiderModal({ open, onClose, driverId, driverName, reportId, reportReason }: WarnRiderModalProps) {
  const { user } = useAuth()
  const [issue, { isLoading }] = useIssueWarningMutation()
  const [severity, setSeverity] = useState<WarningSeverity>('warning')
  const [message, setMessage] = useState('')

  const close = () => {
    setSeverity('warning')
    setMessage('')
    onClose()
  }

  const submit = async () => {
    if (!message.trim()) return
    await issue({ driverId, severity, message, reportId, issuedBy: user?.name ?? 'Admin' }).unwrap()
    close()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Warn rider"
      description={reportReason ? `${driverName} · ${reportReason}` : driverName}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button variant="danger" loading={isLoading} disabled={!message.trim()} onClick={submit} leftIcon={<ShieldAlert className="h-4 w-4" />}>
            Issue warning
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Select
          label="Severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value as WarningSeverity)}
          options={(Object.keys(WARNING_SEVERITY_META) as WarningSeverity[]).map((k) => ({
            label: WARNING_SEVERITY_META[k].label,
            value: k,
          }))}
        />
        <Textarea
          label="Message to rider (required)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="e.g. Multiple late deliveries reported — please keep to delivery times."
          autoFocus
        />
        {reportId && (
          <p className="text-xs text-slate-400">This warning will be logged on the complaint and mark it reviewed.</p>
        )}
      </div>
    </Modal>
  )
}
