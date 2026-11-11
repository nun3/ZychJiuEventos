'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import HalftoneWordmarkFooter from '@/components/ui/halftone-wordmark-footer'
import { TORII_SHAPE } from '@/components/home-cinematic/torii-shape'
import { MEUCAMP_FOOTER_FONT_FAMILY, MEUCAMP_FOOTER_FONT_WEIGHT } from '@/lib/footer/meucamp-footer'

// Abertura da home: torii em retícula de partículas (o mesmo campo de pontos do rodapé), sem as colunas de links.
// O canvas não enxerga variáveis CSS, então lemos a família real da Space Grotesk, como o SiteFooter faz.
const PALETTE = { background: '#ffffff', ink: '#0f172a', warm: '#2563eb' }

export function HeroParticleWordmark() {
  const [fontFamily, setFontFamily] = useState(MEUCAMP_FOOTER_FONT_FAMILY)

  useEffect(() => {
    const generated = getComputedStyle(document.documentElement).getPropertyValue('--font-space-grotesk').trim()
    if (generated) setFontFamily(`${generated}, ${MEUCAMP_FOOTER_FONT_FAMILY}`)
  }, [])

  return (
    <section data-hero aria-label="MEU CAMP" className="relative isolate mt-16 h-[calc(100svh-4rem)] min-h-[520px] overflow-hidden bg-white text-mc-text-primary">
      <HalftoneWordmarkFooter
        wordmark="Torii japonesa em retícula de partículas"
        shape={TORII_SHAPE}
        label="Meu Camp"
        meta="Passe o mouse ou toque na torii para interagir"
        columns={[]}
        backToTop={false}
        fontFamily={fontFamily}
        fontWeight={MEUCAMP_FOOTER_FONT_WEIGHT}
        palette={PALETTE}
        crop={0}
        align="center"
        widthFit={0.94}
        dotGap={5}
        height="calc(100svh - 4rem)"
        className="absolute inset-0"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 px-4 pb-10 text-center sm:pb-14">
        <p className="max-w-md font-mc-interface text-base leading-6 text-mc-text-secondary">
          A principal plataforma para organização e inscrições em eventos de lutas.
        </p>
        <Link
          href="/eventos"
          className="pointer-events-auto inline-flex min-h-12 items-center justify-center rounded-mc-small bg-mc-action px-6 font-mc-interface text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors duration-mc-normal hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
        >
          Ver eventos
        </Link>
      </div>
    </section>
  )
}
