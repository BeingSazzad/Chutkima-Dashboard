import { useState } from 'react'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductThumbProps {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  /** Use object-contain + padding so the whole product shows (not cropped). */
  contain?: boolean
  className?: string
}

const sizes = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}

/** Square product image with a graceful fallback. */
export function ProductThumb({ src, alt, size = 'md', contain, className }: ProductThumbProps) {
  const [errored, setErrored] = useState(false)
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100',
        contain ? 'bg-white p-1.5' : 'bg-mint-50',
        sizes[size],
        className,
      )}
    >
      {errored || !src ? (
        <Package className="h-1/2 w-1/2 text-brand-300" />
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setErrored(true)}
          className={cn('h-full w-full', contain ? 'object-contain' : 'object-cover')}
        />
      )}
    </div>
  )
}
