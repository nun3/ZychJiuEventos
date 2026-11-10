import ModernNavbar from '@/components/ModernNavbar'
import EnsoSpinner from '@/components/navigation/EnsoSpinner'

/**
 * Estado de espera das páginas públicas do evento (loading.tsx): aparece na hora do clique, com a navbar já no lugar,
 * a faixa escura de abas reservada (sem salto de layout) e o indicador Enso BJJ.
 */
export default function EventRouteLoading({ label = 'Abrindo…' }: { label?: string }) {
  return (
    <main id="conteudo-principal" aria-busy="true" className="min-h-screen bg-mc-background">
      <ModernNavbar />
      <div className="pt-16">
        <div aria-hidden="true" className="h-12 border-b border-white/10 bg-mc-nav-dark" />
      </div>
      <div className="w-full px-4 pb-16 pt-10 sm:px-8 lg:px-12 xl:px-20">
        <div role="status" className="mc-enso-wrap flex flex-col items-center gap-1 pb-6 text-mc-structure">
          <EnsoSpinner size={76} />
          <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-text-secondary">{label}</p>
        </div>
        <div className="mc-skeleton h-10 w-72 max-w-full" />
        <div className="mc-skeleton mt-4 h-4 w-96 max-w-full" />
        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,72fr)_minmax(19rem,28fr)]">
          <div className="mc-skeleton h-64" />
          <div className="mc-skeleton h-64" />
        </div>
      </div>
    </main>
  )
}
