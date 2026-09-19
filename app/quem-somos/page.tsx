import type { Metadata } from 'next'
import Link from 'next/link'
import InstitutionalPage from '@/components/InstitutionalPage'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Quem somos | Meu Camp',
  description: 'O MEU CAMP é a plataforma para organizar e operar competições, começando pelo Jiu-Jitsu.',
}

export default function QuemSomosPage() {
  return (
    <InstitutionalPage
      eyebrow="Quem somos"
      title="MEU CAMP existe para a competição acontecer."
      description="Somos uma plataforma de operação esportiva. A primeira modalidade é Jiu-Jitsu. A marca e a arquitetura foram feitas para crescer para outros esportes de combate, sem transformar o produto em SaaS genérico."
      actions={(
        <>
          <Link href="/sistema" className="inline-flex min-h-12 items-center justify-center rounded-mc-medium bg-mc-action px-mc-24 font-mc-interface font-semibold text-white transition-colors hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">
            Conhecer o sistema
          </Link>
          <Link href="/academias" className="inline-flex min-h-12 items-center justify-center rounded-mc-medium border border-white/60 px-mc-24 font-mc-interface font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">
            Para academias
          </Link>
        </>
      )}
    >
      <div className="grid gap-mc-24 lg:grid-cols-3">
        <Card className="p-mc-16 sm:p-mc-24">
          <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Competição antes de SaaS</h2>
          <p className="mt-mc-12 font-mc-interface leading-6 text-mc-text-secondary">
            O centro do produto é o evento: inscrição, checagem, chave, área, resultado e fechamento. Ferramentas existem para servir a luta, não o contrário.
          </p>
        </Card>
        <Card className="p-mc-16 sm:p-mc-24">
          <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Confiança operacional</h2>
          <p className="mt-mc-12 font-mc-interface leading-6 text-mc-text-secondary">
            Quem entra no tatame precisa de dados corretos. Snapshot, lock, baixa manual e papéis claros existem para a operação não depender de improviso.
          </p>
        </Card>
        <Card className="p-mc-16 sm:p-mc-24">
          <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Esporte com clareza</h2>
          <p className="mt-mc-12 font-mc-interface leading-6 text-mc-text-secondary">
            A interface deve parecer profissional e esportiva. Sem estética de federação antiga, fintech ou produto gerado para impressionar.
          </p>
        </Card>
      </div>

      <section className="mt-mc-48 max-w-3xl" aria-labelledby="about-now-title">
        <h2 id="about-now-title" className="font-mc-display text-mc-h2 text-mc-text-primary">O momento atual</h2>
        <p className="mt-mc-12 font-mc-interface leading-6 text-mc-text-secondary">
          O primeiro go-live é operação assistida: o organizador conduz o evento real no MEU CAMP, com cobrança por baixa manual.
          Placar, cronômetro, chamada ao vivo e aplicativo nativo não fazem parte desta etapa.
        </p>
      </section>
    </InstitutionalPage>
  )
}
