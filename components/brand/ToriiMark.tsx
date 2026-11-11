import { useId, type SVGProps } from 'react'
import { TORII_SHAPE } from '@/components/home-cinematic/torii-shape'

// Símbolo provisório oficial do Meu Camp: a torii em retícula. A geometria vive só em `torii-shape.ts`
// (a mesma do hero de /experiencia); aqui ela vira máscara de um campo de pontos, então não há SVG copiado.
const [VB_X, VB_Y, VB_W, VB_H] = TORII_SHAPE.viewBox
export const TORII_ASPECT = VB_W / VB_H

export type ToriiMarkProps = Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'children'> & {
  /** `lattice` imprime em pontos; `solid` é a variante vetorial cheia, para tamanhos muito pequenos. */
  variant?: 'lattice' | 'solid'
  /** Largura renderizada em px de CSS, usada para dimensionar os pontos. Em SVG aninhado, informe-a. */
  pixelWidth?: number
  /** Distância entre os centros dos pontos, em px de CSS. Por padrão acompanha o tamanho; a silhueta não muda. */
  dotGapPx?: number
}

export default function ToriiMark({ variant = 'lattice', pixelWidth, dotGapPx: dotGapProp, ...svgProps }: ToriiMarkProps) {
  const uid = useId().replace(/:/g, '')
  const maskId = `torii-mask-${uid}`
  const patternId = `torii-dots-${uid}`
  const widthPx = pixelWidth ?? (typeof svgProps.width === 'number' ? svgProps.width : Number(svgProps.width) || 100)
  // Densidade proporcional ao tamanho: ~4% da largura, entre 1,2 e 3 px, para a silhueta continuar legível em tamanhos pequenos.
  const dotGapPx = dotGapProp ?? Math.min(3, Math.max(1.2, widthPx * 0.04))
  const gap = (dotGapPx / widthPx) * VB_W

  const parts = TORII_SHAPE.paths.map((part) =>
    part.stroke ? (
      <path key={part.d} d={part.d} fill="none" stroke="currentColor" strokeWidth={part.stroke} />
    ) : (
      <path key={part.d} d={part.d} fill="currentColor" />
    ),
  )

  return (
    <svg viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`} fill="none" aria-hidden="true" focusable="false" {...svgProps}>
      {variant === 'solid' ? (
        parts
      ) : (
        <>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x={VB_X} y={VB_Y} width={VB_W} height={VB_H}>
              <g style={{ color: '#fff' }}>{parts}</g>
            </mask>
            <pattern id={patternId} patternUnits="userSpaceOnUse" x={VB_X} y={VB_Y} width={gap} height={gap}>
              <circle cx={gap / 2} cy={gap / 2} r={gap * 0.47} fill="currentColor" />
            </pattern>
          </defs>
          <rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} fill={`url(#${patternId})`} mask={`url(#${maskId})`} />
        </>
      )}
    </svg>
  )
}
