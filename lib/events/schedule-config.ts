/**
 * Parâmetros do gerador de eventos (produto, ajustáveis). Nada aqui altera regras do banco:
 * as quatro fases oficiais (inscricao, pagamento, checagem, chaves) e a ordem sem sobreposição vêm de
 * `event_phases` / `createEvent`. Os números abaixo são referências de produto para SUGERIR datas.
 */

export type EventShift = 'manha' | 'tarde' | 'noite'
export type RegistrationProfile = 'curto' | 'equilibrado' | 'longo'

/** Horário de início sugerido do campeonato; as alternativas são usadas ao pedir outra sugestão. */
export const SHIFTS: Record<EventShift, { label: string; hours: readonly number[] }> = {
  manha: { label: 'Manhã', hours: [9, 8, 10] },
  tarde: { label: 'Tarde', hours: [14, 13, 15] },
  noite: { label: 'Noite', hours: [18, 19, 17] },
}

export const PROFILES: Record<
  RegistrationProfile,
  {
    label: string
    description: string
    /** Dias entre a abertura das inscrições (ou "hoje") e o campeonato: mínimo para o perfil. */
    minLeadDays: number
    /** Faixa preferida de antecedência; a abertura das inscrições mira o limite superior. */
    preferredLeadDays: readonly [number, number]
    /** Dias antes do evento em que a checagem começa. */
    checagemDaysBefore: number
    /** Duração padrão do pagamento, em dias. */
    paymentDays: number
  }
> = {
  curto: {
    label: 'Curto',
    description: 'Para eventos próximos: pouco tempo de divulgação, inscrições abertas por poucos dias.',
    minLeadDays: 7,
    preferredLeadDays: [7, 14],
    checagemDaysBefore: 2,
    paymentDays: 2,
  },
  equilibrado: {
    label: 'Equilibrado',
    description: 'Recomendado: tempo para divulgar, inscrever e organizar as etapas.',
    minLeadDays: 21,
    preferredLeadDays: [21, 35],
    checagemDaysBefore: 3,
    paymentDays: 3,
  },
  longo: {
    label: 'Longo',
    description: 'Para campeonatos maiores, com muita antecedência de divulgação.',
    minLeadDays: 45,
    preferredLeadDays: [45, 60],
    checagemDaysBefore: 3,
    paymentDays: 3,
  },
}

/** Menor janela de inscrição aceita pelo gerador, em horas. */
export const MIN_REGISTRATION_HOURS = 36
/** Alertas de prazo apertado no resumo. */
export const WARN_REGISTRATION_DAYS = 7
export const WARN_PAYMENT_DAYS = 2
