import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  loading?: boolean
  /** Use the danger styling for destructive actions (default true). */
  destructive?: boolean
}

/** Reusable confirmation dialog for destructive/important actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  loading,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={
            destructive
              ? 'flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-danger'
              : 'flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600'
          }
        >
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-800">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
        <div className="mt-6 flex w-full gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            className="flex-1"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
