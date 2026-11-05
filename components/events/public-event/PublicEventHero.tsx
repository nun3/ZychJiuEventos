import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

const heroButton = 'inline-flex min-h-12 items-center justify-center bg-white px-6 font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-200 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-nav-dark'

export function PublicEventHero({
  title,
  imageUrl,
  statusLabel,
  meta,
  note,
  actions,
  share,
}: {
  title: string
  imageUrl?: string | null
  statusLabel: string
  meta: string
  note?: string
  actions?: ReactNode
  share?: ReactNode
}) {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-mc-nav-dark text-white">
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill priority sizes="100vw" className="object-cover object-center" />
      ) : null}
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(var(--mc-nav-dark)/0.84),rgb(var(--mc-nav-dark)/0.28)_68%)]" />
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 px-4 py-6 sm:px-8 lg:px-12">
        <Link
          href="/eventos"
          className="inline-flex min-h-12 items-center gap-2 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-white/80 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Eventos
        </Link>
        {share}
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-28 text-center sm:px-10">
        <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.16em] text-white">
          <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 bg-mc-action" />
          {statusLabel}
        </p>
        <h1 className="mt-4 font-mc-display text-[clamp(2rem,5vw,4.25rem)] font-bold uppercase leading-[0.92] tracking-[-0.03em]">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl font-mc-interface text-sm leading-6 text-white/85 sm:text-base">{meta}</p>
        {actions ? <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">{actions}</div> : null}
        {note ? <p className="mt-5 max-w-md font-mc-interface text-xs leading-5 text-white/70">{note}</p> : null}
      </div>
    </section>
  )
}

export function PublicHeroLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith('#')) {
    return <a href={href} className={heroButton}>{children}</a>
  }
  return <Link href={href} className={heroButton}>{children}</Link>
}
