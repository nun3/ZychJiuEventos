import { PageContainer } from '@/components/ui/PageContainer'

export function HomePlatformSection() {
  return (
    <section className="border-y border-mc-border bg-mc-surface-secondary py-mc-48 sm:py-mc-64" aria-labelledby="platform-title">
      <PageContainer className="grid gap-mc-32 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-mc-64">
        <div>
          <p className="font-mc-interface text-sm font-semibold uppercase tracking-[0.16em] text-mc-action">
            MEU CAMP
          </p>
          <h2 id="platform-title" className="mt-mc-8 font-mc-display text-3xl font-semibold leading-tight text-mc-text-primary sm:text-mc-h1">
            A competição conecta todo mundo.
          </h2>
        </div>
        <div className="divide-y divide-mc-border border-y border-mc-border">
          <div className="grid gap-mc-8 py-mc-24 sm:grid-cols-[9rem_1fr] sm:gap-mc-24">
            <h3 className="font-mc-interface font-semibold text-mc-text-primary">Atletas</h3>
            <p className="font-mc-interface leading-6 text-mc-text-secondary">Encontram eventos, realizam inscrições e acompanham sua participação.</p>
          </div>
          <div className="grid gap-mc-8 py-mc-24 sm:grid-cols-[9rem_1fr] sm:gap-mc-24">
            <h3 className="font-mc-interface font-semibold text-mc-text-primary">Professores</h3>
            <p className="font-mc-interface leading-6 text-mc-text-secondary">Gerenciam a equipe, inscrevem atletas e acompanham a checagem pública.</p>
          </div>
          <div className="grid gap-mc-8 py-mc-24 sm:grid-cols-[9rem_1fr] sm:gap-mc-24">
            <h3 className="font-mc-interface font-semibold text-mc-text-primary">Responsáveis</h3>
            <p className="font-mc-interface leading-6 text-mc-text-secondary">Cuidam do cadastro e das inscrições dos atletas sob sua responsabilidade.</p>
          </div>
          <div className="grid gap-mc-8 py-mc-24 sm:grid-cols-[9rem_1fr] sm:gap-mc-24">
            <h3 className="font-mc-interface font-semibold text-mc-text-primary">Organizadores</h3>
            <p className="font-mc-interface leading-6 text-mc-text-secondary">Conduzem eventos, inscrições, chaves e pagamentos em uma única plataforma.</p>
          </div>
        </div>
      </PageContainer>
    </section>
  )
}
