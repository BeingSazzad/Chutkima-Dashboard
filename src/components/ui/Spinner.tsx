import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 text-slate-400', className)}>
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
