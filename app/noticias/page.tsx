import type { Metadata } from 'next'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import InstitutionalPage from '@/components/InstitutionalPage'
import { EmptyState } from '@/components/ui/EmptyState'

export const metadata: Metadata = {
  title: 'Notícias | Meu Camp',
  description: 'Notícias e atualizações do MEU CAMP. Área editorial em preparação.',
}

export default function NoticiasPage() {
  return (
    <InstitutionalPage
      eyebrow="Notícias"
      title="Acompanhe o esporte e a plataforma."
      description="Esta área editorial reunirá notícias do MEU CAMP, acontecimentos dos campeonatos e atualizações relevantes. Ainda não há publicações."
      actions={(
        <Link href="/eventos" className="inline-flex min-h-12 items-center justify-center rounded-mc-medium bg-mc-action px-mc-24 font-mc-interface font-semibold text-white transition-colors hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">
          Ver campeonatos
        </Link>
      )}
    >
      <EmptyState
        icon={<Newspaper size={32} />}
        title="Nenhuma notícia publicada"
        description="Quando houver conteúdo editorial, ele aparecerá aqui. Enquanto isso, acompanhe o calendário de competições."
        action={(
          <Link href="/eventos" className="inline-flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline">
            Abrir calendário público
          </Link>
        )}
        className="rounded-mc-medium border border-mc-border bg-mc-surface"
      />
    </InstitutionalPage>
  )
}
