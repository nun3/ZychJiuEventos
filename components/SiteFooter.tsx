'use client'

import { useEffect, useState } from 'react'
import HalftoneWordmarkFooter, { type HalftonePreset } from '@/components/ui/halftone-wordmark-footer'
import {
  MEUCAMP_FOOTER_COLUMNS,
  MEUCAMP_FOOTER_FONT_FAMILY,
  MEUCAMP_FOOTER_FONT_WEIGHT,
  MEUCAMP_FOOTER_LABEL,
  MEUCAMP_FOOTER_PALETTE,
  MEUCAMP_FOOTER_WORDMARK,
  meucampFooterMeta,
} from '@/lib/footer/meucamp-footer'

/**
 * Rodapé Halftone da plataforma (Home e demais páginas, via ModernFooter). O canvas não enxerga variáveis CSS, e o next/font dá à Space Grotesk um nome gerado:
 * lemos a lista de famílias real em `--font-space-grotesk` e a passamos ao componente, que refaz a palavra nessa fonte.
 */
export function SiteFooter({ preset, height }: { preset?: HalftonePreset; height?: string }) {
  const [fontFamily, setFontFamily] = useState(MEUCAMP_FOOTER_FONT_FAMILY)

  useEffect(() => {
    const generated = getComputedStyle(document.documentElement).getPropertyValue('--font-space-grotesk').trim()
    if (generated) setFontFamily(`${generated}, ${MEUCAMP_FOOTER_FONT_FAMILY}`)
  }, [])

  return (
    <HalftoneWordmarkFooter
      wordmark={MEUCAMP_FOOTER_WORDMARK}
      label={MEUCAMP_FOOTER_LABEL}
      meta={meucampFooterMeta()}
      columns={MEUCAMP_FOOTER_COLUMNS}
      fontFamily={fontFamily}
      fontWeight={MEUCAMP_FOOTER_FONT_WEIGHT}
      // Sem preset: a paleta própria da Home. Com preset (só para comparação), valem as cores dele.
      preset={preset}
      palette={preset ? undefined : MEUCAMP_FOOTER_PALETTE}
      height={height}
    />
  )
}
