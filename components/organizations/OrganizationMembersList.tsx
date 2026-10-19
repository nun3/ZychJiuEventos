import type { ReactNode } from 'react'
import { UsersRound } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  MobileRecord,
  MobileRecordActions,
  MobileRecordHeader,
  MobileRecordMeta,
  MobileRecordTitle,
} from '@/components/ui/MobileRecord'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { organizationRoleLabel } from '@/lib/organizations/membership'

export type OrganizationMemberRow = {
  userId: string
  name: string
  email: string
  role: string
}

export function OrganizationMembersList({
  members,
  renderActions,
  layout = 'responsive',
}: {
  members: OrganizationMemberRow[]
  renderActions?: (member: OrganizationMemberRow) => ReactNode
  layout?: 'responsive' | 'stacked'
}) {
  const canRemove = Boolean(renderActions)
  if (!members.length) {
    return (
      <EmptyState
        icon={<UsersRound size={34} />}
        title="Nenhum membro adicional"
        description="Ainda não há membros além do cadastro inicial desta organização."
        className="rounded-mc-medium border border-mc-border bg-mc-surface"
      />
    )
  }

  if (layout === 'stacked') {
    return (
      <ul className="divide-y divide-mc-border">
        {members.map((member) => (
          <li key={`${member.userId}-${member.role}`} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 break-words font-mc-interface text-sm font-semibold text-mc-text-primary">{member.name}</p>
              <StatusBadge variant={member.role === 'owner' ? 'info' : 'neutral'}>
                {organizationRoleLabel(member.role)}
              </StatusBadge>
            </div>
            <p className="mt-1 break-words font-mc-interface text-sm text-mc-text-secondary">{member.email}</p>
            {canRemove && member.role !== 'owner' ? (
              <div className="mt-2">{renderActions?.(member)}</div>
            ) : canRemove && member.role === 'owner' ? (
              <p className="mt-2 font-mc-interface text-sm text-mc-text-secondary">Protegido</p>
            ) : null}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed text-left font-mc-interface text-sm">
          <thead>
            <tr className="border-b border-mc-border text-mc-text-secondary">
              <th className="w-[32%] px-3 py-3 font-semibold">Nome</th>
              <th className="w-[40%] px-3 py-3 font-semibold">E-mail</th>
              <th className="w-[14%] px-3 py-3 font-semibold">Papel</th>
              {canRemove ? <th className="px-3 py-3 font-semibold">Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={`${member.userId}-${member.role}`} className="border-b border-mc-border last:border-0">
                <td className="break-words px-3 py-3 font-semibold text-mc-text-primary">{member.name}</td>
                <td className="break-all px-3 py-3 text-mc-text-secondary">{member.email}</td>
                <td className="px-3 py-3">
                  <StatusBadge variant={member.role === 'owner' ? 'info' : 'neutral'}>
                    {organizationRoleLabel(member.role)}
                  </StatusBadge>
                </td>
                {canRemove ? (
                  <td className="px-3 py-3">
                    {member.role === 'owner' ? (
                      <span className="text-mc-text-secondary">Protegido</span>
                    ) : (
                      renderActions?.(member)
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-mc-12 md:hidden">
        {members.map((member) => (
          <MobileRecord key={`${member.userId}-${member.role}`}>
            <MobileRecordHeader>
              <MobileRecordTitle>{member.name}</MobileRecordTitle>
              <StatusBadge variant={member.role === 'owner' ? 'info' : 'neutral'}>
                {organizationRoleLabel(member.role)}
              </StatusBadge>
            </MobileRecordHeader>
            <MobileRecordMeta>{member.email}</MobileRecordMeta>
            {canRemove && member.role !== 'owner' ? (
              <MobileRecordActions>
                {renderActions?.(member)}
              </MobileRecordActions>
            ) : null}
          </MobileRecord>
        ))}
      </div>
    </>
  )
}
