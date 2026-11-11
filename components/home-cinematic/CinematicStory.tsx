'use client'

import { Fragment, useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, BookOpen, CheckCircle2, ChevronDown } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { HeroParticleWordmark } from '@/components/home-cinematic/HeroParticleWordmark'
import ToriiMark from '@/components/brand/ToriiMark'
import { MartialPathTimeline } from '@/components/home-cinematic/MartialPathTimeline'
import { PATH_MILESTONES } from '@/lib/martial-arts/path-timeline'
import {
  HISTORICAL_BIBLIOGRAPHY,
  HISTORICAL_METAPHOR_DISCLAIMER,
  MARTIAL_ARTS_HISTORICAL_DOSSIER,
  OPERATIONAL_MODALITY_NOTICE,
  type MartialTraditionEntry,
} from '@/lib/martial-arts/historical-dossier'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger, useGSAP)

const CREATE_EVENT_HREF = '/login?mode=register&redirectTo=%2Fadmin%2Feventos%2Fnovo'
const IMG = '/images/cinematic'

type Theme = 'dark' | 'light'
type ChapterImage = { src: string; alt: string; caption: string }
type Chapter = {
  dossierId: string
  anchor: string
  name: string
  theme: Theme
  operational?: boolean
  images: [ChapterImage, ChapterImage, ChapterImage]
}

const CHAPTERS: Chapter[] = [
  {
    dossierId: 'japan-jujutsu-to-judo',
    anchor: 'judo',
    name: 'Judô',
    theme: 'dark',
    images: [
      { src: `${IMG}/judo-1.jpg`, alt: 'Judogi branco dobrado com faixa preta sobre tatame de palha', caption: 'Judogi e tatame' },
      { src: `${IMG}/judo-3.jpg`, alt: 'Pés descalços de um praticante sobre o tatame', caption: 'Postura' },
      { src: `${IMG}/judo-2.jpg`, alt: 'Silhueta de dois judocas durante uma projeção diante de janelas de papel', caption: 'Randori' },
    ],
  },
  {
    dossierId: 'okinawa-karate',
    anchor: 'karate',
    name: 'Karatê',
    theme: 'light',
    images: [
      { src: `${IMG}/karate-1.jpg`, alt: 'Praticante de karatê em base de kata num terraço de pedra à beira-mar', caption: 'Kata ao amanhecer' },
      { src: `${IMG}/karate-2.jpg`, alt: 'Makiwara de madeira com corda num pátio de pedra', caption: 'Makiwara' },
      { src: `${IMG}/karate-3.jpg`, alt: 'Punho fechado com a manga de um karategi branco', caption: 'Mãos vazias' },
    ],
  },
  {
    dossierId: 'thailand-muay-thai',
    anchor: 'muay-thai',
    name: 'Muay Thai',
    theme: 'dark',
    images: [
      { src: `${IMG}/muay-1.jpg`, alt: 'Mãos sendo enfaixadas com bandagem de algodão antes da luta', caption: 'Bandagem' },
      { src: `${IMG}/muay-2.jpg`, alt: 'Canto de um ringue vazio com cordas vermelhas e brancas', caption: 'O ringue' },
      { src: `${IMG}/muay-3.jpg`, alt: 'Lutador de costas no ringue sob uma luz única', caption: 'Antes do round' },
    ],
  },
  {
    dossierId: 'korea-taekwondo',
    anchor: 'taekwondo',
    name: 'Taekwondo',
    theme: 'light',
    images: [
      { src: `${IMG}/tkd-1.jpg`, alt: 'Atleta de dobok branco executando um chute alto', caption: 'Chute lateral' },
      { src: `${IMG}/tkd-2.jpg`, alt: 'Colete protetor azul e dobok dobrado sobre tatame modular', caption: 'Equipamento' },
      { src: `${IMG}/tkd-3.jpg`, alt: 'Área de competição octogonal vazia numa arena', caption: 'Área de luta' },
    ],
  },
  {
    dossierId: 'brazil-jiu-jitsu',
    anchor: 'jiu-jitsu',
    name: 'Jiu-Jitsu',
    theme: 'dark',
    operational: true,
    images: [
      { src: `${IMG}/bjj-1.jpg`, alt: 'Nó de faixa preta amarrada sobre um kimono azul-marinho', caption: 'Faixa preta' },
      { src: `${IMG}/bjj-3.jpg`, alt: 'Atleta de kimono branco passando esparadrapo nos dedos', caption: 'Aquecimento' },
      { src: `${IMG}/bjj-2.jpg`, alt: 'Dois atletas de kimono branco e azul em guarda fechada no tatame', caption: 'Guarda fechada' },
    ],
  },
]

const DOSSIER_BY_ID = new Map(MARTIAL_ARTS_HISTORICAL_DOSSIER.map((entry) => [entry.id, entry]))
const PLURAL_ORIGINS = MARTIAL_ARTS_HISTORICAL_DOSSIER.find((entry) => entry.id === 'antiquity-plural-origins')

const STATEMENT_LINES = [
  { text: 'Muitas', alt: false },
  { text: 'tradições.', alt: true },
  { text: 'Uma mesma', alt: false },
  { text: 'pergunta.', alt: true },
]

const FINALE_LINES = [['Agora é', 'sua vez'], ['de organizar.']]

// Números do caminho. Os dois primeiros vêm dos próprios dados; os ~4.000 anos vão de c. 2000 a.C. (Beni Hasan) a 2000 (Sydney).
const formatCount = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const STATS = [
  { value: PATH_MILESTONES.length, label: 'marcos documentados' },
  { value: CHAPTERS.length, label: 'tradições no caminho' },
  { value: 4000, label: 'anos de história de luta' },
]

// Frase do manifesto (revelada palavra a palavra na rolagem). Resume a transformação descrita no dossiê: espaço delimitado, árbitro e regras.
const MANIFESTO_WORDS = 'Todo combate precisa de um lugar, de um juiz e de uma regra. Foi assim que o treino, aos poucos, virou competição.'.split(' ')

const fgMix = (percent: number) => `color-mix(in srgb, var(--story-fg) ${percent}%, transparent)`

function MaskedLines({ lines, lineAttr }: { lines: string[][]; lineAttr: string }) {
  return (
    <>
      {lines.map((group) => (
        <span key={group.join(' ')} className="block">
          {group.map((word, index) => (
            <Fragment key={word}>
              <span className="-mb-[0.1em] block overflow-hidden pb-[0.1em] md:inline-block">
                <span {...{ [lineAttr]: '' }} className="block will-change-transform">
                  {word}
                </span>
              </span>
              {index < group.length - 1 ? ' ' : null}
            </Fragment>
          ))}
        </span>
      ))}
    </>
  )
}

function ChapterFigure({
  image,
  className,
  speed,
  scrub,
}: {
  image: ChapterImage
  className: string
  speed: number
  scrub: number
}) {
  return (
    <figure data-parallax={speed} data-scrub={scrub} className={`p-1 md:p-1.5 ${className}`}>
      <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: fgMix(8) }}>
        <div data-parallax-inner className="absolute inset-x-0 -inset-y-[8%]">
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 32vw, 62vw" className="object-cover" />
        </div>
        {/* Cortina: cobre a foto e sobe conforme ela entra na tela (só transform). Sem movimento fica recolhida. */}
        <div aria-hidden="true" data-curtain className="absolute inset-0 origin-top scale-y-0 bg-[var(--story-bg)]" />
      </div>
      <figcaption className="mt-2 font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.16em] opacity-70">
        {image.caption}
      </figcaption>
    </figure>
  )
}

function ChapterText({ chapter, entry }: { chapter: Chapter; entry: MartialTraditionEntry }) {
  return (
    <div data-chapter-text className="bg-[var(--story-bg)] px-1 py-6 md:p-6">
      <p className="font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.18em] opacity-70">
        {entry.period}
      </p>
      <h3
        id={`${chapter.anchor}-title`}
        className="mt-3 font-mc-display text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-[clamp(1.5rem,1.9vw,2.25rem)]"
      >
        <span className="sr-only">{chapter.name}: </span>
        {entry.title}
      </h3>
      <p className="mt-4 font-mc-interface text-base leading-7 opacity-80">{entry.summaryShort}</p>
      <div className="mt-6 border-t pt-4" style={{ borderColor: fgMix(22) }}>
        <p className="font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.18em] opacity-70">Na competição</p>
        <p className="mt-2 font-mc-interface text-mc-small opacity-85">{entry.competitionTransformation}</p>
      </div>
      {chapter.operational ? (
        <p className="mt-6 inline-flex min-h-9 items-center gap-2 rounded-mc-full bg-mc-action px-4 font-mc-interface text-mc-caption font-bold uppercase tracking-[0.14em] text-white">
          <CheckCircle2 aria-hidden="true" size={15} />
          Operacional no MEU CAMP
        </p>
      ) : null}
    </div>
  )
}

export function CinematicStory() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const rootEl = root.current
      if (!rootEl) return
      const q = gsap.utils.selector(rootEl)
      const token = (name: string) =>
        `rgb(${getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/\s+/).join(', ')})`
      const themes: Record<Theme, Record<string, string>> = {
        dark: { '--story-bg': token('--mc-nav-dark'), '--story-fg': token('--mc-background') },
        light: { '--story-bg': token('--mc-background'), '--story-fg': token('--mc-text-primary') },
      }

      const themeShift = (trigger: Element, from: Theme, to: Theme) => {
        if (from === to) return
        gsap.fromTo(rootEl, { ...themes[from] }, {
          ...themes[to],
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger, start: 'top 75%', end: 'top 25%', scrub: true },
        })
      }

      const traditions = q('[data-traditions]')[0]
      if (traditions) themeShift(traditions, 'dark', 'light')
      const chapterEls = q('[data-chapter]')
      chapterEls.forEach((el, index) => {
        themeShift(el, index === 0 ? 'light' : CHAPTERS[index - 1].theme, CHAPTERS[index].theme)
      })

      const titles = q('[data-chapter-title]')
      chapterEls.forEach((el, index) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => {
            if (!self.isActive) return
            titles.forEach((title, titleIndex) => {
              title.dataset.active = String(titleIndex === index)
            })
          },
        })
      })

      const mm = gsap.matchMedia()
      mm.add(
        {
          isDesktop: '(min-width: 768px)',
          motionOk: '(prefers-reduced-motion: no-preference)',
        },
        (context) => {
          const { isDesktop, motionOk } = context.conditions as { isDesktop: boolean; motionOk: boolean }
          if (!motionOk) return

          q('[data-line-in]').forEach((el) => {
            gsap.from(el, {
              yPercent: 125,
              ease: 'none',
              scrollTrigger: { trigger: el.parentElement, start: 'top 95%', end: 'top 60%', scrub: 0.8 },
            })
          })
          q('[data-line-move]').forEach((el) => {
            gsap.to(el, {
              yPercent: 125,
              ease: 'none',
              scrollTrigger: { trigger: el, start: '-100% top', end: '30% top', scrub: 0.8 },
            })
          })

          const insetFor = (mask: Element, size: number, radius: number) => {
            const { clientWidth: w, clientHeight: h } = mask as HTMLElement
            const y = Math.max(0, (h - size) / 2)
            const x = Math.max(0, (w - size) / 2)
            return `inset(${y}px ${x}px ${y}px ${x}px round ${radius}px)`
          }

          const portal = q('[data-portal]')[0]
          const portalMask = q('[data-portal-mask]')[0]
          if (portal && portalMask) {
            const diameter = () =>
              isDesktop ? Math.min(window.innerWidth * 0.34, window.innerHeight * 0.62) : window.innerWidth * 0.74
            const range = { trigger: portal, start: 'top top', end: 'bottom bottom', scrub: 1 }
            gsap.fromTo(
              portalMask,
              { clipPath: () => insetFor(portalMask, diameter(), diameter() / 2) },
              { clipPath: 'inset(0px 0px 0px 0px round 0px)', ease: 'none', scrollTrigger: { ...range, invalidateOnRefresh: true } },
            )
            gsap
              .timeline({ scrollTrigger: range })
              .fromTo(q('[data-portal-img]'), { scale: 1.3 }, { scale: 1, ease: 'none', duration: 1 }, 0)
              .fromTo(q('[data-portal-shade]'), { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.3 }, 0.6)
              .fromTo(
                q('[data-portal-caption]'),
                { yPercent: 40, opacity: 0 },
                { yPercent: 0, opacity: 1, stagger: 0.06, ease: 'power2.out', duration: 0.25 },
                0.72,
              )
          }

          const pills = q('[data-pill]')
          if (pills.length) {
            gsap.from(pills, {
              y: 48,
              opacity: 0,
              stagger: 0.06,
              duration: 0.7,
              ease: 'power3.out',
              scrollTrigger: { trigger: pills[0].parentElement, start: 'top 85%', toggleActions: 'play none none reverse' },
            })
          }

          const parallaxScale = isDesktop ? 1 : 0.4
          q('[data-parallax]').forEach((el) => {
            gsap.to(el, {
              yPercent: -Number(el.dataset.parallax) * parallaxScale,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: Number(el.dataset.scrub) || 1 },
            })
          })
          q('[data-parallax-inner]').forEach((el) => {
            gsap.fromTo(
              el,
              { yPercent: -6 },
              { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } },
            )
          })

          q('[data-curtain]').forEach((el) => {
            gsap.fromTo(
              el,
              { scaleY: 1 },
              { scaleY: 0, transformOrigin: 'top', ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top 92%', end: 'top 50%', scrub: true } },
            )
          })

          const manifestoWords = q('[data-word]')
          if (manifestoWords.length) {
            gsap.fromTo(
              manifestoWords,
              { opacity: 0.14 },
              {
                opacity: 1,
                ease: 'none',
                stagger: 0.12,
                scrollTrigger: { trigger: manifestoWords[0].parentElement, start: 'top 78%', end: 'bottom 48%', scrub: true },
              },
            )
          }

          // Títulos gigantes dos capítulos: deslizam na lateral enquanto o capítulo passa.
          const chapterTitles = q('[data-chapter-title]')
          q('[data-chapter]').forEach((article, index) => {
            const title = chapterTitles[index]
            if (!title) return
            gsap.fromTo(
              title,
              { x: isDesktop ? '9vw' : '5vw' },
              { x: isDesktop ? '-5vw' : '-3vw', ease: 'none', scrollTrigger: { trigger: article, start: 'top bottom', end: 'bottom top', scrub: true } },
            )
          })

          // Texto de cada capítulo: entra em cascata (uma vez por entrada, reversível).
          q('[data-chapter-text]').forEach((block) => {
            gsap.from(Array.from(block.children), {
              y: 36,
              opacity: 0,
              stagger: 0.09,
              duration: 0.7,
              ease: 'power3.out',
              scrollTrigger: { trigger: block, start: 'top 82%', toggleActions: 'play none none reverse' },
            })
          })

          // Faixa lateral: duas linhas em sentidos opostos, ligadas à rolagem.
          const marqueeSection = q('[data-marquee]')[0]
          if (marqueeSection) {
            q('[data-marquee-row]').forEach((row) => {
              const direction = Number((row as HTMLElement).dataset.marqueeRow)
              gsap.fromTo(
                row,
                { xPercent: direction > 0 ? -45 : 0 },
                { xPercent: direction > 0 ? 0 : -45, ease: 'none', scrollTrigger: { trigger: marqueeSection, start: 'top bottom', end: 'bottom top', scrub: 0.6 } },
              )
            })
          }

          // Números do caminho: contagem a partir de zero ao entrar na tela.
          const counters = q('[data-count]') as HTMLElement[]
          counters.forEach((el) => {
            const end = Number(el.dataset.count)
            const tally = { value: 0 }
            el.textContent = formatCount(0)
            ScrollTrigger.create({
              trigger: el,
              start: 'top 88%',
              once: true,
              onEnter: () => {
                gsap.to(tally, { value: end, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = formatCount(Math.round(tally.value)) } })
              },
            })
          })

          // Barra de progresso da jornada (escala em X, só transform).
          const bar = q('[data-journey-bar]')[0]
          if (bar) {
            gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: rootEl, start: 'top top', end: 'bottom bottom', scrub: true } })
          }

          const finale = q('[data-finale]')[0]
          const finaleMask = q('[data-finale-mask]')[0]
          if (finale && finaleMask) {
            const side = () =>
              isDesktop ? Math.min(window.innerWidth * 0.3, window.innerHeight * 0.56) : window.innerWidth * 0.66
            const range = { trigger: finale, start: 'top top', end: 'bottom bottom', scrub: 1 }
            gsap.fromTo(
              finaleMask,
              { clipPath: () => insetFor(finaleMask, side(), 0) },
              { clipPath: 'inset(0px 0px 0px 0px round 0px)', ease: 'none', scrollTrigger: { ...range, invalidateOnRefresh: true } },
            )
            gsap
              .timeline({ scrollTrigger: range })
              .fromTo(q('[data-finale-img]'), { scale: 1.35 }, { scale: 1, ease: 'none', duration: 1 }, 0)
              .fromTo(q('[data-finale-shade]'), { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.4 }, 0.35)
              .fromTo(
                q('[data-finale-line]'),
                { yPercent: 125 },
                { yPercent: 0, ease: 'power2.out', stagger: 0.08, duration: 0.3 },
                0.5,
              )
              .fromTo(q('[data-finale-fade]'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.25 }, 0.7)
              .fromTo(q('[data-finale-torii]'), { opacity: 0, scale: 0.82 }, { opacity: 0.14, scale: 1.04, ease: 'none', duration: 0.7 }, 0.3)
          }

          // Se a preferência de movimento mudar, os números voltam ao valor final.
          return () => {
            counters.forEach((el) => { el.textContent = formatCount(Number(el.dataset.count)) })
          }
        },
      )

      // O caminho: em telas amplas e com movimento permitido, a seção fixa e os cartões atravessam na horizontal.
      // Fora disso (celular, tela baixa, movimento reduzido) permanece a lista vertical do HTML.
      mm.add(
        { wide: '(min-width: 768px) and (min-height: 560px)', motionOk: '(prefers-reduced-motion: no-preference)' },
        (context) => {
          const { wide, motionOk } = context.conditions as { wide: boolean; motionOk: boolean }
          if (!wide || !motionOk) return
          const section = q('[data-path]')[0] as HTMLElement | undefined
          const track = q('[data-path-track]')[0] as HTMLElement | undefined
          const line = q('[data-path-line]')[0]
          const yearEl = q('[data-path-year]')[0]
          const cards = q('[data-path-card]') as HTMLElement[]
          if (!section || !track || !line || !cards.length) return

          section.dataset.mode = 'h'
          const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
          let current = -1
          // Só escreve no DOM quando o marco ativo muda (identidade), nunca a cada quadro.
          const setActive = (index: number) => {
            if (index === current) return
            current = index
            cards.forEach((card, i) => { card.dataset.active = String(i === index) })
            if (yearEl) yearEl.textContent = PATH_MILESTONES[index].year
          }
          gsap
            .timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: () => `+=${distance()}`,
                pin: true,
                scrub: 1,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                // O pin muda a altura da página: ele atualiza antes dos gatilhos de tema dos capítulos (criados primeiro, mas abaixo no documento).
                refreshPriority: 1,
                onUpdate: (self) => setActive(Math.min(cards.length - 1, Math.round(self.progress * (cards.length - 1)))),
              },
            })
            .to(track, { x: () => -distance() }, 0)
            .to(line, { scaleX: 1 }, 0)
          // A seção mudou de altura ao virar horizontal: reposiciona os demais gatilhos.
          const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
          return () => {
            cancelAnimationFrame(frame)
            delete section.dataset.mode
            cards.forEach((card, i) => { card.dataset.active = String(i === 0) })
            if (yearEl) yearEl.textContent = PATH_MILESTONES[0].year
          }
        },
      )

      return () => mm.revert()
    },
    { scope: root },
  )

  const storyVars = {
    '--story-bg': 'rgb(var(--mc-nav-dark))',
    '--story-fg': 'rgb(var(--mc-background))',
  } as CSSProperties

  return (
    <div
      ref={root}
      style={storyVars}
      className="relative overflow-x-clip bg-[var(--story-bg)] text-[var(--story-fg)]"
    >
      {/* Progresso da jornada: linha fina sob a navbar, escala em X com a rolagem da página */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-16 z-[64] h-[3px] bg-transparent">
        <div data-journey-bar className="h-full origin-left scale-x-0 bg-mc-action" />
      </div>

      {/* Abertura: MEU CAMP em retícula de partículas */}
      <HeroParticleWordmark />

      {/* Declaração + portal circular (sticky circle grow) */}
      <section id="historia" aria-labelledby="story-statement-title" className="relative scroll-mt-0">
        <div className="px-4 pb-[12vh] pt-[22vh] text-center sm:px-8">
          <h2
            id="story-statement-title"
            className="font-mc-display text-[15vw] font-bold leading-[0.84] tracking-[-0.055em] md:text-[11.5vw]"
          >
            {STATEMENT_LINES.map((line) => (
              <span key={line.text} className="-mb-[0.1em] block overflow-hidden pb-[0.1em]">
                <span data-line-move className="block will-change-transform">
                  <span data-line-in className={`block ${line.alt ? 'font-normal opacity-60' : ''}`}>
                    {line.text}
                  </span>
                </span>
              </span>
            ))}
          </h2>
        </div>

        <div data-portal className="relative motion-safe:h-[200vh] md:motion-safe:h-[250vh]">
          <div className="relative h-[100svh] overflow-hidden motion-safe:sticky motion-safe:top-0">
            <div data-portal-mask className="absolute inset-0 overflow-hidden">
              <div data-portal-img className="absolute inset-0 will-change-transform">
                <Image src={`${IMG}/dojo-wide.jpg`} alt="" fill sizes="100vw" className="object-cover" />
              </div>
              <div data-portal-shade aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-mc-nav-dark/85 via-mc-nav-dark/30 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 px-5 pb-12 text-white sm:px-8 md:pb-16 lg:px-12 xl:px-20">
              <p data-portal-caption className="font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.2em] text-white/80">
                Raízes plurais
              </p>
              <p
                data-portal-caption
                className="mt-4 max-w-4xl font-mc-display text-[1.75rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-4xl md:text-5xl"
              >
                As artes marciais nasceram em muitos lugares. Quando o treino virou competição, todas precisaram de regras
                claras, categorias justas e tempo aferido.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Faixa lateral: os nomes das tradições deslizam em sentidos opostos conforme a rolagem (decorativa) */}
      <section aria-hidden="true" data-marquee className="relative select-none overflow-hidden py-10 md:py-16">
        {([-1, 1] as const).map((direction) => (
          <div
            key={direction}
            data-marquee-row={direction}
            className="flex w-max gap-[4vw] whitespace-nowrap py-1 font-mc-display text-[16vw] font-bold leading-[0.95] tracking-[-0.05em] text-transparent md:text-[9vw]"
            style={{ WebkitTextStroke: '1.5px color-mix(in srgb, var(--story-fg) 45%, transparent)' }}
          >
            {[...CHAPTERS, ...CHAPTERS, ...CHAPTERS].map((chapter, index) => (
              <span key={`${chapter.anchor}-${index}`}>{chapter.name}</span>
            ))}
          </div>
        ))}
      </section>

      {/* Tradições */}
      <section
        data-traditions
        aria-labelledby="traditions-title"
        className="relative px-5 py-24 sm:px-8 md:py-36 lg:px-12 xl:px-20"
      >
        <div className="grid gap-6 md:grid-cols-12 md:gap-8">
          <p className="font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.2em] opacity-70 md:col-span-3 md:pt-3">
            Tradições
          </p>
          <div className="md:col-span-9">
            <h2
              id="traditions-title"
              className="max-w-4xl font-mc-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] md:text-6xl"
            >
              Nenhuma origem única. Muitas linhagens, cada uma com sua forma de competir.
            </h2>
            {PLURAL_ORIGINS ? (
              <p className="mt-6 max-w-2xl font-mc-interface text-base leading-7 opacity-80 md:text-lg md:leading-8">
                {PLURAL_ORIGINS.summaryShort} {PLURAL_ORIGINS.documentedFacts[1]}
              </p>
            ) : null}
          </div>
        </div>

        <nav aria-label="Capítulos da história" className="mx-auto mt-16 flex max-w-6xl flex-wrap justify-center gap-2 md:mt-24 md:gap-3">
          {CHAPTERS.map((chapter) => (
            <a
              key={chapter.anchor}
              href={`#${chapter.anchor}`}
              data-pill
              style={{ borderColor: fgMix(35) }}
              className="inline-flex min-h-12 items-center gap-3 rounded-mc-full border px-6 py-2.5 font-mc-display text-[8.5vw] font-medium leading-[0.95] tracking-[-0.035em] transition-colors duration-mc-normal hover:bg-[var(--story-fg)] hover:text-[var(--story-bg)] md:px-9 md:py-4 md:text-[4vw]"
            >
              {chapter.name}
              {chapter.operational ? (
                <span className="inline-flex items-center gap-1.5 rounded-mc-full bg-mc-action px-2.5 py-1 font-mc-interface text-[0.6875rem] font-bold uppercase leading-none tracking-[0.14em] text-white">
                  <CheckCircle2 aria-hidden="true" size={12} />
                  Operacional
                </span>
              ) : null}
            </a>
          ))}
        </nav>
      </section>

      {/* Manifesto: a frase se acende palavra a palavra com a rolagem */}
      <section aria-label="Manifesto" className="relative px-5 py-24 sm:px-8 md:py-40 lg:px-12 xl:px-20">
        <p className="mx-auto max-w-5xl font-mc-display text-[1.875rem] font-semibold leading-[1.12] tracking-[-0.035em] sm:text-5xl md:text-6xl lg:text-7xl">
          {MANIFESTO_WORDS.map((word, index) => (
            <Fragment key={`${word}-${index}`}>
              <span data-word>{word}</span>
              {index < MANIFESTO_WORDS.length - 1 ? ' ' : null}
            </Fragment>
          ))}
        </p>
      </section>

      <MartialPathTimeline />

      {/* Números do caminho: sobem de zero quando entram na tela (uma vez) */}
      <section aria-label="O caminho em números" className="relative px-5 py-20 sm:px-8 md:py-32 lg:px-12 xl:px-20">
        <dl className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3 md:gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="border-t pt-5" style={{ borderColor: fgMix(30) }}>
              <dt className="order-2 mt-3 font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.18em] opacity-70">{stat.label}</dt>
              <dd data-count={stat.value} className="font-mc-display text-[22vw] font-bold leading-none tracking-[-0.05em] md:text-[9vw]">
                {formatCount(stat.value)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Capítulos: grade em parallax + título gigante sticky */}
      <section aria-label="Capítulos históricos" className="relative">
        <div aria-hidden="true" className="pointer-events-none sticky top-[100svh] z-0 h-0">
          {CHAPTERS.map((chapter, index) => (
            <p
              key={chapter.anchor}
              data-chapter-title
              data-active={index === 0}
              className="absolute bottom-4 left-3 whitespace-nowrap font-mc-display text-[17vw] font-bold leading-[0.78] tracking-[-0.055em] opacity-0 transition-opacity duration-mc-fast data-[active=true]:opacity-100 md:bottom-6 md:left-6"
            >
              {chapter.name}
            </p>
          ))}
        </div>

        {CHAPTERS.map((chapter) => {
          const entry = DOSSIER_BY_ID.get(chapter.dossierId)
          if (!entry) return null
          const [first, second, third] = chapter.images
          return (
            <article
              key={chapter.anchor}
              id={chapter.anchor}
              data-chapter
              aria-labelledby={`${chapter.anchor}-title`}
              className="relative z-10 scroll-mt-24 px-3 pb-[16vh] pt-[8vh] md:px-6 md:pb-[30vh] md:pt-[12vh]"
            >
              <div className="flex flex-wrap items-start">
                <ChapterFigure image={first} speed={30} scrub={1} className="order-1 w-[58%] md:order-none md:w-[26%]" />
                <div data-parallax={10} data-scrub={1} className="order-3 w-full md:order-none md:ml-[6%] md:mt-[12vw] md:w-[30%]">
                  <ChapterText chapter={chapter} entry={entry} />
                </div>
                <ChapterFigure
                  image={second}
                  speed={50}
                  scrub={2}
                  className="order-2 ml-auto mt-[34vw] w-[38%] md:order-none md:ml-[8%] md:mt-[3vw] md:w-[18%]"
                />
                <ChapterFigure
                  image={third}
                  speed={40}
                  scrub={1.5}
                  className="order-4 ml-[22%] mt-6 w-[64%] md:order-none md:ml-[66%] md:-mt-[10vw] md:w-[30%]"
                />
              </div>
            </article>
          )
        })}
      </section>

      {/* Dossiê historiográfico */}
      <section
        id="dossie-historico"
        aria-labelledby="dossier-title"
        className="relative z-10 px-5 py-24 sm:px-8 md:py-32 lg:px-12 xl:px-20"
      >
        <div className="grid gap-10 border-t pt-10 md:grid-cols-12 md:gap-8" style={{ borderColor: fgMix(22) }}>
          <div className="md:col-span-4">
            <p className="font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.2em] opacity-70">Rigor histórico</p>
            <h2
              id="dossier-title"
              className="mt-4 font-mc-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] md:text-5xl"
            >
              Fatos, interpretações e tradições orais. Separados.
            </h2>
          </div>
          <div className="space-y-5 font-mc-interface text-base leading-7 md:col-span-8">
            <p className="opacity-85">{HISTORICAL_METAPHOR_DISCLAIMER}</p>
            <p className="opacity-85">{OPERATIONAL_MODALITY_NOTICE}</p>
            <p className="text-mc-small opacity-70">
              As fotografias desta página são ilustrações produzidas para ambientação. Não são registros históricos.
            </p>

            <details className="group border-y" style={{ borderColor: fgMix(22) }} onToggle={() => ScrollTrigger.refresh()}>
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-mc-interface text-sm font-bold uppercase tracking-[0.14em] [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-3">
                  <BookOpen aria-hidden="true" size={18} />
                  Dossiê completo e bibliografia
                </span>
                <ChevronDown aria-hidden="true" size={18} className="transition-transform duration-mc-normal group-open:rotate-180" />
              </summary>

              <div className="space-y-10 pb-10 pt-4">
                {MARTIAL_ARTS_HISTORICAL_DOSSIER.map((entry) => (
                  <div key={entry.id}>
                    <p className="text-mc-caption font-semibold uppercase tracking-[0.18em] opacity-70">
                      {entry.region} · {entry.period}
                    </p>
                    <h3 className="mt-2 font-mc-display text-xl font-semibold leading-tight">{entry.title}</h3>
                    <div className="mt-4 grid gap-6 text-mc-small md:grid-cols-2">
                      <div>
                        <h4 className="text-mc-caption font-bold uppercase tracking-[0.16em] opacity-70">Fatos documentados</h4>
                        <ul className="mt-2 list-disc space-y-2 pl-4 opacity-85">
                          {entry.documentedFacts.map((fact) => (
                            <li key={fact}>{fact}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-mc-caption font-bold uppercase tracking-[0.16em] opacity-70">Interpretação historiográfica</h4>
                          {entry.historiographicalNotes.map((note) => (
                            <p key={note} className="mt-2 opacity-85">{note}</p>
                          ))}
                        </div>
                        <div>
                          <h4 className="text-mc-caption font-bold uppercase tracking-[0.16em] opacity-70">Tradição oral e narrativas populares</h4>
                          {entry.oralTraditionsOrMythsToAvoid.map((note) => (
                            <p key={note} className="mt-2 opacity-85">{note}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-8" style={{ borderColor: fgMix(22) }}>
                  <h3 className="font-mc-display text-xl font-semibold">Bibliografia</h3>
                  <ul className="mt-4 space-y-3 text-mc-small">
                    {HISTORICAL_BIBLIOGRAPHY.map((item) => (
                      <li key={item.id} className="opacity-85">
                        <strong className="font-semibold">{item.author} ({item.year}).</strong> <em>{item.title}</em>.{' '}
                        {item.publisherOrJournal}.
                        <span className="block opacity-75">{item.relevance}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Finale: o tatame se abre para a arena e para a demonstração */}
      <section data-finale aria-labelledby="finale-title" className="relative motion-safe:h-[180vh] md:motion-safe:h-[200vh]">
        <div className="relative h-[100svh] overflow-hidden motion-safe:sticky motion-safe:top-0">
          <div data-finale-mask className="absolute inset-0 overflow-hidden">
            <div data-finale-img className="absolute inset-0 will-change-transform">
              <Image src={`${IMG}/mc-arena.jpg`} alt="" fill sizes="100vw" className="object-cover" />
            </div>
            <div data-finale-shade aria-hidden="true" className="absolute inset-0 bg-mc-nav-dark/65" />
          </div>
          {/* Torii-fantasma da marca atrás do convite: surge e cresce de leve com a rolagem */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <ToriiMark variant="solid" data-finale-torii className="h-[74svh] w-auto text-white opacity-0" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-white">
            <p data-finale-fade className="font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.2em] text-white/80">
              Campeonatos abertos
            </p>
            <h2
              id="finale-title"
              className="mt-5 font-mc-display text-[12.5vw] font-bold leading-[0.88] tracking-[-0.05em] md:text-[7.5vw]"
            >
              <MaskedLines lines={FINALE_LINES} lineAttr="data-finale-line" />
            </h2>
            <div data-finale-fade className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/eventos"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-mc-small bg-mc-action px-6 font-mc-interface text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors duration-mc-normal hover:bg-blue-500"
              >
                Ver eventos
                <ArrowDown aria-hidden="true" size={16} />
              </Link>
              <Link
                href={CREATE_EVENT_HREF}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-mc-small border border-white/60 px-6 font-mc-interface text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors duration-mc-normal hover:bg-white hover:text-mc-text-primary"
              >
                Criar evento
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
