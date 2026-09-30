import Link from 'next/link'
import type { ProfileJourney } from '@/lib/profile/profile-journey'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00Z`))
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <li className="rounded-mc-medium bg-mc-surface-secondary px-mc-16 py-mc-16">
      <p className="font-mc-display text-3xl font-semibold text-mc-structure">{value}</p>
      <p className="mt-mc-4 font-mc-interface text-xs font-semibold uppercase tracking-[0.12em] text-mc-text-secondary">
        {label}
      </p>
    </li>
  )
}

export default function ProfileJourneySection({ journey }: { journey: ProfileJourney }) {
  return (
    <section aria-labelledby="journey-title" className="rounded-mc-large border border-mc-border bg-mc-surface p-mc-16 sm:p-mc-24">
      <h2 id="journey-title" className="font-mc-display text-mc-h3 text-mc-text-primary">
        Minha jornada
      </h2>
      <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
        Histórico automático da sua trajetória no MEU CAMP. Sem edição manual.
      </p>

      {journey.empty ? (
        <div className="mt-mc-16 rounded-mc-medium bg-mc-surface-secondary px-mc-16 py-mc-24 text-center sm:text-left">
          <p className="font-mc-display text-lg font-semibold text-mc-text-primary">{journey.emptyMessage}</p>
          <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">{journey.emptyHint}</p>
          <Link
            href="/eventos"
            className="mt-mc-16 inline-flex min-h-11 items-center rounded-mc-medium bg-mc-action px-mc-16 font-mc-interface text-sm font-semibold text-white hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
          >
            Ver eventos
          </Link>
        </div>
      ) : null}

      {journey.sports && !journey.empty ? (
        <div className="mt-mc-20">
          <h3 className="font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
            Jornada esportiva
          </h3>
          <ul className="mt-mc-12 grid grid-cols-2 gap-mc-12 sm:grid-cols-3">
            <Metric value={journey.sports.championships} label="Campeonatos" />
            {journey.sports.podiums > 0 ? <Metric value={journey.sports.podiums} label="Pódios" /> : null}
            {journey.sports.gold > 0 ? <Metric value={journey.sports.gold} label="Ouros" /> : null}
            {journey.sports.silver > 0 ? <Metric value={journey.sports.silver} label="Pratas" /> : null}
            {journey.sports.bronze > 0 ? <Metric value={journey.sports.bronze} label="Bronzes" /> : null}
          </ul>

          {journey.sports.upcoming.length > 0 ? (
            <div className="mt-mc-20">
              <h3 className="font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
                Próximas participações
              </h3>
              <ul className="mt-mc-12 space-y-mc-12">
                {journey.sports.upcoming.map((item) => (
                  <li key={item.eventId} className="rounded-mc-medium border border-mc-border px-mc-16 py-mc-12">
                    <p className="font-mc-interface text-sm font-semibold text-mc-text-primary">{item.name}</p>
                    <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">
                      {formatDate(item.date)} · {item.local}
                    </p>
                    {item.teamName ? (
                      <p className="mt-mc-4 font-mc-interface text-xs text-mc-text-secondary">Equipe: {item.teamName}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {journey.sports.recent.length > 0 ? (
            <div className="mt-mc-20">
              <h3 className="font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
                Últimos campeonatos
              </h3>
              <ul className="mt-mc-12 space-y-mc-12">
                {journey.sports.recent.map((item) => (
                  <li key={item.eventId} className="rounded-mc-medium border border-mc-border px-mc-16 py-mc-12">
                    <div className="flex flex-wrap items-baseline justify-between gap-mc-8">
                      <p className="font-mc-interface text-sm font-semibold text-mc-text-primary">{item.name}</p>
                      {item.place ? (
                        <span className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-structure">
                          {item.place}º · {item.medal}
                        </span>
                      ) : (
                        <span className="font-mc-interface text-xs text-mc-text-secondary">Participou</span>
                      )}
                    </div>
                    <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">
                      {formatDate(item.date)} · {item.local}
                    </p>
                    {item.teamName ? (
                      <p className="mt-mc-4 font-mc-interface text-xs text-mc-text-secondary">Equipe: {item.teamName}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {journey.sports.timeline.length > 0 ? (
            <div className="mt-mc-20">
              <h3 className="font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
                Minha história no MEU CAMP
              </h3>
              <ol className="mt-mc-12 space-y-mc-12 border-l border-mc-border pl-mc-16">
                {journey.sports.timeline.map((item) => (
                  <li key={item.key} className="relative">
                    <span className="absolute -left-[1.28rem] top-1.5 h-2.5 w-2.5 rounded-full bg-mc-action" aria-hidden="true" />
                    <p className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
                      {formatDate(item.date)}
                    </p>
                    <p className="mt-mc-4 font-mc-interface text-sm font-semibold text-mc-text-primary">{item.title}</p>
                    <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">{item.subtitle}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}

      {journey.operations && (journey.operations.managedAthletes > 0 || journey.operations.eventsOrganized > 0 || journey.operations.championshipsWithAthletes > 0) ? (
        <div className="mt-mc-20">
          <h3 className="font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
            Minha atuação
          </h3>
          <ul className="mt-mc-12 grid grid-cols-2 gap-mc-12 sm:grid-cols-3">
            {journey.operations.managedAthletes > 0 || journey.operations.championshipsWithAthletes > 0 ? (
              <Metric value={journey.operations.managedAthletes} label="Atletas gerenciados" />
            ) : null}
            {journey.operations.championshipsWithAthletes > 0 ? (
              <Metric value={journey.operations.championshipsWithAthletes} label="Campeonatos com atletas" />
            ) : null}
            {journey.operations.eventsOrganized > 0 ? (
              <Metric value={journey.operations.eventsOrganized} label="Eventos organizados" />
            ) : null}
            {journey.operations.eventsCompleted > 0 ? (
              <Metric value={journey.operations.eventsCompleted} label="Eventos concluídos" />
            ) : null}
          </ul>
          {journey.operations.nextOrganizedEvent ? (
            <div className="mt-mc-12 rounded-mc-medium border border-mc-border px-mc-16 py-mc-12">
              <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.12em] text-mc-text-secondary">
                Próximo evento
              </p>
              <p className="mt-mc-4 font-mc-interface text-sm font-semibold text-mc-text-primary">
                {journey.operations.nextOrganizedEvent.name}
              </p>
              <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">
                {formatDate(journey.operations.nextOrganizedEvent.date)} · {journey.operations.nextOrganizedEvent.local}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
