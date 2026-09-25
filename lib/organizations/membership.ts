export const OWNER_ASSIGNABLE_ROLES = ['organizer', 'finance'] as const
export type OwnerAssignableRole = (typeof OWNER_ASSIGNABLE_ROLES)[number]

export const ORGANIZATION_ROLE_LABELS = {
  owner: 'Proprietário',
  organizer: 'Organizador',
  finance: 'Financeiro',
  staff: 'Staff',
} as const

export type OrganizationRole = keyof typeof ORGANIZATION_ROLE_LABELS

export function isOwnerAssignableRole(value: string): value is OwnerAssignableRole {
  return OWNER_ASSIGNABLE_ROLES.some((role) => role === value)
}

export function organizationRoleLabel(role: string) {
  return role in ORGANIZATION_ROLE_LABELS
    ? ORGANIZATION_ROLE_LABELS[role as OrganizationRole]
    : role
}

export function slugifyOrganizationName(value: string) {
  const slug = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug || 'organizacao'
}

export function buildOrganizationRunId(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || ''
  return `MC-ORG-E2E-${value('year')}${value('month')}${value('day')}-${value('hour')}${value('minute')}${value('second')}`
}

export function mapMembershipError(message: string) {
  const text = message.replace(/^.*ERROR:\s*/i, '').split('\n')[0]?.trim() || ''
  if (/Autenticacao obrigatoria/i.test(text)) return 'Sua sessão expirou. Entre novamente.'
  if (/Acesso negado/i.test(text)) return 'Você não tem permissão para esta ação.'
  if (/precisa criar uma conta/i.test(text)) return 'O usuário precisa criar uma conta antes de ser associado à organização.'
  if (/ja e membro|já é membro/i.test(text)) return 'Este usuário já é membro desta organização.'
  if (/Papel nao permitido/i.test(text)) return 'Este papel não pode ser atribuído pelo proprietário.'
  if (/remover a si mesmo/i.test(text)) return 'Você não pode remover o próprio acesso de proprietário.'
  if (/remover o owner|ultimo owner|último owner/i.test(text)) return 'Não é permitido remover o proprietário.'
  if (/Organizacao inexistente|Organização inexistente/i.test(text)) return 'Organização inexistente.'
  if (/Membro inexistente/i.test(text)) return 'Este membro não foi encontrado na organização.'
  if (/Slug invalido|Slug ja existe/i.test(text)) return 'Não foi possível gerar um identificador válido para a organização.'
  if (/nome de organizacao valido|e-mail valido/i.test(text)) return 'Informe os dados obrigatórios corretamente.'
  return text || 'Não foi possível concluir a operação.'
}
