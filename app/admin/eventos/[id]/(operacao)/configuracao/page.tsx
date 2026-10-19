import { notFound } from 'next/navigation'
import { Layers3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  MobileRecord,
  MobileRecordMeta,
  MobileRecordTitle,
} from '@/components/ui/MobileRecord'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatFightDurationLabel, parseFightDurationMinutes } from '@/lib/events/fight-duration'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'
import CategoryDurationEditor from './CategoryDurationEditor'
import CategoryManager from './CategoryManager'

type CategoryItem = {
  id: string
  nome: string
  genero: string
  idade_min: number
  idade_max: number
  peso_min_kg: number
  peso_max_kg: number
  fight_duration_minutes: number | string | null
}

function genderLabel(genero: string) {
  if (genero === 'M') return 'Masculino'
  if (genero === 'F') return 'Feminino'
  return genero
}

function categoryColumns(eventId: string): Array<DataTableColumn<CategoryItem>> {
  return [
    {
      key: 'name',
      header: 'Categoria',
      render: (category) => <span className="font-semibold text-mc-text-primary">{category.nome}</span>,
    },
    { key: 'gender', header: 'Gênero', render: (category) => genderLabel(category.genero) },
    { key: 'age', header: 'Idade', render: (category) => `${category.idade_min}–${category.idade_max}` },
    {
      key: 'weight',
      header: 'Peso',
      render: (category) => `${category.peso_min_kg}–${category.peso_max_kg} kg`,
    },
    {
      key: 'duration',
      header: 'Duração',
      render: (category) => (
        <CategoryDurationEditor
          key={`${category.id}-${String(category.fight_duration_minutes ?? 'empty')}`}
          eventId={eventId}
          categoryId={category.id}
          durationMinutes={parseFightDurationMinutes(category.fight_duration_minutes)}
        />
      ),
    },
  ]
}

export default async function EventConfigurationPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: event } = await supabase
    .from('events')
    .select('id, nome, organization_id, data_evento, local, status, imagem_cartaz_url')
    .eq('id', params.id)
    .maybeSingle()
  if (!event || !allowsPublicOrganization(event.organization_id)) notFound()
  const [{ data: ruleSets }, { data: catalog }] = await Promise.all([
    supabase
      .from('category_rule_sets')
      .select('id, nome, versao, ativo, event_categories(id, nome, genero, idade_min, idade_max, peso_min_kg, peso_max_kg, fight_duration_minutes)')
      .eq('event_id', event.id)
      .order('versao', { ascending: false }),
    supabase
      .from('sport_category_catalogs')
      .select('id, nome, versao, sport_category_definitions(id, nome, divisao_etaria, genero, peso_min_kg, peso_max_kg)')
      .eq('sport', 'jiu-jitsu')
      .eq('modality', 'gi')
      .not('publicado_em', 'is', null)
      .order('versao', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
      <div className="mt-4 grid items-start gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <CategoryManager
          eventId={event.id}
          catalog={catalog ? {
            id: catalog.id,
            nome: catalog.nome,
            versao: catalog.versao,
            definitions: catalog.sport_category_definitions,
          } : null}
        />

        <section aria-labelledby="category-versions-title" className="min-w-0">
          <Card className="overflow-hidden shadow-mc-subtle">
            <header className="border-b border-mc-border p-mc-16 sm:p-mc-24">
              <div className="flex items-start gap-mc-12">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-mc-medium bg-mc-action/10 text-mc-action" aria-hidden="true">
                  <Layers3 size={20} />
                </span>
                <div>
                  <h2 id="category-versions-title" className="font-mc-display text-mc-h3 text-mc-text-primary">
                    Versões cadastradas
                  </h2>
                  <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">
                    Eixos imutáveis por versão. Somente a duração pode ser editada depois.
                  </p>
                </div>
              </div>
            </header>

            {!ruleSets?.length ? (
              <EmptyState
                icon={<Layers3 size={34} />}
                title="Nenhuma categoria cadastrada"
                description="Sem versão ativa o evento não tem destino de inscrição. Crie a primeira versão de categorias para abrir o campeonato."
                className="m-mc-16 rounded-mc-medium border border-mc-border bg-mc-surface sm:m-mc-24"
              />
            ) : (
              <div className="divide-y divide-mc-border px-mc-16 sm:px-mc-24">
                {ruleSets.map((rule) => (
                  <article key={rule.id} className="min-w-0 py-mc-16">
                    <header className="mb-3 flex flex-col gap-mc-8 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-mc-8">
                          {rule.ativo ? (
                            <StatusBadge variant="info">Versão ativa</StatusBadge>
                          ) : (
                            <StatusBadge variant="neutral">Inativa</StatusBadge>
                          )}
                          <h3 className="font-mc-display text-base font-semibold text-mc-text-primary sm:text-lg">
                            Versão {rule.versao} — {rule.nome}
                          </h3>
                        </div>
                        <p className="mt-mc-4 font-mc-interface text-xs text-mc-text-secondary">
                          {rule.event_categories.length}{' '}
                          {rule.event_categories.length === 1 ? 'categoria' : 'categorias'}
                        </p>
                      </div>
                    </header>

                    <DataTable
                      rows={rule.event_categories as CategoryItem[]}
                      columns={categoryColumns(event.id)}
                      getRowKey={(category) => category.id}
                      caption={`Categorias da versão ${rule.versao}`}
                      className="hidden rounded-none border-0 md:block"
                    />

                    <div className="space-y-mc-8 p-mc-12 md:hidden">
                      {(rule.event_categories as CategoryItem[]).map((category) => (
                        <MobileRecord key={category.id} className="bg-mc-surface-secondary p-mc-12">
                          <MobileRecordTitle className="text-base leading-5">{category.nome}</MobileRecordTitle>
                          <MobileRecordMeta className="mt-mc-8">
                            {genderLabel(category.genero)} · {category.idade_min}–{category.idade_max} anos ·{' '}
                            {category.peso_min_kg}–{category.peso_max_kg} kg ·{' '}
                            {formatFightDurationLabel(parseFightDurationMinutes(category.fight_duration_minutes)) || 'Duração não definida'}
                          </MobileRecordMeta>
                          <div className="mt-mc-12">
                            <CategoryDurationEditor
                              key={`${category.id}-${String(category.fight_duration_minutes ?? 'empty')}`}
                              eventId={event.id}
                              categoryId={category.id}
                              durationMinutes={parseFightDurationMinutes(category.fight_duration_minutes)}
                            />
                          </div>
                        </MobileRecord>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>
  )
}
