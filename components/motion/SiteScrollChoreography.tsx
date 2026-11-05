'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger, useGSAP)

const OPTED_OUT_SELECTOR =
  '[data-hero], [data-login-stage], [data-portal], [data-finale], [data-chapter], [data-traditions], [data-no-scroll-choreography]'

function insideOptedOut(el: Element) {
  return Boolean(el.closest(OPTED_OUT_SELECTOR))
}

function isOperationalPath(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/platform') ||
    pathname.includes('/placar')
  )
}

export function SiteScrollChoreography({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const scopeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120)
    return () => window.clearTimeout(id)
  }, [pathname])

  useGSAP(
    () => {
      const rootEl = scopeRef.current
      if (!rootEl) return

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (isOperationalPath(pathname)) return

        const mark = <T extends Element>(selector: string) =>
          Array.from(rootEl.querySelectorAll<T>(selector)).filter((el) => !insideOptedOut(el))

        // 1) Painel fotográfico: recorte que se abre (mesma gramática do login)
        mark<HTMLElement>('[data-mc-visual]').forEach((visual) => {
          gsap
            .timeline()
            .fromTo(
              visual,
              { clipPath: 'inset(8% 8% 8% 8% round 22px)' },
              { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.2, ease: 'expo.out' },
              0,
            )
            .from(visual.querySelector('[data-mc-hero-media], [data-mc-img]'), { scale: 1.12, duration: 1.45, ease: 'expo.out' }, 0)
        })

        // 2) Hero de fundo (página de evento, dashboard): parallax no scroll
        mark<HTMLElement>('[data-mc-hero-media]').forEach((media) => {
          if (media.closest('[data-mc-visual]')) return
          const trigger = media.closest('section, header') || media
          gsap.fromTo(
            media,
            { scale: 1.08, yPercent: 0 },
            {
              scale: 1.02,
              yPercent: 14,
              ease: 'none',
              scrollTrigger: { trigger, start: 'top top', end: 'bottom top', scrub: true },
            },
          )
        })

        // 3) Títulos em máscara
        mark<HTMLElement>('[data-mc-line]').forEach((line) => {
          gsap.from(line, {
            yPercent: 115,
            duration: 0.9,
            ease: 'expo.out',
            scrollTrigger: { trigger: line.parentElement || line, start: 'top 94%', toggleActions: 'play none none none' },
          })
        })

        // 4) Painel ao lado da fotografia e blocos de apoio
        mark<HTMLElement>('[data-mc-panel]').forEach((panel) => {
          gsap.from(panel, { y: 28, duration: 0.85, ease: 'expo.out', delay: 0.12 })
        })
        mark<HTMLElement>('[data-mc-fade]').forEach((el) => {
          gsap.from(el, {
            autoAlpha: 0,
            y: 16,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 94%', toggleActions: 'play none none none' },
          })
        })

        // 5) Cards/linhas com velocidades diferentes
        mark<HTMLElement>('[data-mc-stagger]').forEach((group) => {
          const items = Array.from(group.children) as HTMLElement[]
          items.forEach((item, index) => {
            const lift = index % 3 === 1 ? 48 : index % 3 === 2 ? 28 : 16
            gsap.fromTo(
              item,
              { y: lift + 24 },
              {
                y: 0,
                ease: 'none',
                scrollTrigger: { trigger: item, start: 'top 96%', end: 'top 58%', scrub: 0.8 },
              },
            )
          })
        })

        mark<HTMLElement>('[data-mc-lift]').forEach((el) => {
          const lift = Number(el.dataset.mcLift) || 32
          gsap.fromTo(
            el,
            { y: 56 },
            {
              y: -lift,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 },
            },
          )
        })

        const candidates = Array.from(rootEl.querySelectorAll<HTMLElement>('main section, main article, [data-mc-reveal]')).filter(
          (el) => {
            if (insideOptedOut(el)) return false
            if (el.closest('[data-mc-stagger], [data-mc-visual], [data-mc-panel]')) return false
            return el.getBoundingClientRect().top > window.innerHeight * 0.7
          },
        )
        candidates.forEach((el) => {
          gsap.fromTo(
            el,
            { y: 32 },
            {
              y: 0,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 68%', scrub: 0.65 },
            },
          )
        })
      })

      return () => mm.revert()
    },
    { scope: scopeRef, dependencies: [pathname], revertOnUpdate: true },
  )

  return <div ref={scopeRef}>{children}</div>
}
