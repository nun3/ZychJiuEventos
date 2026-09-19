import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList, GraduationCap, ShieldCheck, UsersRound } from 'lucide-react'
import InstitutionalPage from '@/components/InstitutionalPage'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Academias e equipes | Meu Camp',
  description: 'Como professores, academias e responsáveis usam o MEU CAMP para gerenciar atletas e inscrições.',
}

const uses = [
  {
    icon: UsersRound,
    title: 'Equipe e atletas',
    description: 'O professor cadastral cria a equipe, cadastra atletas vinculados e mantém faixa, peso e dados usados na inscrição.',
  },
  {
    icon: ClipboardList,
    title: 'Inscrições acompanhadas',
    description: 'Inscreva atletas em eventos publicados, reserve o pagamento e acompanhe a situação de cada inscrição.',
  },
  {
    icon: ShieldCheck,
    title: 'Checagem e programação',
    description: 'Quando o evento abre a checagem pública, a equipe consulta quem está confirmado e a programação das lutas.',
  },
  {
    icon: GraduationCap,
    title: 'Professor operacional',
    description: 'Na inscrição, o professor operacional do atleta fica registrado para a operação do evento. É um vínculo daquela inscrição, não um cargo da organização.',
  },
]

export default function AcademiasPage() {
  return (
    <InstitutionalPage
      eyebrow="Para academias e equipes"
      title="Sua equipe chega na competição organizada."
      description="O MEU CAMP não é um sistema de mensalidade, catraca ou CRM de academia. É a ferramenta para o professor e o responsável conduzirem atletas até o evento — e acompanharem o que acontece no dia."
      actions={(
        <>
          <Link href="/login?mode=register" className="inline-flex min-h-12 items-center justify-center rounded-mc-medium bg-mc-action px-mc-24 font-mc-interface font-semibold text-white transition-colors hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">
            Criar conta
          </Link>
          <Link href="/eventos" className="inline-flex min-h-12 items-center justify-center rounded-mc-medium border border-white/60 px-mc-24 font-mc-interface font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">
            Ver eventos
          </Link>
        </>
      )}
    >
      <div className="grid gap-mc-24 md:grid-cols-2">
        {uses.map((item) => (
          <Card key={item.title} className="p-mc-16 sm:p-mc-24">
            <item.icon aria-hidden="true" size={22} className="text-mc-action" />
            <h2 className="mt-mc-16 font-mc-display text-mc-h3 text-mc-text-primary">{item.title}</h2>
            <p className="mt-mc-8 font-mc-interface leading-6 text-mc-text-secondary">{item.description}</p>
          </Card>
        ))}
      </div>

      <section className="mt-mc-48 max-w-3xl" aria-labelledby="academias-limits-title">
        <h2 id="academias-limits-title" className="font-mc-display text-mc-h2 text-mc-text-primary">O que esta página não promete</h2>
        <p className="mt-mc-12 font-mc-interface leading-6 text-mc-text-secondary">
          Gestão financeira da academia, mensalidade, catraca, aplicativo nativo e CRM ficam fora do MEU CAMP.
          O produto começa na equipe e termina na competição.
        </p>
      </section>
    </InstitutionalPage>
  )
}
