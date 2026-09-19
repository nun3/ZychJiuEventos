'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import ModernFooter from '@/components/ModernFooter'
import ModernNavbar from '@/components/ModernNavbar'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { PageContainer } from '@/components/ui/PageContainer'
import { createClient } from '@/lib/supabase/client'

export default function PasswordRecoveryPage() {
  const [message, setMessage] = useState('')
  const [expired, setExpired] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('erro') === 'link_expirado') {
      setExpired(true)
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setExpired(false)
    const email = String(new FormData(event.currentTarget).get('email') || '').trim()
    await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirectTo=/atualizar-senha`,
    })
    setMessage('Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-mc-background">
      <ModernNavbar />
      <section className="pt-28 sm:pt-32" aria-labelledby="recovery-title">
        <PageContainer className="pb-mc-48 sm:pb-mc-64">
          <div className="mx-auto grid max-w-5xl overflow-hidden rounded-mc-large border border-mc-border bg-mc-surface shadow-mc-elevated lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <header className="bg-mc-structure p-mc-24 text-white sm:p-mc-32 lg:p-mc-48">
              <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Recuperação de acesso</p>
              <h1 id="recovery-title" className="mt-mc-12 font-mc-display text-3xl font-semibold leading-tight sm:text-mc-h1">Recuperar senha</h1>
              <p className="mt-mc-16 max-w-md font-mc-interface leading-6 text-slate-200">
                Enviaremos um link seguro para o e-mail cadastrado. Use apenas o e-mail mais recente.
              </p>
            </header>
            <div className="p-mc-24 sm:p-mc-32 lg:p-mc-48">
              {expired ? <Alert variant="warning" role="status" className="mb-mc-24">Esse link expirou ou já foi utilizado. Solicite um novo.</Alert> : null}
              {message ? <Alert variant="success" role="status" className="mb-mc-24">{message}</Alert> : null}
              <form className="space-y-mc-24" onSubmit={handleSubmit}>
                <FormField id="recovery-email" label="E-mail cadastrado" required>
                  <Input name="email" type="email" required autoComplete="email" placeholder="nome@exemplo.com" />
                </FormField>
                <Button type="submit" size="large" disabled={loading} className="w-full">
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
              </form>
              <p className="mt-mc-24 text-center font-mc-interface text-sm text-mc-text-secondary">
                <Link href="/login" className="font-semibold text-mc-action hover:underline">Voltar para o login</Link>
              </p>
            </div>
          </div>
        </PageContainer>
      </section>
      <ModernFooter />
    </main>
  )
}
