'use client'

import { useState } from 'react'
import { formatFightDurationLabel, parseFightDurationMinutes } from '@/lib/events/fight-duration'
import type { Category } from '@/lib/categorization'
import EventCategoryFinder from '@/components/events/public-event/EventCategoryFinder'
import type { SportCategoryCatalog } from '@/lib/events/category-resolver'

type PreviewCategory = Category & {
  fight_duration_minutes: number | null
  catalog_category_id: string | null
}

const PREVIEW = 8

export default function EventCategoriesPreview({
  version,
  categories,
  eventId,
  eventDate,
  catalog,
  showRegistrationCta,
}: {
  version: number
  categories: PreviewCategory[]
  eventId: string
  eventDate: string
  catalog: SportCategoryCatalog | null
  showRegistrationCta: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? categories : categories.slice(0, PREVIEW)
  const hasMore = categories.length > PREVIEW

  return (
    <section className="scroll-mt-36">
      <div className="flex flex-wrap items-end justify-between gap-mc-12">
        <div>
          <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">Categorias</h2>
          <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
            Versão ativa {version} · {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4 rounded-mc-small border border-mc-border bg-mc-surface-secondary/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mc-display text-base font-semibold text-mc-text-primary">Não sabe em qual categoria se encaixa?</p>
          <p className="mt-1 font-mc-interface text-sm text-mc-text-secondary">Informe seus dados e descubra sua divisão antes da inscrição.</p>
        </div>
        <EventCategoryFinder
          eventId={eventId}
          eventDate={eventDate}
          categories={categories}
          catalog={catalog}
          showRegistrationCta={showRegistrationCta}
        />
      </div>
      <ul id="categorias-disponiveis" className="mt-mc-20 grid scroll-mt-36 gap-x-mc-24 gap-y-mc-16 sm:grid-cols-2">
        {visible.map((category) => {
          const duration = formatFightDurationLabel(parseFightDurationMinutes(category.fight_duration_minutes), 'long')
          return (
            <li key={category.id} className="border-t border-mc-border pt-mc-12">
              <p className="font-mc-display text-base font-semibold text-mc-text-primary">{category.nome}</p>
              <p className="mt-mc-6 font-mc-interface text-sm text-mc-text-secondary">
                {category.genero} · {category.idade_min}–{category.idade_max} anos · {category.peso_min_kg}–
                {category.peso_max_kg} kg
                {duration ? ` · ${duration}` : ''}
              </p>
            </li>
          )
        })}
      </ul>
      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-mc-20 inline-flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
        >
          {expanded ? 'Mostrar menos' : `Ver todas as categorias (${categories.length})`}
        </button>
      ) : null}
    </section>
  )
}
