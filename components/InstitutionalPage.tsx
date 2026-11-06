import type { ReactNode } from 'react'
import Image from 'next/image'
import ModernFooter from '@/components/ModernFooter'
import ModernNavbar from '@/components/ModernNavbar'
import { PageContainer } from '@/components/ui/PageContainer'

export default function InstitutionalPage({
  eyebrow,
  title,
  titleLines,
  description,
  actions,
  imageSrc = '/images/cinematic/dojo-wide.jpg',
  caption,
  children,
}: {
  eyebrow: string
  title: string
  titleLines?: string[]
  description: string
  actions?: ReactNode
  imageSrc?: string
  caption?: string
  children: ReactNode
}) {
  const lines = titleLines?.length ? titleLines : [title]
  return (
    <main id="conteudo-principal" className="min-h-screen overflow-x-clip bg-mc-background">
      <ModernNavbar overlayAtTop />

      <section
        aria-labelledby="institutional-title"
        className="relative flex min-h-[100svh] items-center bg-mc-nav-dark pb-10 pt-24 text-white lg:py-24"
      >
        <div className="grid w-full items-stretch gap-8 px-4 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:px-12 xl:gap-16 xl:px-20">
          <div
            data-mc-visual
            className="relative isolate flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-mc-large border border-white/10 bg-mc-structure p-6 sm:p-8 lg:min-h-[calc(100svh-7.5rem)] lg:p-10"
          >
            <div data-mc-hero-media className="absolute inset-0 -z-10 will-change-transform">
              <Image src={imageSrc} alt="" fill priority sizes="(min-width: 1024px) 52vw, 94vw" className="object-cover" />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-mc-nav-dark via-mc-nav-dark/55 to-mc-nav-dark/20"
              />
            </div>

            <p className="font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.2em] text-blue-200">
              {eyebrow}
            </p>
            <h1
              id="institutional-title"
              aria-label={title}
              className="my-auto py-8 font-mc-display text-[9vw] font-bold leading-[0.9] tracking-[-0.04em] sm:text-5xl lg:text-[clamp(2.5rem,3.5vw,3.85rem)]"
            >
              {lines.map((line) => (
                <span key={line} className="-mb-[0.1em] block overflow-hidden pb-[0.1em]">
                  <span data-mc-line className="block will-change-transform">
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            {caption ? (
              <p className="font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.16em] text-white/70">
                {caption}
              </p>
            ) : (
              <span />
            )}
          </div>

          <div
            data-mc-panel
            className="flex flex-col justify-center rounded-mc-large border border-mc-border bg-mc-surface p-mc-24 text-mc-text-primary shadow-mc-elevated sm:p-mc-32 lg:p-mc-48"
          >
            <p className="font-mc-interface text-lg leading-7 text-mc-text-secondary">
              {description}
            </p>
            {actions ? <div className="mt-mc-24 flex flex-col gap-mc-12 sm:flex-row">{actions}</div> : null}
          </div>
        </div>
      </section>

      <PageContainer className="py-mc-48 sm:py-mc-64">{children}</PageContainer>
      <ModernFooter />
    </main>
  )
}
