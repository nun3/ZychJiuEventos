/** Navega pelo app com a View Transition nativa (quando há suporte e o usuário não pediu menos movimento). */
export function pushWithViewTransition(push: (href: string) => void, href: string) {
  const doc = document as Document & { startViewTransition?: (callback: () => void) => void }
  const canTransition = typeof doc.startViewTransition === 'function' && window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  if (!canTransition) {
    push(href)
    return
  }
  doc.startViewTransition!(() => push(href))
}
