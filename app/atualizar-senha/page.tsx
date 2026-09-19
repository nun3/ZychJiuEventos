'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ModernFooter from '@/components/ModernFooter'
import ModernNavbar from '@/components/ModernNavbar'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { PageContainer } from '@/components/ui/PageContainer'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') || '')
    const confirmation = String(formData.get('confirmation') || '')
    if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.')
    if (password !== confirmation) return setError('As senhas não coincidem.')
    setLoading(true)
    const { error: updateError } = await createClient().auth.updateUser({ password })
    if (updateError) {
      setError('O link expirou ou a senha não pôde ser atualizada. Solicite um novo link.')
      setLoading(false)
      return
    }
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-mc-background">
      <ModernNavbar />
      <section className="pt-28 sm:pt-32" aria-labelledby="update-password-title">
        <PageContainer className="pb-mc-48 sm:pb-mc-64">
          <div className="mx-auto grid max-w-5xl overflow-hidden rounded-mc-large border border-mc-border bg-mc-surface shadow-mc-elevated lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <header className="bg-mc-structure p-mc-24 text-white sm:p-mc-32 lg:p-mc-48">
              <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Conta e segurança</p>
              <h1 id="update-password-title" className="mt-mc-12 font-mc-display text-3xl font-semibold leading-tight sm:text-mc-h1">Definir nova senha</h1>
              <p className="mt-mc-16 max-w-md font-mc-interface leading-6 text-slate-200">
                Escolha uma senha nova para voltar ao painel. Depois do salvamento, você segue autenticado.
              </p>
            </header>
            <div className="p-mc-24 sm:p-mc-32 lg:p-mc-48">
              {error ? <Alert variant="error" role="alert" className="mb-mc-24">{error}</Alert> : null}
              <form className="space-y-mc-24" onSubmit={handleSubmit}>
                <FormField id="new-password" label="Nova senha" required>
                  <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
                </FormField>
                <FormField id="confirm-password" label="Confirmar nova senha" required>
                  <Input name="confirmation" type="password" required minLength={8} autoComplete="new-password" />
                </FormField>
                <Button type="submit" size="large" disabled={loading} className="w-full">
                  {loading ? 'Atualizando...' : 'Atualizar senha'}
                </Button>
              </form>
              <p className="mt-mc-24 text-center font-mc-interface text-sm text-mc-text-secondary">
                <Link href="/recuperar-senha" className="font-semibold text-mc-action hover:underline">Solicitar novo link</Link>
              </p>
            </div>
          </div>
        </PageContainer>
      </section>
      <ModernFooter />
    </main>
  )
}
