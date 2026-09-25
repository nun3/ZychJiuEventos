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
}: {
  members: OrganizationMemberRow[]
  renderActions?: (member: OrganizationMemberRow) => ReactNode
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

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left font-mc-interface text-sm">
          <thead>
            <tr className="border-b border-mc-border text-mc-text-secondary">
              <th className="px-mc-16 py-mc-12 font-semibold">Nome</th>
              <th className="px-mc-16 py-mc-12 font-semibold">E-mail</th>
              <th className="px-mc-16 py-mc-12 font-semibold">Papel</th>
              {canRemove ? <th className="px-mc-16 py-mc-12 font-semibold">Ações</th> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={`${member.userId}-${member.role}`} className="border-b border-mc-border last:border-0">
                <td className="px-mc-16 py-mc-12 font-semibold text-mc-text-primary">{member.name}</td>
                <td className="px-mc-16 py-mc-12 text-mc-text-secondary">{member.email}</td>
                <td className="px-mc-16 py-mc-12">
                  <StatusBadge variant={member.role === 'owner' ? 'info' : 'neutral'}>
                    {organizationRoleLabel(member.role)}
                  </StatusBadge>
                </td>
                {canRemove ? (
                  <td className="px-mc-16 py-mc-12">
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
