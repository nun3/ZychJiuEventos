'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number; y: number
  startX: number; startY: number
  targetX: number; targetY: number
  weight: number; seed: number; depth: number; delay: number
  ox: number; oy: number; vx: number; vy: number
}

const TONES = 12
const FADES = 8
const HEAT_RANGE = 36
const HEAT_DEADZONE = 3
const TAU = Math.PI * 2
const BURST_SPRING = 18
const BURST_DAMPING = 7.5

const S = {
  particleSize: 2.2,
  density: 4,
  scatter: 210,
  gatherDuration: 1600,
  stagger: 420,
  burstStrength: 1.2,
  pointerRepel: 50,
  repelRadius: 140,
  idleDrift: 0.8,
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const fadeAlpha = (level: number) => 0.35 + (0.65 * level) / (FADES - 1)
const PALETTE = Array.from({ length: TONES }, (_, i) => {
  const lum = Math.round(200 + 55 * (i / (TONES - 1)))
  return `rgb(${lum}, ${lum}, ${lum})`
})

/**
 * Título em partículas. As partículas formam o texto e são repelidas pelo ponteiro
 * (repulsão quadrática dentro de `repelRadius`), com mola de retorno. Clique/toque gera uma explosão.
 * O texto real fica em `children` (acessível); o canvas é decorativo.
 */
export function ParticleTitle({ text, className, children }: { text: string; className?: string; children?: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    const layer = document.createElement('canvas')
    const layerCtx = layer.getContext('2d')
    if (!ctx || !layerCtx) return

    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = reducedQuery.matches
    let particles: Particle[] = []
    let raf = 0
    let last = 0
    let gathering = false
    let gatherStart = 0
    let bursting = false
    let visible = true
    let alive = true
    let width = 0
    let height = 0
    let dpr = 1
    const swirl = { x: 0, y: 0 }
    const pointer = { active: false, x: 0, y: 0, smoothX: 0, smoothY: 0 }
    const buckets: Particle[][] = Array.from({ length: TONES * FADES }, () => [])

    const startIntro = (initial: boolean) => {
      if (!particles.length) return
      const spread = reduced ? 0 : S.scatter
      for (const p of particles) {
        const angle = p.seed * TAU
        const distance = spread * (0.35 + p.depth * 0.75)
        p.startX = p.targetX + Math.cos(angle) * distance + (p.seed - 0.5) * spread * 0.45
        p.startY = p.targetY + Math.sin(angle) * distance + (p.depth - 0.9) * spread * 0.45
        p.delay = reduced ? 0 : p.seed * S.stagger
        if (initial) { p.x = p.startX; p.y = p.startY }
      }
      swirl.x = width / 2
      swirl.y = height / 2
      gatherStart = performance.now()
      gathering = true
      wake()
    }

    const burst = (x: number, y: number) => {
      if (!particles.length || reduced) return
      const radius = 90 + 70 * Math.sqrt(S.burstStrength) + S.repelRadius * 0.25
      for (const p of particles) {
        const dx = p.x - x
        const dy = p.y - y
        const dist = Math.hypot(dx, dy)
        if (dist > radius) continue
        const falloff = 1 - dist / radius
        const power = 950 * S.burstStrength * (0.2 + 0.8 * falloff * falloff) * (0.65 + p.depth * 0.45)
        const angle = Math.atan2(dy, dx) + (p.seed - 0.5) * 0.9
        p.vx += Math.cos(angle) * power
        p.vy += Math.sin(angle) * power
      }
      bursting = true
      wake()
    }

    let particleSize = S.particleSize
    const drawGroup = (target: CanvasRenderingContext2D, group: Particle[]) => {
      target.beginPath()
      for (const p of group) {
        const size = Math.max(0.6, particleSize * (0.75 + p.weight * 0.45))
        target.moveTo(p.x + size / 2, p.y)
        target.arc(p.x, p.y, size / 2, 0, TAU)
      }
      target.fill()
    }

    const step = (now: number) => {
      const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 1 / 60
      last = now
      const frames = Math.max(dt * 60, 0.001)
      const follow = reduced ? 1 : 1 - Math.pow(0.78, frames)
      const chase = 1 - Math.pow(0.82, frames)
      pointer.smoothX += (pointer.x - pointer.smoothX) * chase
      pointer.smoothY += (pointer.y - pointer.smoothY) * chase

      const repel = pointer.active && !reduced
      const drift = !reduced
      const time = now * 0.001
      let complete = true
      let moving = false
      let settling = false
      for (const b of buckets) b.length = 0

      for (const p of particles) {
        let baseX = p.targetX
        let baseY = p.targetY
        let progress = 1

        if (gathering) {
          progress = clamp((now - gatherStart - p.delay) / S.gatherDuration, 0, 1)
          const eased = easeOutCubic(progress)
          baseX = p.startX + (p.targetX - p.startX) * eased
          baseY = p.startY + (p.targetY - p.startY) * eased
          if (progress < 1) complete = false
        } else if (drift) {
          baseX += Math.sin(time * 0.9 + p.seed * 10) * S.idleDrift * p.depth
          baseY += Math.cos(time * 0.75 + p.depth * 10) * S.idleDrift * p.depth
        }

        if (bursting) {
          p.vx += (-BURST_SPRING * p.ox - BURST_DAMPING * p.vx) * dt
          p.vy += (-BURST_SPRING * p.oy - BURST_DAMPING * p.vy) * dt
          p.ox += p.vx * dt
          p.oy += p.vy * dt
          if (Math.abs(p.ox) + Math.abs(p.oy) > 0.05 || Math.abs(p.vx) + Math.abs(p.vy) > 1) settling = true
          else { p.ox = p.oy = p.vx = p.vy = 0 }
          baseX += p.ox
          baseY += p.oy
        }

        if (repel) {
          const dx = baseX - pointer.smoothX
          const dy = baseY - pointer.smoothY
          const dist = Math.hypot(dx, dy)
          if (dist > 0 && dist < S.repelRadius) {
            const force = Math.pow(1 - dist / S.repelRadius, 2) * S.pointerRepel
            baseX += (dx / dist) * force
            baseY += (dy / dist) * force
          }
        }

        const moveX = (baseX - p.x) * follow
        const moveY = (baseY - p.y) * follow
        p.x += moveX
        p.y += moveY
        if (Math.abs(moveX) + Math.abs(moveY) > 0.02) moving = true

        const heat = clamp((Math.hypot(p.x - p.targetX, p.y - p.targetY) - HEAT_DEADZONE) / HEAT_RANGE, 0, 1)
        const tone = Math.round(heat * (TONES - 1))
        const fade = Math.round(progress * (FADES - 1))
        buckets[fade * TONES + tone].push(p)
      }

      if (gathering && complete) gathering = false
      if (bursting && !settling) bursting = false

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalAlpha = 1
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      layerCtx.setTransform(1, 0, 0, 1, 0, 0)
      layerCtx.clearRect(0, 0, layer.width, layer.height)
      layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      layerCtx.fillStyle = 'rgb(255, 255, 255)'
      let lit = false
      for (let f = 0; f < FADES; f++) {
        for (let t = 1; t < TONES; t++) {
          const group = buckets[f * TONES + t]
          if (!group.length) continue
          layerCtx.globalAlpha = (t / (TONES - 1)) * fadeAlpha(f)
          drawGroup(layerCtx, group)
          lit = true
        }
      }
      if (lit) {
        ctx.shadowColor = 'rgb(255, 255, 255)'
        ctx.shadowBlur = (5 + particleSize * 1.5) * dpr
        ctx.drawImage(layer, 0, 0, width, height)
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
      }
      for (let f = 0; f < FADES; f++) {
        ctx.globalAlpha = fadeAlpha(f)
        for (let t = 0; t < TONES; t++) {
          const group = buckets[f * TONES + t]
          if (!group.length) continue
          ctx.fillStyle = PALETTE[t]
          drawGroup(ctx, group)
        }
      }
      ctx.globalAlpha = 1
      return gathering || moving || repel || drift || bursting
    }

    const frame = (now: number) => {
      raf = 0
      if (!alive || !visible) return
      if (step(now)) raf = requestAnimationFrame(frame)
    }
    function wake() {
      if (raf || !alive || !visible) return
      last = 0
      raf = requestAnimationFrame(frame)
    }

    const sampleText = () => {
      const rect = wrap.getBoundingClientRect()
      width = Math.floor(rect.width) || 800
      height = Math.floor(rect.height) || 240
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      layer.width = canvas.width
      layer.height = canvas.height

      const family = getComputedStyle(wrap).fontFamily
      const small = width < 520
      particleSize = small ? 1.8 : S.particleSize
      const off = document.createElement('canvas')
      const offCtx = off.getContext('2d', { willReadFrequently: true })
      if (!offCtx) return
      offCtx.font = `700 100px ${family}`
      const unit = offCtx.measureText(text).width / 100
      const fontSizePx = Math.floor(clamp((width * 0.88) / unit, 36, 120))
      offCtx.font = `700 ${fontSizePx}px ${family}`
      const metrics = offCtx.measureText(text)
      off.width = Math.ceil(metrics.width) + 30
      off.height = Math.ceil(fontSizePx * 1.2) + 30
      offCtx.font = `700 ${fontSizePx}px ${family}`
      offCtx.textAlign = 'left'
      offCtx.textBaseline = 'middle'
      offCtx.fillStyle = '#FFFFFF'
      offCtx.fillText(text, 15, off.height / 2)

      const data = offCtx.getImageData(0, 0, off.width, off.height).data
      const targets: { x: number; y: number; alpha: number }[] = []
      const stepSize = small ? 3 : S.density
      for (let y = 0; y < off.height; y += stepSize) {
        for (let x = 0; x < off.width; x += stepSize) {
          const alpha = data[(y * off.width + x) * 4 + 3]
          if (alpha > 40) targets.push({ x: width / 2 - off.width / 2 + x, y: height / 2 - off.height / 2 + y, alpha: alpha / 255 })
        }
      }
      const maxParticles = Math.max(900, Math.min(4800, Math.floor((width * height) / 95)))
      const stride = Math.max(1, Math.ceil(targets.length / maxParticles))
      particles = targets
        .filter((_, idx) => idx % stride === 0)
        .map((t, i) => ({
          x: t.x, y: t.y, startX: t.x, startY: t.y, targetX: t.x, targetY: t.y,
          weight: t.alpha,
          seed: ((i * 9301 + 49297) % 233280) / 233280,
          depth: 0.45 + (((i * 233 + 97) % 1000) / 1000) * 0.9,
          delay: 0, ox: 0, oy: 0, vx: 0, vy: 0,
        }))
      startIntro(true)
    }

    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return [e.clientX - rect.left, e.clientY - rect.top] as const
    }
    const onEnter = (e: PointerEvent) => {
      const [x, y] = local(e)
      pointer.x = pointer.smoothX = x
      pointer.y = pointer.smoothY = y
      pointer.active = true
      wake()
    }
    const onMove = (e: PointerEvent) => {
      const [x, y] = local(e)
      pointer.x = x
      pointer.y = y
      pointer.active = true
      wake()
    }
    const onLeave = () => { pointer.active = false; wake() }
    const onDown = (e: PointerEvent) => { const [x, y] = local(e); burst(x, y) }
    canvas.addEventListener('pointerenter', onEnter)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('pointerdown', onDown)

    let resizeTimer = 0
    let lastWidth = 0
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width)
      if (w === lastWidth) return
      lastWidth = w
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(sampleText, 120)
    })
    ro.observe(wrap)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) wake()
    })
    io.observe(wrap)

    const onMotionChange = () => { reduced = reducedQuery.matches; sampleText() }
    reducedQuery.addEventListener('change', onMotionChange)

    const family = getComputedStyle(wrap).fontFamily
    Promise.race([
      document.fonts
        .load(`700 64px ${family}`)
        .then(() => document.fonts.ready)
        .catch(() => undefined),
      new Promise((resolve) => window.setTimeout(resolve, 2500)),
    ]).then(() => { if (alive) sampleText() }).catch(() => undefined)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      window.clearTimeout(resizeTimer)
      ro.disconnect()
      io.disconnect()
      reducedQuery.removeEventListener('change', onMotionChange)
      canvas.removeEventListener('pointerenter', onEnter)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointerdown', onDown)
    }
  }, [text])

  return (
    <div ref={wrapRef} className={`relative isolate block touch-pan-y overflow-hidden font-mc-display ${className ?? ''}`}>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full cursor-crosshair" />
      {children}
    </div>
  )
}
