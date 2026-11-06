'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { getAdministrativeOrganizationContext } from '@/lib/auth/organization-context-server'
import {
  buildCategoryVersionRows,
  categoryInsertCompensation,
  expandCatalogSelectionToCategoryRows,
  validateCategoryInputAgainstCatalog,
  type CatalogCategoryDefinition,
  type CatalogSelectionOverrides,
  type CategoryVersionRow,
} from '@/lib/events/catalog-category-sync'
import { assertCategoryVersionEditable } from '@/lib/events/category-rule-set-lifecycle'
import { parseFightDurationInput } from '@/lib/events/fight-duration'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'
import { zonedLocalToUtc } from '@/lib/timezone'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type EventActionResult = { ok: boolean; message: string; eventId?: string }
const failure = (message: string, eventId?: string): EventActionResult => (
  eventId ? { ok: false, message, eventId } : { ok: false, message }
)
const text = (formData: FormData, field: string) => String(formData.get(field) || '').trim()

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function uploadAsset(
  supabase: ReturnType<typeof createClient>, organizationId: string, eventId: string,
  field: string, file: File | null,
) {
  if (!file || file.size === 0) return null
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Arquivo inválido')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${organizationId}/${eventId}/${field}.${extension}`
  const { error } = await supabase.storage.from('event-assets').upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error('Falha no upload')
  return supabase.storage.from('event-assets').getPublicUrl(path).data.publicUrl
}

export async function createEvent(formData: FormData): Promise<EventActionResult> {
  const nome = text(formData, 'nome')
  const local = text(formData, 'local')
  const dataEvento = text(formData, 'data_evento')
  const timezone = text(formData, 'timezone') || 'America/Sao_Paulo'
  const informacoes = text(formData, 'informacoes')
  const valorInscricao = Number(text(formData, 'valor_inscricao').replace(',', '.'))
  const intent = text(formData, 'intent') === 'publicar' ? 'publicar' : 'rascunho'
  const phaseTypes = ['inscricao', 'pagamento', 'checagem', 'chaves'] as const
  let phases = phaseTypes.map((tipo) => ({ tipo, inicio: text(formData, `${tipo}_inicio`), fim: text(formData, `${tipo}_fim`) }))

  if (nome.length < 3 || local.length < 3 || !dataEvento || !Number.isFinite(valorInscricao) || valorInscricao < 0) return failure('Informe nome, data, local e valor válidos.')
  if (phases.some(({ inicio, fim }) => !inicio || !fim || new Date(inicio) >= new Date(fim))) {
    return failure('Cada fase deve possuir início anterior ao término.')
  }
  for (let index = 1; index < phases.length; index += 1) {
    if (new Date(phases[index].inicio) < new Date(phases[index - 1].fim)) {
      return failure('As fases devem estar em ordem e não podem se sobrepor.')
    }
  }
  try {
    phases = phases.map((phase) => ({ ...phase, inicio: zonedLocalToUtc(phase.inicio, timezone), fim: zonedLocalToUtc(phase.fim, timezone) }))
  } catch {
    return failure('Fuso horário ou data de fase inválidos.')
  }

  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return failure('Sua sessão expirou. Entre novamente.')
  const requestedOrganizationId = text(formData, 'organization_id')
  const organization = await getAdministrativeOrganizationContext(
    uuidPattern.test(requestedOrganizationId) ? requestedOrganizationId : undefined,
  )
  if (organization.status !== 'resolved') {
    if (organization.reason === 'ambiguous') {
      return failure('Sua conta pertence a mais de uma organização com permissão para criar eventos. Escolha uma organização antes de continuar.')
    }
    if (organization.reason === 'invalid-choice') {
      return failure('A organização selecionada não corresponde a uma filiação administrativa sua. Escolha novamente.')
    }
    return failure('Você não possui permissão para criar eventos.')
  }

  const slug = `${slugify(nome) || 'evento'}-${Date.now().toString(36)}`
  const { data: event, error: eventError } = await supabase.from('events').insert({
    organization_id: organization.context.organizationId, nome, slug, data_evento: dataEvento,
    timezone, local, informacoes: informacoes || null, valor_inscricao: valorInscricao,
    created_by: authData.user.id, status: 'rascunho',
  }).select('id').single()
  if (eventError || !event) return failure('Não foi possível criar o evento.')

  const { error: phasesError } = await supabase.from('event_phases').insert(
    phases.map(({ tipo, inicio, fim }) => ({ event_id: event.id, tipo, inicio, fim })),
  )
  if (phasesError) {
    const { error: deleteError } = await supabase.from('events').delete().eq('id', event.id)
    if (deleteError) {
      // O rascunho sem fases pode ter permanecido: não afirmar que a limpeza funcionou.
      // Sem eventId aqui — o rascunho órfão (sem fases) continua visível em /admin/eventos
      // para exclusão manual; não há retorno automático seguro sem reexecutar o delete.
      revalidatePath('/admin/eventos')
      return failure('Não foi possível salvar as fases do evento. O rascunho pode ter permanecido — confira a lista de eventos.')
    }
    return failure('Não foi possível salvar as fases do evento.')
  }

  // Promise.allSettled em vez de Promise.all: um upload rejeitado não deve descartar os outros
  // dois que já tiverem terminado. Antes, qualquer falha única perdia os arquivos bem-sucedidos
  // (o `catch` pulava a gravação das três URLs). Agora cada envio é independente e só o que
  // falhou é reportado — o resto é gravado e preservado.
  const [bannerResult, regulamentoResult, tabelaPesoResult] = await Promise.allSettled([
    uploadAsset(supabase, organization.context.organizationId, event.id, 'banner', formData.get('banner') as File | null),
    uploadAsset(supabase, organization.context.organizationId, event.id, 'regulamento', formData.get('regulamento') as File | null),
    uploadAsset(supabase, organization.context.organizationId, event.id, 'tabela-peso', formData.get('tabela_peso') as File | null),
  ])
  const imagemCartaz = bannerResult.status === 'fulfilled' ? bannerResult.value : null
  const regulamento = regulamentoResult.status === 'fulfilled' ? regulamentoResult.value : null
  const tabelaPeso = tabelaPesoResult.status === 'fulfilled' ? tabelaPesoResult.value : null
  const failedAssets = [
    bannerResult.status === 'rejected' ? 'banner' : null,
    regulamentoResult.status === 'rejected' ? 'regulamento' : null,
    tabelaPesoResult.status === 'rejected' ? 'tabela de peso' : null,
  ].filter((label): label is string => label !== null)

  if (imagemCartaz || regulamento || tabelaPeso) {
    const { error: assetError } = await supabase.from('events').update({
      imagem_cartaz_url: imagemCartaz, regulamento_url: regulamento, tabela_peso_url: tabelaPeso,
    }).eq('id', event.id)
    // Upload bem-sucedido mas sem conseguir gravar a URL: o arquivo existe no Storage sem
    // referência no evento. Reportar como falha específica em vez de dar sucesso silencioso —
    // corrigir a causa (RLS, rede) exige investigação; não é reenviado sozinho.
    if (assetError) failedAssets.push('gravação dos arquivos enviados')
  }
  if (failedAssets.length) {
    revalidatePath('/admin/eventos')
    revalidatePath(`/admin/eventos/${event.id}/configuracao`)
    return failure(
      `Evento salvo como rascunho. Não foi possível enviar: ${failedAssets.join(', ')}. Os demais arquivos enviados foram preservados.`,
      event.id,
    )
  }
  if (intent === 'publicar') {
    const { error } = await supabase.from('events').update({ status: 'publicado' }).eq('id', event.id)
    if (error) return failure('Evento salvo como rascunho, mas não foi possível publicá-lo.')
  }

  revalidatePath('/')
  revalidateTag('public-home-events')
  revalidatePath('/admin/eventos')
  return { ok: true, eventId: event.id, message: intent === 'publicar' ? 'Evento publicado com sucesso.' : 'Rascunho salvo com sucesso.' }
}

type EventTransitionStatus = 'publicado' | 'inscricao' | 'pagamento' | 'checagem' | 'chaves' | 'concluido' | 'cancelado'

async function editableEvent(eventId: string) {
  const supabase = createClient()
  const { data: event } = await supabase.from('events').select('id, status, checagem_travada_em, organization_id').eq('id', eventId).maybeSingle()
  if (event && !allowsPublicOrganization(event.organization_id)) return { supabase, event: null }
  return { supabase, event }
}

export async function updateEvent(formData: FormData): Promise<EventActionResult> {
  const eventId = text(formData, 'event_id')
  const nome = text(formData, 'nome')
  const local = text(formData, 'local')
  const dataEvento = text(formData, 'data_evento')
  const timezone = text(formData, 'timezone') || 'America/Sao_Paulo'
  const valorInscricao = Number(text(formData, 'valor_inscricao').replace(',', '.'))
  if (!eventId || nome.length < 3 || local.length < 3 || !dataEvento || !Number.isFinite(valorInscricao) || valorInscricao < 0) return failure('Dados do evento inválidos.')
  const { supabase, event } = await editableEvent(eventId)
  if (!event) return failure('Evento não encontrado ou sem permissão.')
  if (event.status !== 'rascunho') return failure('Somente rascunhos podem ter os dados básicos editados.')
  const { error } = await supabase.from('events').update({ nome, local, data_evento: dataEvento, timezone, valor_inscricao: valorInscricao, informacoes: text(formData, 'informacoes') || null }).eq('id', eventId)
  if (error) return failure('Não foi possível atualizar o evento.')
  revalidatePath('/admin/eventos')
  revalidatePath(`/admin/eventos/${eventId}/editar`)
  return { ok: true, message: 'Evento atualizado com sucesso.', eventId }
}

export async function transitionEvent(eventId: string, status: EventTransitionStatus): Promise<EventActionResult> {
  const { supabase, event } = await editableEvent(eventId)
  if (!event) return failure('Evento não encontrado ou sem permissão.')
  if (status === 'chaves' && !event.checagem_travada_em) {
    return failure('Trave a checagem antes de avançar para as chaves.')
  }
  const { error } = await supabase.from('events').update({ status }).eq('id', eventId)
  if (error?.code === '23514') return failure('Transição de estado inválida.')
  if (error) return failure('Não foi possível alterar o estado do evento.')
  revalidatePath('/')
  revalidateTag('public-home-events')
  revalidatePath('/admin/eventos')
  revalidatePath(`/eventos/${eventId}`)
  for (const segment of ['configuracao', 'checagem', 'financeiro', 'chaves', 'programacao', 'resultados', 'editar']) {
    revalidatePath(`/admin/eventos/${eventId}/${segment}`)
  }
  const messages: Record<EventTransitionStatus, string> = {
    publicado: 'Evento publicado.',
    inscricao: 'Inscrições abertas.',
    pagamento: 'Fase de pagamento aberta.',
    checagem: 'Checagem aberta.',
    chaves: 'Fase de chaves aberta.',
    concluido: 'Evento concluído.',
    cancelado: 'Evento cancelado.',
  }
  return { ok: true, message: messages[status] }
}

export async function deleteDraftEvent(eventId: string): Promise<EventActionResult> {
  const { supabase, event } = await editableEvent(eventId)
  if (!event) return failure('Evento não encontrado ou sem permissão.')
  if (event.status !== 'rascunho') return failure('Somente rascunhos podem ser excluídos.')
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) return failure('Não foi possível excluir o rascunho.')
  revalidatePath('/admin/eventos')
  return { ok: true, message: 'Rascunho excluído.' }
}

export async function createCategoryRuleSet(formData: FormData): Promise<EventActionResult> {
  const eventId = text(formData, 'event_id')
  const nome = text(formData, 'rule_name')
  const categoryCatalogId = text(formData, 'category_catalog_id') || null
  const catalogCategoryId = text(formData, 'catalog_category_id') || null
  if (!eventId || nome.length < 3) return failure('Informe o nome do conjunto de regras.')
  if (categoryCatalogId && !uuidPattern.test(categoryCatalogId)) return failure('Catálogo esportivo inválido.')
  if (catalogCategoryId && !uuidPattern.test(catalogCategoryId)) return failure('Categoria do catálogo inválida.')
  const { event } = await editableEvent(eventId)
  if (!event) return failure('Evento não encontrado ou sem permissão.')
  const editability = assertCategoryVersionEditable(event)
  if (!editability.ok) return failure(editability.message)
  const supabase = createClient()
  if (categoryCatalogId) {
    const { data: catalog } = await supabase.from('sport_category_catalogs').select('id').eq('id', categoryCatalogId).not('publicado_em', 'is', null).maybeSingle()
    if (!catalog) return failure('O catálogo esportivo informado não está publicado.')
  }
  let definition: CatalogCategoryDefinition | null = null
  if (catalogCategoryId) {
    if (!categoryCatalogId) return failure('Selecione o catálogo antes de vincular uma categoria.')
    const { data: catalogDefinition } = await supabase
      .from('sport_category_definitions')
      .select('id, codigo, nome, divisao_etaria, idade_min, idade_max, genero, faixa_min_ordem, faixa_max_ordem, peso_min_kg, peso_max_kg, ordem')
      .eq('id', catalogCategoryId)
      .eq('catalog_id', categoryCatalogId)
      .maybeSingle()
    if (!catalogDefinition) return failure('A categoria não pertence ao catálogo selecionado.')
    definition = catalogDefinition
  }
  const duration = parseFightDurationInput(text(formData, 'fight_duration_minutes'))
  if (!duration.ok) {
    return failure('Informe uma duração entre 0,5 e 20 minutos, em passos de 0,5, ou deixe em branco.')
  }
  const validatedCategory = validateCategoryInputAgainstCatalog(
    {
      categoryName: text(formData, 'category_name'),
      genero: text(formData, 'genero'),
      idadeMinRaw: text(formData, 'idade_min'),
      idadeMaxRaw: text(formData, 'idade_max'),
      faixaMinRaw: text(formData, 'faixa_min'),
      faixaMaxRaw: text(formData, 'faixa_max'),
      pesoMinRaw: text(formData, 'peso_min'),
      pesoMaxRaw: text(formData, 'peso_max'),
    },
    definition,
  )
  if (!validatedCategory.ok) {
    return failure(validatedCategory.message)
  }
  const categories = buildCategoryVersionRows(validatedCategory.values, catalogCategoryId, duration.value)
  const split = validatedCategory.values.length === 2
  return persistNewCategoryVersion(supabase, eventId, nome, categoryCatalogId, categories, (version) =>
    split
      ? `Versão ${version} criada com categorias masculina e feminina separadas.`
      : `Versão ${version} criada com sucesso.`)
}

/**
 * Persistência comum de uma nova versão de categorias: cria `category_rule_sets`, insere o
 * lote de `event_categories` numa sentença só, compensa se o insert falhar e ativa a versão.
 * Reaproveitada pelo fluxo de categoria customizada e pela seleção múltipla do catálogo (G2) —
 * para não duplicar a regra de criação/compensação/ativação.
 */
async function persistNewCategoryVersion(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  nome: string,
  categoryCatalogId: string | null,
  rows: CategoryVersionRow[],
  buildSuccessMessage: (version: number, categoriesCount: number) => string,
): Promise<EventActionResult> {
  const { data: current } = await supabase.from('category_rule_sets').select('versao').eq('event_id', eventId).order('versao', { ascending: false }).limit(1).maybeSingle()
  const { data: rule, error } = await supabase.from('category_rule_sets').insert({ event_id: eventId, nome, versao: (current?.versao || 0) + 1, ativo: false, category_catalog_id: categoryCatalogId }).select('id').single()
  if (error || !rule) return failure('Não foi possível criar a versão de categorias.')
  const categories = rows.map((row) => ({ rule_set_id: rule.id, ...row }))
  const { error: categoryError } = await supabase.from('event_categories').insert(categories)
  if (categoryError) {
    const { error: deleteError } = await supabase.from('category_rule_sets').delete().eq('id', rule.id)
    return failure(categoryInsertCompensation(Boolean(deleteError)).message)
  }
  // RPC `activate_category_rule_set` faz a troca de versão ativa numa transação só (lock +
  // desativar as demais + ativar esta) em vez de duas atualizações sequenciais sem transação —
  // uma falha entre as duas podia deixar o evento sem versão ativa, e duas ativações concorrentes
  // do mesmo evento podiam intercalar e deixar duas versões ativas ao mesmo tempo.
  const { error: activateError } = await supabase.rpc('activate_category_rule_set', { p_rule_set_id: rule.id })
  if (activateError) return failure('A versão foi criada, mas não pôde ser ativada. Os dados enviados não foram perdidos; peça para tentar novamente.')
  revalidatePath(`/admin/eventos/${eventId}/configuracao`)
  revalidatePath(`/eventos/${eventId}`)
  const version = (current?.versao || 0) + 1
  return { ok: true, message: buildSuccessMessage(version, categories.length) }
}

/**
 * Seleção múltipla de definições oficiais do catálogo, numa única versão (G2, lote 5).
 *
 * O organizador escolhe quais definições entram — inclusive "todas" — e cada uma vira 1 ou 2
 * categorias efetivas (`U` expande para `M` e `F`, preservando o `catalog_category_id`). Não
 * há mistura automática de sexo: cada linha mantém o gênero efetivo que já tinha. Os limites de
 * idade, faixa, peso e duração vêm do catálogo; só divisões sem teto no catálogo (ADULTO/MASTER
 * e a classe mais pesada de cada grupo) exigem um teto operacional informado pelo organizador.
 */
export async function createCategoryRuleSetFromCatalog(formData: FormData): Promise<EventActionResult> {
  const eventId = text(formData, 'event_id')
  const nome = text(formData, 'rule_name')
  const categoryCatalogId = text(formData, 'category_catalog_id') || null
  if (!eventId || nome.length < 3) return failure('Informe o nome do conjunto de regras.')
  if (!categoryCatalogId || !uuidPattern.test(categoryCatalogId)) return failure('Selecione o catálogo oficial de categorias.')
  const { event } = await editableEvent(eventId)
  if (!event) return failure('Evento não encontrado ou sem permissão.')
  const editability = assertCategoryVersionEditable(event)
  if (!editability.ok) return failure(editability.message)
  const supabase = createClient()
  const { data: catalog } = await supabase.from('sport_category_catalogs').select('id').eq('id', categoryCatalogId).not('publicado_em', 'is', null).maybeSingle()
  if (!catalog) return failure('O catálogo esportivo informado não está publicado.')

  const selectedIds = Array.from(new Set(formData.getAll('catalog_category_ids').map((value) => String(value).trim()).filter(Boolean)))
  if (!selectedIds.length) return failure('Selecione ao menos uma categoria do catálogo.')
  if (selectedIds.some((id) => !uuidPattern.test(id))) return failure('Seleção de categoria do catálogo inválida.')

  const { data: definitions, error: definitionsError } = await supabase
    .from('sport_category_definitions')
    .select('id, codigo, nome, divisao_etaria, idade_min, idade_max, genero, faixa_min_ordem, faixa_max_ordem, peso_min_kg, peso_max_kg, ordem')
    .eq('catalog_id', categoryCatalogId)
    .in('id', selectedIds)
  if (definitionsError || !definitions || definitions.length !== selectedIds.length) {
    return failure('Uma ou mais categorias selecionadas não pertencem ao catálogo.')
  }

  const overrides: CatalogSelectionOverrides = {}
  for (const definition of definitions) {
    const idadeMax = text(formData, `override_idade_max__${definition.id}`)
    const pesoMax = text(formData, `override_peso_max__${definition.id}`)
    if (idadeMax || pesoMax) overrides[definition.id] = { idadeMax, pesoMax }
  }

  const duration = parseFightDurationInput(text(formData, 'fight_duration_minutes'))
  if (!duration.ok) {
    return failure('Informe uma duração entre 0,5 e 20 minutos, em passos de 0,5, ou deixe em branco.')
  }

  const expanded = expandCatalogSelectionToCategoryRows(definitions, overrides, duration.value)
  if (!expanded.ok) return failure(expanded.message)

  const definitionsCount = definitions.length
  return persistNewCategoryVersion(supabase, eventId, nome, categoryCatalogId, expanded.rows, (version, categoriesCount) =>
    `Versão ${version} criada com ${categoriesCount} ${categoriesCount === 1 ? 'categoria efetiva' : 'categorias efetivas'} a partir de ${definitionsCount} ${definitionsCount === 1 ? 'definição selecionada' : 'definições selecionadas'} do catálogo.`)
}

const durationErrors: Record<string, string> = {
  'Sessao obrigatoria': 'Sua sessão expirou.',
  'Categoria obrigatoria': 'Categoria inválida.',
  'Categoria inexistente': 'A categoria não foi encontrada.',
  'Duracao da luta invalida': 'Informe uma duração entre 0,5 e 20 minutos, em passos de 0,5, ou deixe em branco.',
  'Sem permissao para configurar categorias': 'Você não pode configurar a duração deste evento.',
}

function refreshDuration(eventId: string) {
  revalidatePath(`/admin/eventos/${eventId}/configuracao`)
  revalidatePath(`/admin/eventos/${eventId}/chaves`)
  revalidatePath(`/admin/eventos/${eventId}/programacao`)
  revalidatePath(`/admin/eventos/${eventId}/resultados`)
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath(`/eventos/${eventId}/chaves`)
  revalidatePath(`/eventos/${eventId}/programacao`)
}

export async function setEventCategoryDuration(formData: FormData): Promise<EventActionResult> {
  const eventId = text(formData, 'event_id')
  const categoryId = text(formData, 'category_id')
  if (!uuidPattern.test(eventId) || !uuidPattern.test(categoryId)) return failure('Categoria inválida.')
  const duration = parseFightDurationInput(text(formData, 'duration_minutes'))
  if (!duration.ok) return failure(durationErrors['Duracao da luta invalida'])
  const { event } = await editableEvent(eventId)
  if (!event) return failure('Evento não encontrado ou sem permissão.')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return failure('Sua sessão expirou.')
  const { data, error } = await supabase.rpc('set_event_category_duration', {
    target_category_id: categoryId,
    duration_minutes: duration.value,
  })
  const payload = data && typeof data === 'object' && !Array.isArray(data) ? data : null
  if (error || !payload || payload.kind !== 'category_duration') {
    const mapped = error?.message ? durationErrors[error.message] : undefined
    return failure(mapped || 'Não foi possível salvar a duração da luta.')
  }
  refreshDuration(eventId)
  return {
    ok: true,
    message: duration.value == null ? 'Duração removida desta categoria.' : `Duração salva: ${duration.value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} min.`,
  }
}
