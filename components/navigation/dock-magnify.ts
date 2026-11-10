/**
 * Ampliação por proximidade do Dock (React Bits, https://reactbits.dev/components/dock), adaptada a uma lista vertical.
 * O bit não é instalado: só a ideia e a física, reescritas aqui.
 *
 * Cada opção tem um tamanho que segue o ponteiro (ou o foco do teclado): quanto mais perto, maior; a queda é suave
 * (cosseno ao quadrado) e some além de `reach`. O tamanho segue o alvo por uma mola amortecida, com a integração implícita
 * do Dock: estável e sem repique com os valores padrão (massa 0,1, rigidez 150, amortecimento 12 → ζ ≈ 1,55).
 */

export const MAGNIFY_DEFAULTS = {
  /** Escala da opção sob o ponteiro (1 = sem ampliação). */
  peak: 1.2,
  /** Até onde o ponteiro ainda amplia, em px. */
  reach: 190,
  mass: 0.1,
  stiffness: 150,
  damping: 12,
} as const

export interface MagnifyOptions {
  peak?: number
  reach?: number
  mass?: number
  stiffness?: number
  damping?: number
}

/** Escala-alvo para uma distância (px) do ponteiro ao centro da opção. */
export function magnifyTarget(distance: number, peak: number, reach: number) {
  if (!(reach > 0) || peak <= 1) return 1
  const r = Math.abs(distance) / reach
  return r >= 1 ? 1 : 1 + (peak - 1) * Math.cos((r * Math.PI) / 2) ** 2
}

/** Distância ao centro de uma caixa, penalizando o afastamento horizontal (colunas vizinhas contam menos). */
export function boxDistance(px: number, py: number, box: { left: number; right: number; top: number; bottom: number }) {
  const cy = (box.top + box.bottom) / 2
  const dx = px < box.left ? box.left - px : px > box.right ? px - box.right : 0
  return Math.hypot(py - cy, dx)
}

/** Um passo da mola do Dock (integração implícita em sub-passos de 1/240 s). */
export function springStep(size: number, velocity: number, target: number, dt: number, o: MagnifyOptions = {}) {
  const k = (o.stiffness ?? MAGNIFY_DEFAULTS.stiffness) / Math.max(0.01, o.mass ?? MAGNIFY_DEFAULTS.mass)
  const c = (o.damping ?? MAGNIFY_DEFAULTS.damping) / Math.max(0.01, o.mass ?? MAGNIFY_DEFAULTS.mass)
  const steps = Math.max(1, Math.ceil(dt * 240))
  const h = dt / steps
  let s = size
  let v = velocity
  for (let i = 0; i < steps; i += 1) {
    v = (v + h * k * (target - s)) / (1 + h * c + h * h * k)
    s += v * h
  }
  return { size: s, velocity: v }
}

export interface Magnifier {
  /** Recalcula (use depois de abrir/redimensionar). */
  refresh(): void
  destroy(): void
}

interface Item { el: HTMLElement; label: HTMLElement; size: number; velocity: number; drawn: number }

/**
 * Liga a ampliação a uma lista de itens. `getItems` devolve os elementos na ordem; a escala é aplicada em
 * `.ml-menu-link-text` de cada um pela propriedade `scale` (não mexe no layout nem nas animações de `transform`).
 * Só o ponteiro de mouse/caneta e o foco de teclado ampliam; toque e `prefers-reduced-motion` ficam sem efeito.
 */
export function createMagnifier(getItems: () => (HTMLElement | null)[], options: MagnifyOptions = {}): Magnifier {
  const o = { ...MAGNIFY_DEFAULTS, ...options }
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const pointer = { x: 0, y: 0, active: false }
  let focused: HTMLElement | null = null
  let items: Item[] = []
  let raf = 0
  let last = 0
  let alive = true

  const collect = () => {
    items = getItems().flatMap((el) => {
      const label = el?.querySelector<HTMLElement>('.ml-menu-link-text')
      return el && label ? [{ el, label, size: 1, velocity: 0, drawn: 1 }] : []
    })
  }

  const tick = (now: number) => {
    raf = 0
    if (!alive) return
    const dt = Math.min(1 / 30, Math.max(0.001, (now - last) / 1000))
    last = now
    let moving = false
    const focusBox = focused?.getBoundingClientRect()
    for (const item of items) {
      let target = 1
      if (!reduce) {
        if (pointer.active) target = magnifyTarget(boxDistance(pointer.x, pointer.y, item.el.getBoundingClientRect()), o.peak, o.reach)
        else if (focusBox) {
          // Mesma conta do ponteiro, a partir do centro do item focado: a coluna ao lado (mesma linha) não amplia junto.
          target = magnifyTarget(
            boxDistance((focusBox.left + focusBox.right) / 2, (focusBox.top + focusBox.bottom) / 2, item.el.getBoundingClientRect()),
            o.peak,
            o.reach,
          )
        }
      }
      const next = springStep(item.size, item.velocity, target, dt, o)
      item.size = next.size
      item.velocity = next.velocity
      if (Math.abs(item.velocity) < 0.0005 && Math.abs(target - item.size) < 0.0005) { item.size = target; item.velocity = 0 }
      else moving = true
      if (Math.abs(item.size - item.drawn) > 0.0005) {
        item.drawn = item.size
        item.label.style.scale = item.size === 1 ? '' : item.size.toFixed(4)
      }
    }
    if (moving) raf = requestAnimationFrame(tick)
  }

  const wake = () => {
    if (raf || !alive || reduce) return
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    pointer.x = event.clientX
    pointer.y = event.clientY
    pointer.active = true
    wake()
  }
  const onLeaveWindow = () => { pointer.active = false; wake() }
  // Quem usa o teclado manda: com o mouse parado dentro da janela, o foco precisa ampliar a opção focada.
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Tab' || event.key.startsWith('Arrow')) { pointer.active = false; wake() }
  }
  const onFocusIn = (event: FocusEvent) => {
    const el = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-menu-link]') : null
    focused = el && el.matches(':focus-visible') ? el : null
    wake()
  }
  const onFocusOut = () => { focused = null; wake() }

  collect()
  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeaveWindow)
  document.addEventListener('keydown', onKey, true)
  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('focusout', onFocusOut)

  return {
    refresh() { collect(); wake() },
    destroy() {
      alive = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      items.forEach((item) => { item.label.style.scale = '' })
    },
  }
}
