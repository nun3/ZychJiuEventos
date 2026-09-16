'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
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
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-[#0C3049]">Definir nova senha</h1>
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
        <label className="block text-sm font-semibold text-gray-700">Nova senha<input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-lg border px-4 py-3" /></label>
        <label className="block text-sm font-semibold text-gray-700">Confirmar nova senha<input name="confirmation" type="password" required minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-lg border px-4 py-3" /></label>
        <button disabled={loading} className="w-full rounded-lg bg-primary-blue py-3 font-semibold text-white disabled:opacity-50">{loading ? 'Atualizando...' : 'Atualizar senha'}</button>
      </form>
    </main>
  )
}
