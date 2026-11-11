import type { ReactNode } from 'react'
import { BELT_COLORS, NEUTRAL_RING, TARJA_HALF_ANGLE, graduationMarkAngles, type BeltInfo } from '@/lib/athletes/belt'

// Aro de graduação: a borda da foto tem a cor da faixa; à direita, um segmento preto (a tarja) acompanha a curvatura do aro
// e leva um traço branco por grau, uniformemente espaçados. 0 graus → tarja vazia. Na faixa preta a tarja se separa do aro
// por um vão fino. Faixa não informada (`belt` nulo) → aro neutro e contínuo, sem tarja (nada além do cadastrado).
const THICKNESS = 9 // espessura do aro no viewBox 100
const MARK_WIDTH = 4.6
const MARK_INSET = 1.1 // folga entre o traço e as bordas da tarja
const BLACK_GAP = 3 // vão (graus) que separa a tarja do aro na faixa preta
const TARJA = '#0b0f19'

const polar = (r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180
  return `${(50 + r * Math.cos(rad)).toFixed(3)} ${(50 + r * Math.sin(rad)).toFixed(3)}`
}
const arc = (r: number, from: number, to: number) => `M${polar(r, from)} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${polar(r, to)}`

export default function GraduationAvatar({
  belt,
  size,
  children,
  className = '',
}: {
  belt: BeltInfo | null
  size: number
  children: ReactNode
  className?: string
}) {
  const colors = belt ? BELT_COLORS[belt.belt] : NEUTRAL_RING
  const marks = belt ? graduationMarkAngles(belt.grau) : []
  const mid = 50 - THICKNESS / 2
  const outer = 50 - 0.5
  const inner = 50 - THICKNESS + 0.5
  const isBlack = belt?.belt === 'preta'
  // Faixa preta: o aro cede um vão de cada lado da tarja; nas demais o aro é contínuo por baixo da tarja.
  const from = TARJA_HALF_ANGLE + BLACK_GAP
  const ringArcs = isBlack ? [[from, 360 - from]] : [[0, 359.99]]

  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, maxWidth: '100%', aspectRatio: '1 / 1' }}>
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className="absolute inset-0 h-full w-full">
        <g fill="none">
          {ringArcs.map(([a, b]) => (
            <g key={`${a}-${b}`}>
              <path d={arc(mid, a, b)} stroke={colors.fill} strokeWidth={THICKNESS} />
              <path d={arc(outer, a, b)} stroke={colors.stroke} strokeWidth="1" />
              <path d={arc(inner, a, b)} stroke={colors.stroke} strokeWidth="1" />
            </g>
          ))}
          {belt ? (
            <>
              <path d={arc(mid, -TARJA_HALF_ANGLE, TARJA_HALF_ANGLE)} stroke={TARJA} strokeWidth={THICKNESS} />
              {marks.map((angle) => (
                <rect
                  key={angle}
                  x={50 + mid - (THICKNESS - 2 * MARK_INSET) / 2}
                  y={50 - MARK_WIDTH / 2}
                  width={THICKNESS - 2 * MARK_INSET}
                  height={MARK_WIDTH}
                  rx="0.5"
                  fill="#fff"
                  transform={`rotate(${angle} 50 50)`}
                  data-grau-mark=""
                />
              ))}
            </>
          ) : null}
        </g>
      </svg>
      <span className="absolute overflow-hidden rounded-full" style={{ inset: `${(THICKNESS + 1.6)}%` }}>
        {children}
      </span>
    </span>
  )
}
