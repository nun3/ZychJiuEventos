"use client"

// Halftone Wordmark Footer — o rodapé de um site com o nome da marca enorme, cortado pela borda de baixo e impresso
// como um campo de pontos de retícula. Cada ponto tem o tamanho de quanto a letra cobre a célula dele, então a letra
// mantém as bordas em qualquer tamanho. O mouse passa e os pontos se abrem em volta dele, em molas, esquentando de cor
// conforme saem do lugar; o clique solta uma onda de choque que atravessa a palavra. Em cima ficam a linha do estúdio,
// as colunas de links espaçados e o voltar ao topo, separados por um filete, tudo sob um grão fino de impressão.
//
// Um arquivo, só React. Um canvas 2D para os pontos e o grão, links de verdade. Toda regra da <style> tem o prefixo
// .hwf- e nada é baixado: as fontes são as da página ou as das pilhas de reserva.

import * as React from "react"

export interface HalftonePalette {
  /** O fundo do rodapé. */
  background: string
  /** Os pontos parados, e o texto. */
  ink: string
  /** A cor que o ponto pega quando sai do lugar. */
  warm: string
}

export type HalftonePreset = "night" | "paper" | "ember" | "cobalt"

export interface FooterLink {
  label: string
  /** Para onde o link leva. Sem href, ele vira texto. */
  href?: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

/** Uma silhueta vetorial impressa em pontos no lugar da palavra. Coordenadas no espaço do `viewBox`. */
export interface HalftoneShape {
  /** Identifica a silhueta; entra na chave que refaz a máscara. */
  id: string
  /** x, y, largura e altura da caixa que a silhueta ocupa. */
  viewBox: readonly [number, number, number, number]
  /** Caminhos SVG. Sem `stroke`, o caminho é preenchido; com `stroke`, é um traço dessa espessura. */
  paths: readonly { d: string; stroke?: number }[]
  /** Que fração da faixa livre (altura menos as reservas) a silhueta ocupa. 0,96 de fábrica. */
  heightFit?: number
  /** Espaço reservado em cima, em px de CSS, para cabeçalho ou texto. 0 de fábrica. */
  insetTop?: number
  /** Espaço reservado embaixo, em px de CSS, para texto ou botões. 0 de fábrica. */
  insetBottom?: number
}

export interface HalftoneWordmarkFooterProps {
  /** A palavra gigante impressa em pontos. Em minúsculas fica melhor. */
  wordmark?: string
  /** A linha do estúdio, no canto de cima à esquerda. */
  label?: string
  /** A linha apagada embaixo dela. */
  meta?: string
  /** As colunas de links, em cima. */
  columns?: FooterColumn[]
  /** Mostra o voltar ao topo, que rola a janela até o começo. Ligado de fábrica. */
  backToTop?: boolean
  /** O texto do voltar ao topo. */
  backToTopLabel?: string
  /** As cores de partida. "night" de fábrica. */
  preset?: HalftonePreset
  /** Cores que passam por cima das do preset. */
  palette?: { background?: string; ink?: string; warm?: string }
  /** A distância entre os centros dos pontos, em px de CSS. 6 de fábrica. */
  dotGap?: number
  /** Até onde o ponteiro empurra, em px de CSS. 80 de fábrica. */
  radius?: number
  /** Quanto da altura das letras fica abaixo da borda de baixo, de 0 a 0,6. 0,2 de fábrica. */
  crop?: number
  /** O grão de impressão por cima de tudo, de 0 a 1. 0,5 de fábrica. */
  grain?: number
  /** A resposta ao ponteiro e ao clique. Ligada de fábrica. */
  interactive?: boolean
  /** A fonte da palavra. Grotescas pesadas imprimem melhor. */
  fontFamily?: string
  /** O peso da palavra. 800 de fábrica. */
  fontWeight?: number
  /** A fonte do texto pequeno. */
  monoFamily?: string
  /** A altura do rodapé. Um comprimento definido, nunca uma porcentagem. */
  height?: string
  /** Classes a mais na raiz. */
  className?: string
  /** Onde a palavra fica na vertical: colada embaixo (rodapé, padrão) ou no centro (abertura de página). */
  align?: "bottom" | "center"
  /** Que fração da largura a palavra ocupa. 1.02 de fábrica. */
  widthFit?: number
  /** Imprime esta silhueta em vez da palavra. A palavra continua como texto acessível. */
  shape?: HalftoneShape
}

const PRESETS: { [K in HalftonePreset]: HalftonePalette } = {
  night: { background: "#0c0c0b", ink: "#e9e4da", warm: "#e9762b" },
  paper: { background: "#efebe3", ink: "#17150f", warm: "#c2361c" },
  ember: { background: "#160a06", ink: "#f2c48c", warm: "#ff5a1f" },
  cobalt: { background: "#0d1b4d", ink: "#dfe7ff", warm: "#ffcd3c" },
}

export const DEFAULT_COLUMNS: FooterColumn[] = [
  { title: "Trabalhos", links: [{ label: "Índice", href: "#indice" }, { label: "Arquivo", href: "#arquivo" }, { label: "Diário", href: "#diario" }] },
  { title: "Estúdio", links: [{ label: "Sobre", href: "#sobre" }, { label: "Processo", href: "#processo" }, { label: "Carreiras", href: "#carreiras" }] },
  { title: "Contato", links: [{ label: "ola@construa.studio", href: "mailto:ola@construa.studio" }, { label: "+55 11 3041 0041", href: "tel:+551130410041" }] },
]

const SANS_STACK = '"Inter Tight", "Inter Variable", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif'
const MONO_STACK = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace'

// #region retícula
// Funções puras, fora do componente: dá para testar cada uma sozinha.

/** Hex → [r, g, b] de 0 a 255, ou null para o que não for #rgb ou #rrggbb. */
export function hwfHex(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** O raio do ponto para a cobertura da célula, de 0 a 1: fiel à área, para o tom ficar uniforme. */
export function hwfRadius(coverage: number, gap: number) {
  const c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage
  return Math.sqrt(c) * gap * 0.56
}

/**
 * Um passo da mola que leva o ponto de volta para casa, mais o empurrão de um ponteiro em (px, py) dentro do raio r.
 * Devolve [x, y, vx, vy]. Longe do ponteiro, um ponto fora do lugar sempre volta para casa e para.
 */
export function hwfStep(
  x: number, y: number, vx: number, vy: number,
  hx: number, hy: number, px: number, py: number, r: number,
) {
  const dx = x - px
  const dy = y - py
  const d2 = dx * dx + dy * dy
  if (r > 0 && d2 < r * r) {
    const d = Math.sqrt(d2) + 0.001
    const f = (1 - d / r) * 2.6
    vx += (dx / d) * f
    vy += (dy / d) * f
  }
  vx = (vx + (hx - x) * 0.05) * 0.84
  vy = (vy + (hy - y) * 0.05) * 0.84
  return [x + vx, y + vy, vx, vy]
}

/** O quanto o ponto esquenta: 0 em casa, 1 a partir de `span` px de distância. */
export function hwfWarmth(x: number, y: number, hx: number, hy: number, span: number) {
  const d = Math.hypot(x - hx, y - hy)
  return span > 0 ? Math.min(1, d / span) : 0
}

/** O tamanho de fonte em que `measured` (a largura a 100px) preenche `width` exatamente. */
export function hwfFitSize(measured: number, width: number) {
  return measured > 0 ? (width / measured) * 100 : 0
}
// #endregion

const HWF_CSS = `
.hwf-root {
  position: relative; width: 100%; overflow: hidden; isolation: isolate; container-type: inline-size;
  background: var(--hwf-bg); color: var(--hwf-ink); -webkit-font-smoothing: antialiased;
}
.hwf-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; }
.hwf-top {
  position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.25fr) repeat(3, minmax(0, 1fr));
  gap: 24px; padding: clamp(22px, 3.4cqw, 40px) clamp(20px, 3.4cqw, 44px) 0;
  font-family: var(--hwf-mono); font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase; line-height: 1.75;
}
.hwf-brand strong { display: block; font-weight: 500; }
.hwf-brand span { opacity: .45; }
.hwf-col h3 { margin: 0; font: inherit; opacity: .4; font-weight: 500; }
.hwf-col ul { list-style: none; margin: 0; padding: 0; }
.hwf-link, .hwf-up {
  color: inherit; text-decoration: none; opacity: .78; background: none; border: 0; padding: 0;
  font: inherit; letter-spacing: inherit; text-transform: inherit; cursor: pointer;
  background-image: linear-gradient(currentColor, currentColor); background-size: 0% 1px;
  background-repeat: no-repeat; background-position: 0 100%; transition: opacity .25s ease, background-size .35s cubic-bezier(.2,.7,.1,1);
}
span.hwf-link { cursor: default; }
a.hwf-link:hover, .hwf-up:hover { opacity: 1; background-size: 100% 1px; }
a.hwf-link:focus-visible, .hwf-up:focus-visible { outline: 1px solid currentColor; outline-offset: 3px; opacity: 1; }
.hwf-rule {
  position: relative; z-index: 1; display: flex; justify-content: flex-end; align-items: center; gap: 16px;
  margin: clamp(18px, 2.6cqw, 30px) clamp(20px, 3.4cqw, 44px) 0; padding-top: 12px;
  border-top: 0.5px solid color-mix(in srgb, var(--hwf-ink) 16%, transparent);
  font-family: var(--hwf-mono); font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase;
}
.hwf-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@container (max-width: 720px) {
  .hwf-top { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); row-gap: 18px; }
  .hwf-brand { grid-column: 1 / -1; }
}
@media (prefers-reduced-motion: reduce) {
  .hwf-link, .hwf-up { transition: none; }
}
`

export default function HalftoneWordmarkFooter({
  wordmark = "construa",
  label = "Construa Studio",
  meta = "©2026 · São Paulo / Lisboa",
  columns = DEFAULT_COLUMNS,
  backToTop = true,
  backToTopLabel = "Voltar ao topo ↑",
  preset = "night",
  palette,
  dotGap = 6,
  radius = 80,
  crop = 0.2,
  grain = 0.5,
  interactive = true,
  fontFamily = SANS_STACK,
  fontWeight = 800,
  monoFamily = MONO_STACK,
  height = "560px",
  className = "",
  align = "bottom",
  widthFit = 1.02,
  shape,
}: HalftoneWordmarkFooterProps) {
  const colors = { ...(PRESETS[preset] || PRESETS.night), ...(palette || {}) }
  const rootRef = React.useRef(null as HTMLElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const opts = React.useRef({ colors, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, wordmark, align, widthFit, shape })
  React.useLayoutEffect(() => {
    opts.current = { colors, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, wordmark, align, widthFit, shape }
  })
  const key = [wordmark, shape?.id, align, widthFit, dotGap, crop, grain, fontFamily, fontWeight, colors.background, colors.ink, colors.warm].join("|")

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let w = 0
    let h = 0
    let dpr = 1
    let px = -1e5
    let py = -1e5
    let raf = 0
    let visible = true
    let awake = true
    let ring = { x: 0, y: 0, t: -1 }
    // Vetores planos: x, y, vx, vy, hx, hy, r de cada ponto.
    let dots = new Float32Array(0)
    let count = 0
    let grainTile = null as HTMLCanvasElement | null
    const ink = hwfHex(opts.current.colors.ink) || [233, 228, 218]
    const warm = hwfHex(opts.current.colors.warm) || [233, 118, 43]

    const layout = () => {
      const o = opts.current
      // O tamanho do layout, não o da tela: dentro de um transform: scale o rodapé continua com os mesmos pontos.
      w = Math.max(1, root.clientWidth)
      h = Math.max(1, root.clientHeight)
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)

      // A palavra entra uma vez, no tamanho que preenche a largura, numa máscara de 1x.
      const mask = document.createElement("canvas")
      mask.width = w
      mask.height = h
      const m = mask.getContext("2d", { willReadFrequently: true })
      if (!m) return
      if (o.shape) {
        // Silhueta vetorial: cabe na largura e na altura, centrada, e vira a mesma máscara que a palavra.
        const [vx, vy, vw, vh] = o.shape.viewBox
        const top = o.shape.insetTop ?? 0
        const free = Math.max(1, h - top - (o.shape.insetBottom ?? 0))
        const k = Math.min((w * o.widthFit) / vw, (free * (o.shape.heightFit ?? 0.96)) / vh)
        const cy = top + free / 2
        m.setTransform(k, 0, 0, k, (w - vw * k) / 2 - vx * k, cy - (vh * k) / 2 - vy * k)
        m.fillStyle = "#000"
        m.strokeStyle = "#000"
        m.lineCap = "butt"
        for (const part of o.shape.paths) {
          const path = new Path2D(part.d)
          if (part.stroke) {
            m.lineWidth = part.stroke
            m.stroke(path)
          } else {
            m.fill(path)
          }
        }
        m.setTransform(1, 0, 0, 1, 0, 0)
      } else {
        const face = o.fontWeight + " 100px " + o.fontFamily
        m.font = face
        const word = o.wordmark || " "
        const fit = hwfFitSize(m.measureText(word).width, w * o.widthFit)
        m.font = o.fontWeight + " " + fit + "px " + o.fontFamily
        const box = m.measureText(word)
        const cap = box.actualBoundingBoxAscent || fit * 0.72
        const c = Math.max(0, Math.min(0.6, o.crop))
        m.fillStyle = "#000"
        m.textBaseline = "alphabetic"
        m.fillText(word, (w - box.width) / 2, o.align === "center" ? (h + cap) / 2 : h + cap * c)
      }
      const img = m.getImageData(0, 0, w, h).data

      const gap = Math.max(3, o.dotGap)
      const cols = Math.ceil(w / gap)
      const rows = Math.ceil(h / gap)
      const tmp: number[] = []
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          // A cobertura: a média do alfa numa amostra de 3×3 da célula.
          let sum = 0
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3))
              const y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3))
              sum += img[(y * w + x) * 4 + 3]
            }
          }
          const cov = sum / (9 * 255)
          if (cov < 0.06) continue
          const hx = gx * gap + gap / 2
          const hy = gy * gap + gap / 2
          tmp.push(hx, hy, 0, 0, hx, hy, hwfRadius(cov, gap))
        }
      }
      dots = new Float32Array(tmp)
      count = tmp.length / 7

      // Um ladrilho fixo de grão de impressão, desenhado uma vez e posto por cima de cada quadro.
      grainTile = document.createElement("canvas")
      grainTile.width = 256
      grainTile.height = 256
      const g = grainTile.getContext("2d")
      if (g) {
        const id = g.createImageData(256, 256)
        for (let i = 0; i < id.data.length; i += 4) {
          const v = Math.random() * 255
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v
          id.data[i + 3] = Math.random() < 0.5 ? 0 : 255
        }
        g.putImageData(id, 0, 0)
      }
      awake = true
    }

    const draw = (now: number) => {
      const o = opts.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = o.colors.background
      ctx.fillRect(0, 0, w, h)

      const r = o.interactive && !reduced ? Math.max(0, o.radius) : 0
      const ringAge = ring.t < 0 ? 1e9 : now - ring.t
      const ringR = ringAge * 0.9
      let moving = false
      for (let i = 0; i < count; i++) {
        const j = i * 7
        let x = dots[j]
        let y = dots[j + 1]
        let vx = dots[j + 2]
        let vy = dots[j + 3]
        const hx = dots[j + 4]
        const hy = dots[j + 5]
        if (!reduced) {
          if (ringAge < 900) {
            const dx = hx - ring.x
            const dy = hy - ring.y
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001
            const band = 1 - Math.min(1, Math.abs(d - ringR) / 26)
            if (band > 0) {
              const f = band * 3.2 * (1 - ringAge / 900)
              vx += (dx / d) * f
              vy += (dy / d) * f
            }
          }
          const s = hwfStep(x, y, vx, vy, hx, hy, px, py, r)
          x = s[0]
          y = s[1]
          vx = s[2]
          vy = s[3]
          if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) moving = true
          else {
            x = hx
            y = hy
            vx = 0
            vy = 0
          }
          dots[j] = x
          dots[j + 1] = y
          dots[j + 2] = vx
          dots[j + 3] = vy
        }
        const k = hwfWarmth(x, y, hx, hy, 28)
        ctx.fillStyle =
          k > 0.02
            ? "rgb(" +
              Math.round(ink[0] + (warm[0] - ink[0]) * k) + "," +
              Math.round(ink[1] + (warm[1] - ink[1]) * k) + "," +
              Math.round(ink[2] + (warm[2] - ink[2]) * k) + ")"
            : o.colors.ink
        ctx.beginPath()
        ctx.arc(x, y, dots[j + 6], 0, 6.2832)
        ctx.fill()
      }

      if (grainTile && o.grain > 0) {
        ctx.globalAlpha = Math.min(1, o.grain) * 0.09
        ctx.globalCompositeOperation = "overlay"
        const pattern = ctx.createPattern(grainTile, "repeat")
        if (pattern) {
          ctx.fillStyle = pattern
          ctx.fillRect(0, 0, w, h)
        }
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = "source-over"
      }
      // Dorme quando todos os pontos estão em casa e nada empurra.
      awake = moving || ringAge < 900 || px > -1e4
    }

    const loop = (now: number) => {
      raf = 0
      if (!visible) return
      draw(now)
      if (awake) raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      awake = true
      if (!raf && visible) raf = requestAnimationFrame(loop)
    }

    // Da tela para o layout: com o rodapé dentro de um transform: scale, a caixa na tela é menor que a do layout.
    const toLocal = (e: PointerEv) => {
      const b = canvas.getBoundingClientRect()
      return [((e.clientX - b.left) * w) / (b.width || w), ((e.clientY - b.top) * h) / (b.height || h)]
    }
    const onMove = (e: PointerEv) => {
      if (!opts.current.interactive) return
      const p = toLocal(e)
      px = p[0]
      py = p[1]
      wake()
    }
    const onLeave = () => {
      px = -1e5
      py = -1e5
      wake()
    }
    const onDown = (e: PointerEv) => {
      if (!opts.current.interactive || reduced) return
      if ((e.target as HTMLElement).closest("a,button")) return
      const p = toLocal(e)
      ring = { x: p[0], y: p[1], t: performance.now() }
      wake()
    }

    layout()
    draw(performance.now())
    wake()

    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("pointerdown", onDown)
    const ro = new ResizeObserver(() => {
      layout()
      wake()
    })
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true
      if (visible) wake()
    })
    io.observe(root)
    // Uma fonte da web que chega depois refaz a palavra na fonte certa.
    let alive = true
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!alive) return
        layout()
        wake()
      })
    }

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("pointerdown", onDown)
    }
  }, [key])

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer
      ref={rootRef}
      className={"hwf-root " + className}
      style={
        {
          height,
          "--hwf-bg": colors.background,
          "--hwf-ink": colors.ink,
          "--hwf-mono": monoFamily,
        } as React.CSSProperties
      }
    >
      <style>{HWF_CSS}</style>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="hwf-sr">{wordmark}</span>
      <div className="hwf-top">
        <div className="hwf-brand">
          <strong>{label}</strong>
          <span>{meta}</span>
        </div>
        {columns.map((col) => (
          <nav className="hwf-col" key={col.title} aria-label={col.title}>
            <h3>{col.title}</h3>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href ? (
                    <a className="hwf-link" href={l.href}>{l.label}</a>
                  ) : (
                    <span className="hwf-link">{l.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="hwf-rule">
        {backToTop ? (
          <button type="button" className="hwf-up" onClick={toTop}>
            {backToTopLabel}
          </button>
        ) : null}
      </div>
    </footer>
  )
}

type PointerEv = PointerEvent
