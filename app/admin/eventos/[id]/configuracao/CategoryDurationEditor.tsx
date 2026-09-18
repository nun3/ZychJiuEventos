'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { setEventCategoryDuration } from '../../actions'
import { FIGHT_DURATION_MAX_MINUTES, FIGHT_DURATION_MIN_MINUTES, FIGHT_DURATION_STEP_MINUTES } from '@/lib/events/fight-duration'

export default function CategoryDurationEditor({
  eventId,
  categoryId,
  durationMinutes,
}: {
  eventId: string
  categoryId: string
  durationMinutes: number | null
}) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const statusId = `fight-duration-status-${categoryId}`
  return (
    <form
      action={(data) => startTransition(async () => {
        const result = await setEventCategoryDuration(data)
        setMessage(result.message)
      })}
      className="grid min-w-0 gap-mc-8"
    >
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="category_id" value={categoryId} />
      <label htmlFor={`fight-duration-${categoryId}`} className="sr-only">Duração oficial da luta em minutos</label>
      <div className="flex min-w-0 items-center gap-mc-8">
        <Input
          id={`fight-duration-${categoryId}`}
          name="duration_minutes"
          type="number"
          inputMode="decimal"
          min={FIGHT_DURATION_MIN_MINUTES}
          max={FIGHT_DURATION_MAX_MINUTES}
          step={FIGHT_DURATION_STEP_MINUTES}
          defaultValue={durationMinutes ?? ''}
          placeholder="min"
          aria-describedby={message ? statusId : undefined}
          className="max-w-[7.5rem]"
        />
        <Button type="submit" size="small" disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</Button>
      </div>
      {message ? <p id={statusId} role="status" className="text-xs text-mc-text-secondary">{message}</p> : null}
    </form>
  )
}
