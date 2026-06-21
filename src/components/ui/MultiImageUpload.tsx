import { X } from 'lucide-react'
import { ImageUpload } from './ImageUpload'
import { cn } from '@/lib/utils'

interface MultiImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  label?: string
  hint?: string
  max?: number
}

/**
 * Gallery uploader — the first image is the primary/cover. Reuses ImageUpload
 * (as the "add" tile) so device upload + downscaling behave identically.
 */
export function MultiImageUpload({ images, onChange, label, hint, max = 5 }: MultiImageUploadProps) {
  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i))
  const add = (url: string) => url && onChange([...images, url])

  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((src, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
            <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-contain p-1.5" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded-md bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold text-white">Cover</span>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow hover:text-danger"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <div className={cn('aspect-square', images.length === 0 && 'col-span-3 sm:col-span-2')}>
            <ImageUpload value="" onChange={add} aspectClassName="h-full" />
          </div>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
