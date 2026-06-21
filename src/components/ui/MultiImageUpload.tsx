import { X } from 'lucide-react'
import { ImageUpload } from './ImageUpload'

interface MultiImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  label?: string
  hint?: string
  max?: number
}

/**
 * Gallery uploader — the first image is the cover. Already-added images show as
 * a compact thumbnail row; a single modest dropzone adds more (reuses ImageUpload).
 */
export function MultiImageUpload({ images, onChange, label, hint, max = 5 }: MultiImageUploadProps) {
  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i))
  const add = (url: string) => url && onChange([...images, url])

  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}

      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-contain p-1" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-brand-600 px-1 py-0.5 text-[8px] font-bold text-white">Cover</span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow hover:text-danger"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < max && <ImageUpload value="" onChange={add} aspectClassName="h-32" />}

      <p className="mt-1.5 text-xs text-slate-400">
        {hint ?? 'First image is the cover.'} {images.length}/{max} added.
      </p>
    </div>
  )
}
