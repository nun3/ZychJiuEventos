/**
 * Lógica pura do Cover Flow 3D da Home. Fica fora do componente para ser testada sem DOM.
 * O desenho (poses, transições) vive em HomeCoverFlow.module.css.
 */

export const COVER_MIN_SLOTS = 5
export const COVER_MAX_EVENTS = 8

export type CoverPose = '-1' | '0' | '1' | 'far-left' | 'far-right'

/** Frases de estratégia de luta usadas enquanto não há eventos suficientes. Texto próprio, sem atribuição a terceiros. */
export const FIGHT_STRATEGIES = [
  { theme: 'Posição', phrase: 'Posição antes da finalização: quem domina o lugar do corpo decide o que acontece depois.' },
  { theme: 'Distância', phrase: 'Quem controla a distância controla a luta.' },
  { theme: 'Ataque', phrase: 'Não force o que o adversário defende: ataque o que ele esquece de proteger.' },
  { theme: 'Paciência', phrase: 'Paciência também é técnica: espere o erro, não o ataque.' },
  { theme: 'Defesa', phrase: 'Defender bem é começar a atacar.' },
] as const

export type FightStrategy = (typeof FIGHT_STRATEGIES)[number]

export type CoverSlide<T extends { id: string }> =
  | { kind: 'event'; key: string; event: T }
  | { kind: 'strategy'; key: string; strategy: FightStrategy }

/** Avança (ou recua) circularmente. Com count <= 0 devolve 0. */
export function nextIndex(index: number, count: number, delta = 1) {
  if (count <= 0) return 0
  return (((index + delta) % count) + count) % count
}

/** Distância assinada de um slide ao ativo, no caminho mais curto do anel. */
export function relativeCoverPosition(index: number, activeIndex: number, count: number) {
  if (count <= 0) return 0
  let diff = index - activeIndex
  const half = Math.floor(count / 2)
  if (diff > half) diff -= count
  if (diff < -half) diff += count
  return diff
}

export function coverPose(position: number): CoverPose {
  if (position === 0) return '0'
  if (position === -1) return '-1'
  if (position === 1) return '1'
  return position < 0 ? 'far-left' : 'far-right'
}

/**
 * Eventos reais primeiro; frases de luta preenchem até COVER_MIN_SLOTS.
 * Quando um evento surge, ele ocupa o lugar de uma frase (nunca soma além do mínimo até passar dele).
 */
export function buildCoverSlides<T extends { id: string }>(events: T[]): CoverSlide<T>[] {
  const real = events.slice(0, COVER_MAX_EVENTS)
  const slides: CoverSlide<T>[] = real.map((event) => ({ kind: 'event', key: `event-${event.id}`, event }))
  for (let i = 0; slides.length < COVER_MIN_SLOTS; i += 1) {
    const strategy = FIGHT_STRATEGIES[i % FIGHT_STRATEGIES.length]
    slides.push({ kind: 'strategy', key: `strategy-${i}`, strategy })
  }
  return slides
}
