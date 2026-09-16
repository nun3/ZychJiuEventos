'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import { createClient } from '@/lib/supabase/client'
import { FiInfo } from 'react-icons/fi'

export default function PasswordRecoveryPage() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('erro') === 'link_expirado') {
      setMessage('Esse link expirou ou já foi utilizado. Solicite um novo e use apenas o e-mail mais recente.')
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const email = String(new FormData(event.currentTarget).get('email') || '').trim()
    await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirectTo=/atualizar-senha`,
    })
    setMessage('Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ModernNavbar />
      <section className="container mx-auto px-4 pt-32 pb-16">
        <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
          <header className="flex items-center justify-between border-b border-gray-200 bg-[#0C3049] px-6 py-4 text-white">
            <div><p className="text-xs uppercase tracking-[0.28em] text-blue-300">Portal do atleta</p><h1 className="mt-1 text-2xl font-bold">Recuperar senha</h1></div>
            <Link href="/login" className="rounded-full bg-primary-blue px-4 py-2 text-sm font-semibold hover:bg-blue-700">Voltar para login</Link>
          </header>
          <div className="px-6 py-8">
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"><FiInfo className="mt-1 flex-shrink-0" size={16} /><p>Enviaremos um link seguro para o e-mail associado à sua conta.</p></div>
            {message && <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">{message}</p>}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2"><label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-gray-600">E-mail cadastrado</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="nome@exemplo.com" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40" /></div>
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary-blue py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Enviando...' : 'Enviar link de recuperação'}</button>
            </form>
          </div>
        </div>
      </section>
      <ModernFooter />
    </main>
  )
}
