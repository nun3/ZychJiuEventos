import { useId } from 'react'
import ToriiMark, { TORII_ASPECT } from '@/components/brand/ToriiMark'

const TORII_H = 50 // altura da torii no viewBox 100x100 do indicador; a largura segue a proporção original
const TORII_W = TORII_H * TORII_ASPECT

const R = 34
const point = (deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180
  return `${(50 + R * Math.cos(rad)).toFixed(2)} ${(50 + R * Math.sin(rad)).toFixed(2)}`
}
const arc = (from: number, to: number) => `M${point(from)} A${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${point(to)}`

// Pincelada do ensō: a tinta carrega no fim do traço (mais grosso e escuro) e some na cauda; a abertura é o "ma" do círculo.
const STROKE_COUNT = 9
const STROKES = Array.from({ length: STROKE_COUNT }, (_, i) => {
  const t = i / (STROKE_COUNT - 1)
  const from = 20 + i * 31
  return { d: arc(from, from + 31.2), cap: i === 0 || i === STROKE_COUNT - 1 ? 'round' : 'butt',
    width: 2 + t * t * 5.2, opacity: 0.25 + t * 0.75 }
})

/**
 * Indicador de espera "Enso BJJ": círculo zen (ensō) em pincelada sumi-e girando em torno da torii da marca.
 * A torii vem de `ToriiMark` e reutiliza `TORII_SHAPE` (a mesma geometria do hero de /experiencia). A cor vem de `currentColor`.
 * Com prefers-reduced-motion o anel fica parado (a torii já comunica a espera).
 */
export default function EnsoSpinner({ size = 72, className = '', variant = 'lattice', dotGapPx }: { size?: number; className?: string; variant?: 'lattice' | 'solid'; dotGapPx?: number }) {
  const filterId = `enso-brush-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false" className={className} fill="none">
      <defs>
        {/* Borda irregular de pincel seco: ruído deslocando levemente o traço. */}
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g className="mc-enso-ring" filter={`url(#${filterId})`} stroke="currentColor" strokeLinecap="round">
        {STROKES.map((stroke) => (
          <path key={stroke.d} d={stroke.d} strokeWidth={stroke.width} strokeLinecap={stroke.cap as 'round' | 'butt'} opacity={stroke.opacity} />
        ))}
        <path d={arc(214, 296)} strokeWidth={1.2} opacity={0.45} transform="translate(0 0) scale(0.92) translate(4.3 4.3)" />
      </g>
      {/* Torii da marca (mesma geometria do hero), centrada no anel. */}
      <ToriiMark
        x={50 - TORII_W / 2}
        y={50 - TORII_H / 2}
        width={TORII_W}
        height={TORII_H}
        pixelWidth={(TORII_W / 100) * size}
        variant={variant}
        dotGapPx={dotGapPx}
        color="currentColor"
        opacity={0.92}
      />
    </svg>
  )
}
