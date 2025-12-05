import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import EventFilters from '@/components/EventFilters'
import ModernEventGrid from '@/components/ModernEventGrid'

const resultados = [
  'Aprovados Curso de Arbitragem CBJJC',
  'Grand Slam FCJJE NO-GI - 10ª Etapa do Estadual',
  'Grand Slam FCJJE GI - 10ª Etapa do Estadual',
  'Copa Alegre de Jiu-Jitsu - 8ª Etapa FCJJE',
  'Maranhão Open Jiu-Jitsu',
  'I Copa do Mundo de Jiu-Jitsu',
]

const ranking = [
  { pos: 1, nome: 'FEIJES 2024' },
  { pos: 2, nome: 'CBJJE 2024' },
  { pos: 3, nome: 'CBLP 2024' },
  { pos: 4, nome: 'Sul-Americano Gi 2024' },
]

export default function DashboardHome() {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ModernNavbar />
      <div className="pt-20">
        <section className="container mx-auto grid gap-8 px-6 py-10 lg:grid-cols-[2.2fr,1fr]">
          <div>
            <EventFilters />
            <ModernEventGrid />
          </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">Resultados</h2>
            </div>
            <ul className="space-y-3 px-5 py-4 text-sm text-gray-700">
              {resultados.map((item) => (
                <li key={item} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">Ranking</h2>
            </div>
            <ul className="space-y-2 px-5 py-4 text-sm text-gray-700">
              {ranking.map((item) => (
                <li key={item.pos} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    #{item.pos.toString().padStart(2, '0')}
                  </span>
                  <span>{item.nome}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
      </div>
      <ModernFooter />
    </main>
  )
}

