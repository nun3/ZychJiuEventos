import { notFound } from 'next/navigation'
import { Layers3 } from 'lucide-react'
import AdminEventNav, { adminEventBackLink } from '@/components/AdminEventNav'
import InternalNavigation from '@/components/InternalNavigation'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  MobileRecord,
  MobileRecordMeta,
  MobileRecordTitle,
} from '@/components/ui/MobileRecord'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatFightDurationLabel, parseFightDurationMinutes } from '@/lib/events/fight-duration'
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

function categoryColumns(eventId: string): Array<DataTableColumn<CategoryItem>> {
  return [
    { key: 'name', header: 'Categoria', render: (category) => <span className="font-semibold text-mc-text-primary">{category.nome}</span> },
    { key: 'gender', header: 'Gênero', render: (category) => category.genero },
    { key: 'age', header: 'Idade', render: (category) => `${category.idade_min}–${category.idade_max} anos` },
    { key: 'weight', header: 'Peso', render: (category) => `${category.peso_min_kg}–${category.peso_max_kg} kg` },
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
  const { data: event } = await supabase.from('events').select('id, nome').eq('id', params.id).maybeSingle()
  if (!event) notFound()
  const { data: ruleSets } = await supabase.from('category_rule_sets').select('id, nome, versao, ativo, event_categories(id, nome, genero, idade_min, idade_max, peso_min_kg, peso_max_kg, fight_duration_minutes)').eq('event_id', event.id).order('versao', { ascending: false })
  return (
    <div className="min-h-screen bg-mc-background">
      <InternalNavigation canManageEvents />
      <main className="py-mc-32 sm:py-mc-48">
        <PageContainer>
          <PageHeader
            title={`Categorias — ${event.nome}`}
            description="Os eixos de categorização continuam imutáveis em cada versão. A duração oficial da luta pode ser preenchida ou alterada depois, sem criar versão nova."
            breadcrumb={adminEventBackLink()}
          />
          <AdminEventNav eventId={event.id} current="configuracao" />

          <div className="mt-mc-32 grid items-start gap-mc-24 xl:grid-cols-[minmax(22rem,0.75fr)_minmax(0,1.25fr)]">
            <CategoryManager eventId={event.id} />
            <section aria-labelledby="category-versions-title">
              <div className="border-b border-mc-border pb-mc-16">
                <h2 id="category-versions-title" className="font-mc-display text-mc-h2 text-mc-text-primary">Versões cadastradas</h2>
                <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">A versão ativa é aplicada às novas inscrições.</p>
              </div>
              {!ruleSets?.length ? (
                <EmptyState icon={<Layers3 size={34} />} title="Nenhuma versão cadastrada" description="Crie a primeira versão de categorias para preparar as inscrições." className="mt-mc-16 rounded-mc-medium border border-mc-border bg-mc-surface" />
              ) : (
                <div className="mt-mc-16 space-y-mc-16">
                  {ruleSets.map((rule) => (
                    <Card key={rule.id} className="overflow-hidden">
                      <header className="flex flex-col gap-mc-8 border-b border-mc-border bg-mc-surface-secondary p-mc-16 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-mc-display text-lg font-semibold text-mc-text-primary">Versão {rule.versao} — {rule.nome}</h3>
                          <p className="mt-mc-4 font-mc-interface text-xs text-mc-text-secondary">{rule.event_categories.length} {rule.event_categories.length === 1 ? 'categoria' : 'categorias'}</p>
                        </div>
                        <StatusBadge variant={rule.ativo ? 'success' : 'neutral'}>{rule.ativo ? 'Ativa' : 'Inativa'}</StatusBadge>
                      </header>
                      <DataTable rows={rule.event_categories as CategoryItem[]} columns={categoryColumns(event.id)} getRowKey={(category) => category.id} caption={`Categorias da versão ${rule.versao}`} className="hidden rounded-none border-0 md:block" />
                      <div className="space-y-mc-8 p-mc-12 md:hidden">
                        {(rule.event_categories as CategoryItem[]).map((category) => (
                          <MobileRecord key={category.id} className="bg-mc-surface-secondary p-mc-12">
                            <MobileRecordTitle className="text-base leading-5">{category.nome}</MobileRecordTitle>
                            <MobileRecordMeta className="mt-mc-8">
                              {category.genero} · {category.idade_min}–{category.idade_max} anos · {category.peso_min_kg}–{category.peso_max_kg} kg · {formatFightDurationLabel(parseFightDurationMinutes(category.fight_duration_minutes)) || 'Duração não definida'}
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
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        </PageContainer>
      </main>
    </div>
  )
}
