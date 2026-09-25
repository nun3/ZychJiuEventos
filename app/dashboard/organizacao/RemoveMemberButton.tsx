'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { removeOrganizationMember } from './actions'

export default function RemoveMemberButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-mc-8">
      {message ? <Alert variant="error" role="status">{message}</Alert> : null}
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        aria-label={`Remover ${name}`}
        onClick={() => {
          const data = new FormData()
          data.set('member_user_id', userId)
          setMessage(null)
          startTransition(async () => {
            const result = await removeOrganizationMember(data)
            if (result.ok) router.refresh()
            else setMessage(result.message)
          })
        }}
      >
        {isPending ? 'Removendo...' : 'Remover'}
      </Button>
    </div>
  )
}
