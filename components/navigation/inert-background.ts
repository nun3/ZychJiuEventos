const SKIP_INERT = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK', 'NEXT-ROUTE-ANNOUNCER'])

/**
 * Marca como inert os irmãos de cada ancestral de `menu` (a página atrás de um menu em tela cheia ou lateral).
 * O menu e o gatilho precisam estar no mesmo escopo, para nunca ficarem dentro de um ancestral inert.
 * Devolve só os elementos que este chamado alterou, para quem chamou desfazer.
 */
export function inertBackground(menu: HTMLElement): HTMLElement[] {
  const changed: HTMLElement[] = []
  let node: HTMLElement | null = menu.parentElement
  while (node && node !== document.body) {
    const parent: HTMLElement | null = node.parentElement
    if (!parent) break
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || !(sibling instanceof HTMLElement)) continue
      if (SKIP_INERT.has(sibling.tagName) || sibling.hasAttribute('inert')) continue
      sibling.setAttribute('inert', '')
      changed.push(sibling)
    }
    node = parent
  }
  return changed
}
