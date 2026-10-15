'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function CopyPixKeyButton({ value }: { value: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const timer = window.setTimeout(() => setStatus('idle'), 4000)
    return () => window.clearTimeout(timer)
  }, [status])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <div className="flex flex-col gap-mc-8 sm:flex-row sm:items-center">
      <Button type="button" variant="primary" size="large" onClick={copy} className="w-full gap-mc-8 sm:w-auto">
        {status === 'copied' ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
        {status === 'copied' ? 'Chave copiada' : 'Copiar chave PIX'}
      </Button>
      <p aria-live="polite" className="font-mc-interface text-sm text-mc-text-secondary">
        {status === 'copied' ? 'Cole a chave no app do seu banco.' : null}
        {status === 'failed' ? 'Não foi possível copiar. Selecione a chave e copie manualmente.' : null}
      </p>
    </div>
  )
}
