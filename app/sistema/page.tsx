import type { Metadata } from 'next'
import Link from 'next/link'
import InstitutionalPage from '@/components/InstitutionalPage'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'O sistema | Meu Camp',
  description: 'Como o MEU CAMP conduz um evento: da criação das categorias ao fechamento financeiro.',
}

const journey = [
  { step: '1', title: 'Criar o evento', text: 'O organizador define dados, categorias e a duração oficial das lutas.' },
  { step: '2', title: 'Receber inscrições', text: 'Atletas, professores e responsáveis inscrevem com snapshot da categoria e do professor operacional.' },
  { step: '3', title: 'Checar atletas', text: 'A checagem confirma quem está apto. Depois do lock, a operação segue para as chaves.' },
  { step: '4', title: 'Montar chaves', text: 'As chaves usam as topologias já aprovadas do evento, inclusive walkover quando couber.' },
  { step: '5', title: 'Organizar áreas', text: 'A programação distribui lutas nas áreas, com duração e ordem operacional.' },
  { step: '6', title: 'Conduzir e registrar', text: 'Resultados, pesagem operacional do grupo e premiação fecham a chave.' },
  { step: '7', title: 'Concluir o evento', text: 'O financeiro registra a baixa e o fechamento com a taxa da plataforma.' },
]

const capabilities = [
  'Eventos e categorias',
  'Inscrições com snapshot',
  'Pagamento reservado e baixa manual',
  'Checagem e lock',
  'Chaves e walkover',
  'Áreas e programação',
  'Resultados',
  'Duração oficial da luta',
  'Pesagem operacional',
  'Premiação',
  'Fechamento financeiro',
]

export default function SistemaPage() {
  return (
    <InstitutionalPage
      eyebrow="O sistema"
      title="A competição inteira, do cadastro ao fechamento."
      description="O MEU CAMP organiza a operação de um evento de Jiu-Jitsu. Não é placar, cronômetro, chamada ao vivo nem aplicativo nativo. É a plataforma que o organizador usa para conduzir o campeonato com clareza."
      actions={(
        <>
          <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-mc-medium bg-mc-action px-mc-24 font-mc-interface font-semibold text-white transition-colors hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">
            Entrar
          </Link>
          <Link href="/eventos" className="inline-flex min-h-12 items-center justify-center rounded-mc-medium border border-white/60 px-mc-24 font-mc-interface font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">
            Ver calendário
          </Link>
        </>
      )}
    >
      <section aria-labelledby="journey-title">
        <h2 id="journey-title" className="font-mc-display text-mc-h2 text-mc-text-primary">Jornada do evento</h2>
        <ol className="mt-mc-24 grid gap-mc-16 md:grid-cols-2">
          {journey.map((item) => (
            <li key={item.step}>
              <Card className="h-full p-mc-16 sm:p-mc-24">
                <p className="font-mc-interface text-sm font-semibold text-mc-action">Etapa {item.step}</p>
                <h3 className="mt-mc-8 font-mc-display text-lg font-semibold text-mc-text-primary">{item.title}</h3>
                <p className="mt-mc-8 font-mc-interface leading-6 text-mc-text-secondary">{item.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-mc-48" aria-labelledby="capabilities-title">
        <h2 id="capabilities-title" className="font-mc-display text-mc-h2 text-mc-text-primary">O que o sistema já faz</h2>
        <ul className="mt-mc-24 grid gap-mc-12 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => (
            <li key={item} className="rounded-mc-medium border border-mc-border bg-mc-surface px-mc-16 py-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </InstitutionalPage>
  )
}
