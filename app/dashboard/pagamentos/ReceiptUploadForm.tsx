'use client'

import { type FormEvent, useEffect, useRef, useState, useTransition } from 'react'
import { useFormState } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { PAYMENT_RECEIPT_ACCEPT, PAYMENT_RECEIPT_MAX_BYTES } from '@/lib/finance/payment-receipt'
import { submitPaymentReceipt, type ReceiptUploadState } from './receipt-actions'

const initialState: ReceiptUploadState = { ok: false, message: null }
const ACCEPTED = new Set(PAYMENT_RECEIPT_ACCEPT.split(','))
const MAX_EDGE = 2400

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem.'))
    }
    image.src = url
  })
}

/** Fotos grandes de celular são reduzidas no aparelho; o servidor valida o resultado de novo. */
async function shrinkPhoto(file: File): Promise<File> {
  const image = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas indisponível.')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  for (const quality of [0.85, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (blob && blob.size <= PAYMENT_RECEIPT_MAX_BYTES) {
      return new File([blob], 'comprovante.jpg', { type: 'image/jpeg' })
    }
  }
  throw new Error('A foto continua grande demais.')
}

export default function ReceiptUploadForm({ paymentId, resubmission }: { paymentId: string; resubmission: boolean }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, formAction] = useFormState(submitPaymentReceipt, initialState)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (state.ok) {
      if (inputRef.current) inputRef.current.value = ''
      router.refresh()
    }
  }, [state, router])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)
    const original = inputRef.current?.files?.[0]
    if (!original) {
      setLocalError('Selecione o arquivo do comprovante.')
      return
    }
    if (original.type && !ACCEPTED.has(original.type)) {
      setLocalError('Envie uma foto (JPG ou PNG) ou um PDF do comprovante.')
      return
    }
    startTransition(async () => {
      let file = original
      if (original.size > PAYMENT_RECEIPT_MAX_BYTES) {
        if (original.type === 'application/pdf') {
          setLocalError('O PDF deve ter no máximo 4 MB.')
          return
        }
        try {
          file = await shrinkPhoto(original)
        } catch {
          setLocalError('A foto é grande demais. Tire um print do comprovante e envie novamente.')
          return
        }
      }
      const data = new FormData()
      data.set('payment_id', paymentId)
      data.set('receipt', file)
      formAction(data)
    })
  }

  const message = localError || state.message
  const failed = Boolean(localError) || (Boolean(state.message) && !state.ok)

  return (
    <form onSubmit={handleSubmit} className="space-y-mc-16" aria-describedby={message ? 'receipt-feedback' : undefined}>
      {message ? (
        <Alert id="receipt-feedback" variant={failed ? 'error' : 'success'} role={failed ? 'alert' : 'status'}>
          {message}
        </Alert>
      ) : null}
      <FormField
        id="receipt-file"
        label={resubmission ? 'Novo comprovante' : 'Arquivo do comprovante'}
        required
        description="Foto (JPG ou PNG) ou PDF do comprovante, até 4 MB. Mostre valor, data e favorecido."
      >
        <input
          ref={inputRef}
          name="receipt"
          type="file"
          required
          accept={PAYMENT_RECEIPT_ACCEPT}
          className="block w-full rounded-mc-medium border border-mc-border bg-mc-surface font-mc-interface text-sm text-mc-text-primary file:mr-mc-12 file:min-h-11 file:border-0 file:bg-mc-surface-secondary file:px-mc-16 file:font-semibold file:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
        />
      </FormField>
      <Button type="submit" size="large" disabled={isPending} aria-busy={isPending} className="w-full sm:w-auto">
        {isPending ? 'Enviando…' : resubmission ? 'Enviar novo comprovante' : 'Enviar comprovante'}
      </Button>
    </form>
  )
}
