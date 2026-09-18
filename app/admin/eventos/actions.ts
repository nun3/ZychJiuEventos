'use server'

import { revalidatePath } from 'next/cache'
import { parseFightDurationInput } from '@/lib/events/fight-duration'
import { createClient } from '@/lib/supabase/server'
import { zonedLocalToUtc } from '@/lib/timezone'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type EventActionResult = { ok: boolean; message: string; eventId?: string }
const failure = (message: string): EventActionResult => ({ ok: false, message })
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
  const { data: membership } = await supabase.from('organization_members').select('organization_id')
    .in('role', ['owner', 'organizer']).limit(1).maybeSingle()
  if (!membership) return failure('Você não possui permissão para criar eventos.')

  const slug = `${slugify(nome) || 'evento'}-${Date.now().toString(36)}`
  const { data: event, error: eventError } = await supabase.from('events').insert({
    organization_id: membership.organization_id, nome, slug, data_evento: dataEvento,
    timezone, local, informacoes: informacoes || null, valor_inscricao: valorInscricao,
    created_by: authData.user.id, status: 'rascunho',
  }).select('id').single()
  if (eventError || !event) return failure('Não foi possível criar o evento.')

  const { error: phasesError } = await supabase.from('event_phases').insert(
    phases.map(({ tipo, inicio, fim }) => ({ event_id: event.id, tipo, inicio, fim })),
  )
  if (phasesError) {
    await supabase.from('events').delete().eq('id', event.id)
    return failure('Não foi possível salvar as fases do evento.')
  }
  try {
    const [imagemCartaz, regulamento, tabelaPeso] = await Promise.all([
      uploadAsset(supabase, membership.organization_id, event.id, 'banner', formData.get('banner') as File | null),
      uploadAsset(supabase, membership.organization_id, event.id, 'regulamento', formData.get('regulamento') as File | null),
      uploadAsset(supabase, membership.organization_id, event.id, 'tabela-peso', formData.get('tabela_peso') as File | null),
    ])
    if (imagemCartaz || regulamento || tabelaPeso) {
      await supabase.from('events').update({
        imagem_cartaz_url: imagemCartaz, regulamento_url: regulamento, tabela_peso_url: tabelaPeso,
      }).eq('id', event.id)
    }
  } catch {
    return failure('Evento salvo como rascunho, mas um arquivo não pôde ser enviado.')
  }
  if (intent === 'publicar') {
    const { error } = await supabase.from('events').update({ status: 'publicado' }).eq('id', event.id)
    if (error) return failure('Evento salvo como rascunho, mas não foi possível publicá-lo.')
  }

  revalidatePath('/')
  revalidatePath('/admin/eventos')
  return { ok: true, eventId: event.id, message: intent === 'publicar' ? 'Evento publicado com sucesso.' : 'Rascunho salvo com sucesso.' }
}

type EventTransitionStatus = 'publicado' | 'inscricao' | 'pagamento' | 'checagem' | 'chaves' | 'concluido' | 'cancelado'

async function editableEvent(eventId: string) {
  const supabase = createClient()
  const { data: event } = await supabase.from('events').select('id, status, checagem_travada_em').eq('id', eventId).maybeSingle()
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
  revalidatePath('/admin/eventos')
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath(`/admin/eventos/${eventId}/checagem`)
  revalidatePath(`/admin/eventos/${eventId}/chaves`)
  revalidatePath(`/admin/eventos/${eventId}/resultados`)
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
  if (!eventId || nome.length < 3) return failure('Informe o nome do conjunto de regras.')
  const supabase = createClient()
  const { data: current } = await supabase.from('category_rule_sets').select('versao').eq('event_id', eventId).order('versao', { ascending: false }).limit(1).maybeSingle()
  const { data: rule, error } = await supabase.from('category_rule_sets').insert({ event_id: eventId, nome, versao: (current?.versao || 0) + 1, ativo: false }).select('id').single()
  if (error || !rule) return failure('Não foi possível criar a versão de categorias.')
  const duration = parseFightDurationInput(text(formData, 'fight_duration_minutes'))
  if (!duration.ok) {
    await supabase.from('category_rule_sets').delete().eq('id', rule.id)
    return failure('Informe uma duração entre 0,5 e 20 minutos, em passos de 0,5, ou deixe em branco.')
  }
  const category = {
    rule_set_id: rule.id, nome: text(formData, 'category_name'), idade_min: Number(text(formData, 'idade_min')),
    idade_max: Number(text(formData, 'idade_max')), faixa_min_ordem: Number(text(formData, 'faixa_min')),
    faixa_max_ordem: Number(text(formData, 'faixa_max')), peso_min_kg: Number(text(formData, 'peso_min')),
    peso_max_kg: Number(text(formData, 'peso_max')), genero: text(formData, 'genero'), ordem: 1,
    fight_duration_minutes: duration.value,
  }
  if (!category.nome || !category.genero || category.idade_max < category.idade_min || category.faixa_max_ordem < category.faixa_min_ordem || category.peso_max_kg < category.peso_min_kg) {
    await supabase.from('category_rule_sets').delete().eq('id', rule.id)
    return failure('Limites da categoria inválidos.')
  }
  const { error: categoryError } = await supabase.from('event_categories').insert(category)
  if (categoryError) {
    await supabase.from('category_rule_sets').delete().eq('id', rule.id)
    return failure('Não foi possível cadastrar a categoria.')
  }
  const { error: deactivateError } = await supabase.from('category_rule_sets').update({ ativo: false }).eq('event_id', eventId).neq('id', rule.id)
  const { error: activateError } = await supabase.from('category_rule_sets').update({ ativo: true }).eq('id', rule.id)
  if (deactivateError || activateError) return failure('A versão foi criada, mas não pôde ser ativada.')
  revalidatePath(`/admin/eventos/${eventId}/configuracao`)
  revalidatePath(`/eventos/${eventId}`)
  return { ok: true, message: `Versão ${(current?.versao || 0) + 1} criada com sucesso.` }
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
