const PREVIEW = [
  {
    id: 'preview-pato-branco',
    title: 'Copa Pato Branco de Jiu-Jitsu',
    dateObj: '2026-12-15',
    location: 'Pato Branco/PR',
    image: '/images/cinematic/karate-1.jpg',
  },
  {
    id: 'preview-open-litoral',
    title: 'Open Litoral de Jiu-Jitsu',
    dateObj: '2027-02-14',
    location: 'Florianópolis/SC',
    image: '/images/cinematic/mc-arena.jpg',
  },
  {
    id: 'preview-copa-curitiba',
    title: 'Copa Curitiba de Jiu-Jitsu',
    dateObj: '2027-04-18',
    location: 'Curitiba/PR',
    image: '/images/cinematic/dojo-wide.jpg',
  },
] as const

/** Três campeonatos fictícios para ensaiar a abertura. Não são gravados nem publicados. */
export function getCinematicPreviewEvents(now = new Date()) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' })
  const full = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

  return PREVIEW.map((event) => {
    const date = new Date(`${event.dateObj}T12:00:00Z`)
    return {
      id: event.id,
      title: event.title,
      type: 'Campeonato Jiu-Jitsu',
      eventType: 'Campeonato',
      sport: 'Jiu-Jitsu',
      state: event.location.match(/\/([A-Z]{2})$/)?.[1] || 'Todos',
      date: day.format(date),
      dateFull: full.format(date),
      dateObj: event.dateObj,
      location: event.location,
      daysLeft: Math.max(0, Math.ceil((date.getTime() - today.getTime()) / 86400000)),
      image: event.image,
      status: 'publicado',
      href: `/eventos/${event.id}`,
      description: 'Campeonato fictício usado apenas para ensaiar a apresentação.',
    }
  })
}

/** Página de ensaio só existe no development. Em produção o id fictício não resolve. */
export function getDevelopmentPreviewEvent(id: string, env = process.env.NODE_ENV) {
  if (env !== 'development' || !id.startsWith('preview-')) return null
  return getCinematicPreviewEvents().find((event) => event.id === id) ?? null
}
