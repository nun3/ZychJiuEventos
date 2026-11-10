'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'

const PREVIEW = 320
const OUTPUT = 512

/**
 * Edição da foto de perfil (estilo LinkedIn): recorte circular com zoom, giro e arrastar.
 * Devolve um File (webp quadrado) que o chamador envia pelo fluxo normal de upload.
 */
export function AvatarPhotoEditor({
  open,
  src,
  busy,
  onClose,
  onSave,
}: {
  open: boolean
  src: string | null
  busy?: boolean
  onClose: () => void
  onSave: (file: File) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [ready, setReady] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [angle, setAngle] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !src) return
    setReady(false); setZoom(1); setAngle(0); setOffset({ x: 0, y: 0 }); setError(null)
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => { imageRef.current = image; setReady(true) }
    image.onerror = () => setError('Não foi possível carregar a foto para edição.')
    image.src = src
  }, [open, src])

  const draw = useCallback((canvas: HTMLCanvasElement, size: number) => {
    const image = imageRef.current
    const context = canvas.getContext('2d')
    if (!image || !context) return
    canvas.width = size
    canvas.height = size
    const k = size / PREVIEW
    context.fillStyle = '#0b1220'
    context.fillRect(0, 0, size, size)
    const base = size / Math.min(image.width, image.height)
    context.save()
    context.translate(size / 2 + offset.x * k, size / 2 + offset.y * k)
    context.rotate((angle * Math.PI) / 180)
    context.scale(base * zoom, base * zoom)
    context.drawImage(image, -image.width / 2, -image.height / 2)
    context.restore()
  }, [zoom, angle, offset])

  useEffect(() => {
    if (ready && canvasRef.current) draw(canvasRef.current, PREVIEW)
  }, [ready, draw])

  const save = () => {
    const canvas = document.createElement('canvas')
    draw(canvas, OUTPUT)
    canvas.toBlob(
      (blob) => {
        if (!blob) { setError('Não foi possível gerar a imagem.'); return }
        onSave(new File([blob], 'avatar.webp', { type: 'image/webp' }))
      },
      'image/webp',
      0.9,
    )
  }

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} title="Editar imagem" className="max-w-2xl">
      <div className="grid gap-6 sm:grid-cols-[320px_1fr]">
        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-mc-medium bg-[#0b1220]"
          style={{ width: PREVIEW, height: PREVIEW, maxWidth: '100%' }}
        >
          <canvas
            ref={canvasRef}
            width={PREVIEW}
            height={PREVIEW}
            aria-label="Pré-visualização do recorte. Arraste para reposicionar."
            className="block h-full w-full cursor-grab active:cursor-grabbing"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }
            }}
            onPointerMove={(event) => {
              const start = drag.current
              if (start) setOffset({ x: start.ox + event.clientX - start.x, y: start.oy + event.clientY - start.y })
            }}
            onPointerUp={() => { drag.current = null }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(circle closest-side at center, transparent calc(100% - 2px), #fff calc(100% - 2px), #fff 100%, rgba(0,0,0,0.55) 100%)' }}
          />
        </div>
        <div className="flex flex-col gap-5 font-mc-interface text-sm text-mc-text-primary">
          <label className="grid gap-2">
            <span className="font-semibold">Zoom</span>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="accent-mc-action" />
          </label>
          <label className="grid gap-2">
            <span className="font-semibold">Girar</span>
            <input type="range" min={-45} max={45} step={1} value={angle} onChange={(event) => setAngle(Number(event.target.value))} className="accent-mc-action" />
          </label>
          <button
            type="button"
            onClick={() => setAngle((value) => ((value + 90 + 180) % 360) - 180)}
            className="w-fit rounded-mc-full border border-mc-border px-4 py-2 text-xs font-semibold hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
          >
            Girar 90°
          </button>
          {error ? <p role="alert" className="text-mc-error">{error}</p> : null}
          <button
            type="button"
            disabled={!ready || busy}
            onClick={save}
            className="mt-auto rounded-mc-full bg-mc-action px-6 py-3 font-bold text-white transition-colors hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
