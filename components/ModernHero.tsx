import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageContainer } from '@/components/ui/PageContainer'

export default function ModernHero() {
  return (
    <section className="relative isolate overflow-hidden bg-mc-structure pt-20 text-white">
      <Image
        src="/images/home1.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-mc-structure/85" aria-hidden="true" />

      <PageContainer className="flex min-h-[520px] items-end py-mc-48 sm:min-h-[560px] sm:items-center sm:py-mc-64 lg:min-h-[600px]">
        <div className="max-w-3xl">
          <p className="font-mc-interface text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
            Competições esportivas em um só lugar
          </p>
          <h1 className="mt-mc-16 font-mc-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-mc-display">
            Sua competição acontece aqui.
          </h1>
          <p className="mt-mc-16 max-w-2xl font-mc-interface text-lg leading-7 text-slate-200 sm:text-xl sm:leading-8">
            Encontre eventos, faça inscrições e acompanhe sua participação. Organizadores contam com uma plataforma para conduzir cada etapa da competição.
          </p>
          <p className="mt-mc-12 font-mc-interface text-sm font-medium text-slate-300">
            Para atletas, responsáveis e organizadores de eventos.
          </p>

          <div className="mt-mc-32 flex flex-col gap-mc-12 sm:flex-row">
            <Link
              href="#eventos"
              className="inline-flex min-h-12 items-center justify-center gap-mc-8 rounded-mc-medium bg-mc-action px-mc-24 font-mc-interface text-base font-semibold text-white transition-colors duration-mc-normal hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure"
            >
              Ver eventos disponíveis
              <ArrowRight aria-hidden="true" size={19} />
            </Link>
            <Link
              href="/admin/autenticacao"
              className="inline-flex min-h-12 items-center justify-center rounded-mc-medium border border-white/60 bg-white/10 px-mc-24 font-mc-interface text-base font-semibold text-white transition-colors duration-mc-normal hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure"
            >
              Organizar um evento
            </Link>
          </div>
        </div>
      </PageContainer>
    </section>
  )
}
