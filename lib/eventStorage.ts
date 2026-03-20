// Utilitário para gerenciar eventos no localStorage (simulação de backend)

export interface StoredEvent {
  id: number
  codigo?: string
  titulo: string
  organizer: string
  apresentacao?: string
  infoCategorias?: string
  faixasEtarias?: string
  faixasGraduacao?: string
  categoriasPeso?: string
  atencaoAgrupamento?: string
  infoAbsoluto?: string
  obsAbsoluto?: string
  infoChecagem?: string
  infoChecagemDesafioKids?: string
  infoChecagemAbsoluto?: string
  infoChaves?: string
  infoPesagem?: string
  infoPremiacao?: string
  sistemaPontuacao?: string
  criterioDesempate?: string
  regrasFiscalizacao?: string
  integridadeSaude?: string
  direitoImagem?: string
  termoAceiteAtleta?: string
  termoAceiteResponsavel?: string
  financeiroInfo?: string
  emailDadosBancarios?: string
  valoresInscricaoEvento?: string
  bannerImage?: string // URL da imagem do banner (base64 ou URL)
  destaqueImage?: string // URL da imagem de destaque (base64 ou URL)
  createdAt: string
  publishedAt?: string
  status: 'draft' | 'published'
  // Campos adicionais para exibição na home
  type?: string
  eventType?: string
  sport?: string
  state?: string
  date?: string
  dateFull?: string
  dateObj?: Date
  location?: string
  daysLeft?: number
  description?: string
}

const STORAGE_KEY = 'meucamp_events'

// Gerar ID único baseado em timestamp
function generateId(): number {
  return Date.now()
}

// Converter File para base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Salvar evento
export function saveEvent(eventData: Partial<StoredEvent>): StoredEvent {
  const events = getAllEvents()
  const newEvent: StoredEvent = {
    id: eventData.id || generateId(),
    codigo: eventData.codigo || `EVT-${generateId()}`,
    titulo: eventData.titulo || 'Evento sem título',
    organizer: eventData.organizer || 'Organizador não informado',
    apresentacao: eventData.apresentacao,
    infoCategorias: eventData.infoCategorias,
    faixasEtarias: eventData.faixasEtarias,
    faixasGraduacao: eventData.faixasGraduacao,
    categoriasPeso: eventData.categoriasPeso,
    atencaoAgrupamento: eventData.atencaoAgrupamento,
    infoAbsoluto: eventData.infoAbsoluto,
    obsAbsoluto: eventData.obsAbsoluto,
    infoChecagem: eventData.infoChecagem,
    infoChecagemDesafioKids: eventData.infoChecagemDesafioKids,
    infoChecagemAbsoluto: eventData.infoChecagemAbsoluto,
    infoChaves: eventData.infoChaves,
    infoPesagem: eventData.infoPesagem,
    infoPremiacao: eventData.infoPremiacao,
    sistemaPontuacao: eventData.sistemaPontuacao,
    criterioDesempate: eventData.criterioDesempate,
    regrasFiscalizacao: eventData.regrasFiscalizacao,
    integridadeSaude: eventData.integridadeSaude,
    direitoImagem: eventData.direitoImagem,
    termoAceiteAtleta: eventData.termoAceiteAtleta,
    termoAceiteResponsavel: eventData.termoAceiteResponsavel,
    financeiroInfo: eventData.financeiroInfo,
    emailDadosBancarios: eventData.emailDadosBancarios,
    valoresInscricaoEvento: eventData.valoresInscricaoEvento,
    bannerImage: eventData.bannerImage,
    destaqueImage: eventData.destaqueImage,
    createdAt: eventData.createdAt || new Date().toISOString(),
    publishedAt: eventData.publishedAt,
    status: eventData.status || 'draft',
    type: eventData.type || 'Campeonato Jiu-Jitsu',
    eventType: eventData.eventType || 'Campeonato',
    sport: eventData.sport || 'Jiu-Jitsu',
    state: eventData.state,
    date: eventData.date,
    dateFull: eventData.dateFull,
    dateObj: eventData.dateObj,
    location: eventData.location,
    daysLeft: eventData.daysLeft,
    description: eventData.description || eventData.apresentacao,
  }

  // Se já existe, atualizar; senão, adicionar
  const existingIndex = events.findIndex((e) => e.id === newEvent.id)
  if (existingIndex >= 0) {
    events[existingIndex] = newEvent
  } else {
    events.push(newEvent)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  return newEvent
}

// Publicar evento
export function publishEvent(eventId: number): StoredEvent | null {
  const events = getAllEvents()
  const event = events.find((e) => e.id === eventId)
  if (!event) return null

  event.status = 'published'
  event.publishedAt = new Date().toISOString()

  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  return event
}

// Obter todos os eventos
export function getAllEvents(): StoredEvent[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

// Obter apenas eventos publicados
export function getPublishedEvents(): StoredEvent[] {
  return getAllEvents().filter((e) => e.status === 'published')
}

// Obter evento por ID
export function getEventById(id: number): StoredEvent | null {
  const events = getAllEvents()
  return events.find((e) => e.id === id) || null
}

// Converter StoredEvent para formato de Event (para exibição na home)
export function storedEventToEvent(stored: StoredEvent): any {
  // Calcular dias restantes se tiver data
  let daysLeft = 0
  if (stored.dateObj) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDate = new Date(stored.dateObj)
    eventDate.setHours(0, 0, 0, 0)
    const diffTime = eventDate.getTime() - today.getTime()
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return {
    id: stored.id,
    title: stored.titulo,
    type: stored.type || 'Campeonato Jiu-Jitsu',
    eventType: stored.eventType || 'Campeonato',
    sport: stored.sport || 'Jiu-Jitsu',
    state: stored.state,
    date: stored.date,
    dateFull: stored.dateFull,
    dateObj: stored.dateObj ? new Date(stored.dateObj) : undefined,
    location: stored.location,
    daysLeft: daysLeft > 0 ? daysLeft : 0,
    image: stored.bannerImage || stored.destaqueImage,
    description: stored.description || stored.apresentacao,
    organizer: {
      name: stored.organizer,
      email: 'contato@meucamp.com.br',
      phone: '(27) 99945-0345',
    },
  }
}

