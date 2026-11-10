import { BELT_COLORS, MAX_GRAU, beltLabel, type BeltInfo } from '@/lib/athletes/belt'

/**
 * Faixa circular: a cor é a da faixa e as barras claras ao lado são os graus (0 a 4).
 * Decorativa por si só; quem usa dá o nome acessível ao controle.
 */
export function BeltBadge({ belt, grau, size = 32 }: BeltInfo & { size?: number }) {
  const { fill, stroke } = BELT_COLORS[belt]
  const light = belt === 'branca' || belt === 'amarela' || belt === 'cinza' || belt === 'laranja'
  const bar = light ? '#111827' : '#ffffff'
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={beltLabel({ belt, grau })} focusable="false">
      <circle cx="16" cy="16" r="14.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
            <defs><clipPath id="belt-badge-clip"><circle cx="16" cy="16" r="14.5" /></clipPath></defs>
      {/* tarja central da faixa */}
      <g clipPath="url(#belt-badge-clip)"><rect x="1.5" y="10.2" width="29" height="11.6" fill={fill} stroke={stroke} strokeWidth="1" /></g>
      {Array.from({ length: Math.min(grau, MAX_GRAU) }, (_, i) => (
        <rect key={i} x={17.6 + i * 3.1} y="11.4" width="2" height="9.2" rx="0.4" fill={bar} />
      ))}
    </svg>
  )
}
