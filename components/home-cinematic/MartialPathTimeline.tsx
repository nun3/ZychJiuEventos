import { PATH_MILESTONES } from '@/lib/martial-arts/path-timeline'

/**
 * "O caminho": marcos documentados em ordem cronológica. O HTML é uma lista vertical normal (funciona sem JavaScript,
 * em telas pequenas/baixas e com movimento reduzido). Em telas amplas, CinematicStory liga `data-mode="h"`: a seção
 * fixa na tela e os cartões atravessam na horizontal conforme a rolagem, com uma linha que se desenha e o ano em destaque.
 * A largura do percurso vem dos próprios cartões; acrescentar um marco não exige recalcular nada.
 */
export function MartialPathTimeline() {
  return (
    <section
      data-path
      aria-labelledby="path-title"
      className="group relative px-5 py-24 sm:px-8 md:py-32 lg:px-12 xl:px-20 data-[mode=h]:flex data-[mode=h]:h-[100svh] data-[mode=h]:flex-col data-[mode=h]:justify-center data-[mode=h]:overflow-hidden data-[mode=h]:py-0 data-[mode=h]:pt-20"
    >
      <div className="grid gap-6 md:grid-cols-12 md:gap-8">
        <p className="font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.2em] opacity-70 md:col-span-3 md:pt-3">
          O caminho
        </p>
        <div className="md:col-span-9">
          <h2 id="path-title" className="max-w-4xl font-mc-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] md:text-5xl">
            Do afresco ao tatame: marcos documentados de quatro mil anos de luta.
          </h2>
          <p className="mt-4 hidden font-mc-interface text-sm uppercase tracking-[0.18em] opacity-60 group-data-[mode=h]:block">
            Role para atravessar o tempo
          </p>
        </div>
      </div>

      {/* Ano em destaque (só no modo horizontal): o texto muda quando o marco ativo muda. */}
      <p
        aria-hidden="true"
        data-path-year
        className="pointer-events-none mt-6 hidden font-mc-display text-[clamp(3rem,9vw,8rem)] font-bold leading-none tracking-[-0.05em] opacity-[0.14] group-data-[mode=h]:block"
      >
        {PATH_MILESTONES[0].year}
      </p>

      <ol
        data-path-track
        className="mt-12 flex flex-col gap-4 group-data-[mode=h]:mt-4 group-data-[mode=h]:w-max group-data-[mode=h]:flex-row group-data-[mode=h]:gap-6 group-data-[mode=h]:pr-[12vw]"
      >
        {PATH_MILESTONES.map((m, index) => (
          <li
            key={m.id}
            data-path-card
            data-active={index === 0 ? 'true' : 'false'}
            className="relative border-t pt-5 transition-opacity duration-mc-normal motion-reduce:transition-none group-data-[mode=h]:w-[min(80vw,24rem)] group-data-[mode=h]:shrink-0 group-data-[mode=h]:data-[active=false]:opacity-40"
            style={{ borderColor: 'color-mix(in srgb, var(--story-fg) 35%, transparent)' }}
          >
            <span aria-hidden="true" className="absolute -top-[5px] left-0 h-[9px] w-[9px] rounded-full bg-[var(--story-fg)]" />
            <p className="font-mc-display text-4xl font-bold leading-none tracking-[-0.04em] md:text-5xl">{m.year}</p>
            <p className="mt-3 font-mc-interface text-mc-caption font-semibold uppercase tracking-[0.18em] opacity-70">{m.tradition}</p>
            <p className="mt-3 font-mc-interface text-base leading-7 opacity-85">{m.fact}</p>
          </li>
        ))}
      </ol>

      {/* Linha de progresso (modo horizontal): escala em X, só transform. */}
      <div aria-hidden="true" className="mt-10 hidden h-px w-full bg-[var(--story-fg)]/20 group-data-[mode=h]:block">
        <div data-path-line className="h-full origin-left scale-x-0 bg-[var(--story-fg)]" />
      </div>
    </section>
  )
}
