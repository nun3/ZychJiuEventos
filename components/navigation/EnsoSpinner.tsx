import { useId } from 'react'

// Contorno do ideograma 柔 (ju, "suave", de Jiu-Jitsu) embutido como caminho SVG: não depende de fonte CJK no aparelho.
const JU_PATH =
  'M16 -59H118V-79H139V-59H239V-42H155Q189 -13 243 2L233 22Q175 2 139 -37V24H118V-39Q83 0 26 22L12 4Q65 -13 99 -42H16ZM39 -201H208V-184Q180 -168 140 -155H232V-138Q218 -116 199 -97L183 -109L208 -138H149V-105Q148 -84 120 -84L99 -86L96 -105L120 -102Q128 -102 128 -111V-138H127Q89 -104 26 -83L13 -100Q68 -115 102 -138H18V-155H107L80 -168L96 -179L122 -164L174 -184H39Z'

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
 * Indicador de espera "Enso BJJ": círculo zen (ensō) em pincelada sumi-e girando em torno do ideograma 柔.
 * A cor vem de `currentColor`. Com prefers-reduced-motion o anel fica parado (o ideograma já comunica a espera).
 */
export default function EnsoSpinner({ size = 72, className = '' }: { size?: number; className?: string }) {
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
      <path
        d={JU_PATH}
        fill="currentColor"
        fillOpacity={0.92}
        transform="translate(50 50) scale(0.17) translate(-127.5 88.5)"
        filter={`url(#${filterId})`}
      />
    </svg>
  )
}
