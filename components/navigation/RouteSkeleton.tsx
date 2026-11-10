import EnsoSpinner from './EnsoSpinner'

// Skeleton localizado do conteúdo (a navbar e o rodapé já estão na tela). Altura mínima evita salto de layout.
export default function RouteSkeleton() {
  return (
    <main aria-busy="true" aria-label="Carregando" className="mx-auto min-h-[60vh] max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <div role="status" className="mc-enso-wrap flex flex-col items-center gap-1 pb-2 text-mc-structure">
        <EnsoSpinner size={76} />
        <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-text-secondary">Abrindo…</p>
      </div>
      <div className="mc-skeleton h-8 w-56" />
      <div className="mc-skeleton h-4 w-80 max-w-full" />
      <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="mc-skeleton h-40" />
        <div className="mc-skeleton h-40" />
        <div className="mc-skeleton h-40 sm:col-span-2 lg:col-span-1" />
      </div>
    </main>
  )
}
