'use client'

import { useEffect, useRef, type ReactNode } from 'react'

const COLORS = ['#ffffff', '#f8fafc', '#e4e4e7']
const GAP = 6
const PIXEL = 2.2
const SPEED = 35
const SPOTLIGHT = 0.7
const GLOW = 0.5
const OPACITY = 0.6
const FADE = 0.6
const APPEAR = 0.26
const EXIT = 0.22

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const smoothstep = (e0: number, e1: number, v: number) => {
  const t = clamp((v - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}
const easeOutBack = (t: number) => {
  const u = t - 1
  return 1 + 2.9 * u * u * u + 1.9 * u * u
}

type Pulse = { x: number; y: number; radius: number; power: number }

/** Cartão com campo de pixels que se acende a partir do ponteiro (hover/foco) e pulsa ao toque. */
export function PixelCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const containerRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!container || !canvas || !ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let alive = true
    let raf = 0
    let last = 0
    let visible = true
    let width = 0, height = 0, ratio = 1, key = ''
    let count = 0
    let x = new Float32Array(0), y = new Float32Array(0)
    let tint = new Uint8Array(0)
    let size = new Float32Array(0), phase = new Float32Array(0), rate = new Float32Array(0)
    let jitter = new Float32Array(0), presence = new Float32Array(0), delay = new Float32Array(0)
    let mask = new Float32Array(0)
    let maskKey = ''
    let active = false
    let time = 0, changedAt = 0, dt = 1 / 60
    let originX = 0, originY = 0, maxDistance = 1
    let pointerX = 0, pointerY = 0, spotX = 0, spotY = 0, spotVX = 0, spotVY = 0, spotPower = 0
    let hovering = false
    let pulses: Pulse[] = []

    const schedule = () => {
      const span = 0.6
      let far = 1
      for (let i = 0; i < count; i++) far = Math.max(far, Math.hypot(x[i] - originX, y[i] - originY))
      maxDistance = far
      for (let i = 0; i < count; i++) {
        const d = Math.hypot(x[i] - originX, y[i] - originY) / far
        delay[i] = active ? d * span * 0.82 + jitter[i] * span * 0.18 : (1 - d) * span * 0.45 + jitter[i] * span * 0.1
      }
    }

    const build = () => {
      const rect = container.getBoundingClientRect()
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      ratio = Math.min(window.devicePixelRatio || 1, 2)
      const next = `${width}|${height}|${ratio}`
      if (next === key) return
      key = next
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      const columns = Math.floor((width - 1) / GAP) + 1
      const rows = Math.floor((height - 1) / GAP) + 1
      const offX = (width - (columns - 1) * GAP) / 2
      const offY = (height - (rows - 1) * GAP) / 2
      count = columns * rows
      x = new Float32Array(count); y = new Float32Array(count)
      tint = new Uint8Array(count); size = new Float32Array(count)
      phase = new Float32Array(count); rate = new Float32Array(count)
      jitter = new Float32Array(count); presence = new Float32Array(count); delay = new Float32Array(count)
      let i = 0
      for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows; r++) {
          x[i] = offX + c * GAP
          y[i] = offY + r * GAP
          tint[i] = Math.floor(Math.random() * COLORS.length)
          size[i] = PIXEL * (0.3 + Math.random() * 0.7)
          phase[i] = Math.random() * Math.PI * 2
          rate[i] = 0.55 + Math.random() * 0.9
          jitter[i] = Math.random()
          i++
        }
      }
      maskKey = ''
      schedule()
    }

    const draw = () => {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.clearRect(0, 0, width, height)

      if (maskKey !== `${count}|${width}|${height}`) {
        maskKey = `${count}|${width}|${height}`
        mask = new Float32Array(count)
        const near = Math.min(width, height) * 0.05
        const far = Math.min(width, height) * 0.42
        for (let i = 0; i < count; i++) {
          const edge = Math.min(x[i], width - x[i], y[i], height - y[i])
          const t = clamp((edge - near) / (far - near), 0, 1)
          mask[i] = 1 - FADE * t * t * t * (t * (t * 6 - 15) + 10)
        }
      }

      let sum = 0
      const elapsed = time - changedAt
      const appearStep = dt / APPEAR
      const exitStep = dt / EXIT
      for (let i = 0; i < count; i++) {
        const current = presence[i]
        const ready = elapsed >= delay[i] || reduce
        const target = active ? (ready ? 1 : 0) : ready ? 0 : current
        if (reduce) presence[i] = target
        else if (target > current) presence[i] = Math.min(1, current + appearStep)
        else if (target < current) presence[i] = Math.max(0, current - exitStep)
        sum += presence[i]
      }

      const avg = count ? sum / count : 0
      if (avg > 0.001) {
        const cx = spotPower > 0.01 ? spotX : originX
        const cy = spotPower > 0.01 ? spotY : originY
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.85)
        const strength = GLOW * OPACITY * 0.4 * Math.min(1, avg * 1.4)
        g.addColorStop(0, `rgba(255,255,255,${strength})`)
        g.addColorStop(0.45, `rgba(255,255,255,${strength * 0.35})`)
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, width, height)
      }

      const spotRadius = Math.min(width, height) * 0.38 + 30
      const spotStrength = SPOTLIGHT * spotPower
      const frequency = (SPEED / 35) * 1.35
      for (let c = 0; c < COLORS.length; c++) {
        ctx.fillStyle = COLORS[c]
        for (let i = 0; i < count; i++) {
          if (tint[i] !== c) continue
          const p = presence[i]
          if (p <= 0.002) continue
          let s = size[i]
          let alpha = 0.5 + p * 0.38
          if (!reduce) {
            const wave = Math.sin(phase[i] + time * frequency * rate[i])
            s *= 0.62 + 0.38 * wave
            alpha += 0.12 * wave
          }
          s *= easeOutBack(p)
          const flash = p < 1 && active ? Math.sin(p * Math.PI) : 0
          s *= 1 + flash * 0.9
          alpha += flash * 0.6
          if (spotStrength > 0.001) {
            const near = smoothstep(spotRadius, 0, Math.hypot(x[i] - spotX, y[i] - spotY))
            s *= 1 + spotStrength * near * near * 2.4
            alpha += spotStrength * near * 0.45
          }
          alpha = Math.min(1, alpha) * mask[i] * OPACITY
          if (alpha <= 0.004) continue
          for (let k = 0; k < pulses.length; k++) {
            const pulse = pulses[k]
            const band = (Math.hypot(x[i] - pulse.x, y[i] - pulse.y) - pulse.radius) / 26
            const wave = Math.exp(-band * band) * pulse.power
            s *= 1 + wave * 1.4
            alpha = Math.min(1, alpha + wave * 0.5)
          }
          if (s <= 0.05) continue
          ctx.globalAlpha = alpha
          ctx.fillRect(x[i] - s * 0.5, y[i] - s * 0.5, s, s)
        }
      }
      ctx.globalAlpha = 1
      return sum
    }

    const frame = (now: number) => {
      raf = 0
      if (!alive) return
      dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      time += dt
      const want = hovering && !reduce ? 1 : 0
      spotPower += (want - spotPower) * (1 - Math.exp(-(want ? 6 : 3) * dt))
      const stiffness = 120
      const damping = 2 * Math.sqrt(stiffness) * 0.9
      spotVX += (stiffness * (pointerX - spotX) - damping * spotVX) * dt
      spotVY += (stiffness * (pointerY - spotY) - damping * spotVY) * dt
      spotX += spotVX * dt
      spotY += spotVY * dt
      const pulseSpeed = maxDistance / 0.6
      pulses = pulses.filter((p) => {
        p.radius += pulseSpeed * dt
        p.power = Math.max(0, 1 - p.radius / (maxDistance + 40))
        return p.power > 0
      })
      const sum = draw()
      if ((active || sum > 0 || pulses.length > 0 || spotPower > 0.002) && visible) raf = requestAnimationFrame(frame)
      else last = 0
    }
    const wake = () => {
      if (!raf && alive && visible) raf = requestAnimationFrame(frame)
    }

    const setActive = (val: boolean, px?: number, py?: number) => {
      if (active === val) return
      active = val
      changedAt = time
      if (val) {
        originX = px ?? width / 2
        originY = py ?? height / 2
        container.setAttribute('data-active', 'true')
      } else {
        container.removeAttribute('data-active')
      }
      schedule()
      wake()
    }
    const local = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      return [e.clientX - rect.left, e.clientY - rect.top] as const
    }
    const onEnter = (e: PointerEvent) => {
      const [px, py] = local(e)
      hovering = true
      pointerX = px; pointerY = py
      if (spotPower < 0.01) { spotX = px; spotY = py }
      setActive(true, px, py)
    }
    const onMove = (e: PointerEvent) => {
      const [px, py] = local(e)
      pointerX = px; pointerY = py
      wake()
    }
    const onLeave = () => { hovering = false; setActive(false) }
    const onDown = (e: PointerEvent) => {
      const [px, py] = local(e)
      pulses.push({ x: px, y: py, radius: 0, power: 1 })
      wake()
    }
    const onFocusIn = () => { hovering = false; setActive(true) }
    const onFocusOut = () => setActive(false)

    container.addEventListener('pointerenter', onEnter)
    container.addEventListener('pointermove', onMove)
    container.addEventListener('pointerleave', onLeave)
    container.addEventListener('pointerdown', onDown)
    container.addEventListener('focusin', onFocusIn)
    container.addEventListener('focusout', onFocusOut)

    build()
    const ro = new ResizeObserver(build)
    ro.observe(container)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) wake()
    })
    io.observe(container)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      container.removeEventListener('pointerenter', onEnter)
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerleave', onLeave)
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('focusin', onFocusIn)
      container.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return (
    <article
      ref={containerRef}
      className={`group relative isolate flex flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-[#18181e] to-[#0d0d10] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.9),0_8px_18px_-10px_rgba(0,0,0,0.7)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:hover:-translate-y-2 ${className}`}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 block h-full w-full" />
      <div className="relative z-[1] flex flex-1 flex-col">{children}</div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.2)] transition-shadow duration-300 group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] group-focus-within:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]"
      />
    </article>
  )
}
