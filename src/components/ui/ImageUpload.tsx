import { useId, useRef, useState, type DragEvent } from 'react'
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value: string
  onChange: (dataUrl: string) => void
  label?: string
  hint?: string
  /** Tailwind aspect-ratio class for the preview box. */
  aspectClassName?: string
  /** Longest edge the uploaded image is downscaled to (keeps payloads small). */
  maxDimension?: number
  /** Icon-only empty state — for small boxes (e.g. a square avatar) where the full helper text won't fit. */
  compact?: boolean
}

/**
 * Reusable image picker — upload from device (click or drag & drop).
 * Reads the file, downscales it on a canvas, and emits a data URL via onChange.
 * No backend required; swap the data-URL output for a real upload endpoint later.
 */
export function ImageUpload({
  value,
  onChange,
  label,
  hint,
  aspectClassName = 'aspect-[16/9]',
  maxDimension = 1000,
  compact = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const processFile = (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    setError('')
    setBusy(true)
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h)
          const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          onChange(canvas.toDataURL(type, 0.85))
        } else {
          onChange(reader.result as string)
        }
        setBusy(false)
      }
      img.onerror = () => {
        onChange(reader.result as string)
        setBusy(false)
      }
      img.src = reader.result as string
    }
    reader.onerror = () => {
      setError('Could not read that file.')
      setBusy(false)
    }
    reader.readAsDataURL(file)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => processFile(e.target.files?.[0])}
      />

      {value ? (
        <div className={cn('group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-mint-50', aspectClassName)}>
          <img src={value} alt="Upload preview" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <UploadCloud className="h-3.5 w-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-danger hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'focus-ring flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-3 text-center transition-colors',
            aspectClassName,
            dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-mint-50',
          )}
        >
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          ) : compact ? (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <ImagePlus className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-slate-600">Add photo</p>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <ImagePlus className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Click or drag an image here</p>
              <p className="text-xs text-slate-400">PNG or JPG, uploaded from your device</p>
            </>
          )}
        </button>
      )}

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}
