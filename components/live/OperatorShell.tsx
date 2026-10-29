'use client'

import type { OperatorPageData } from '@/app/admin/eventos/[id]/operacao/types'
import { OperatorBoard } from './OperatorBoard'

/** Shell dedicado da mesa ao vivo — sem chrome administrativo tradicional. */
export function OperatorShell({
  data,
  areaId,
  matchId,
}: {
  data: OperatorPageData
  areaId: string | null
  matchId: string | null
}) {
  return <OperatorBoard data={data} initialAreaId={areaId} initialMatchId={matchId} />
}
