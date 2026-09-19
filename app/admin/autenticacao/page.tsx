'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { PageContainer } from '@/components/ui/PageContainer'
import { createClient } from '@/lib/supabase/client'

export default function AdminAuthPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const { error } = await createClient().auth.signInWithPassword({ email: usuario.trim(), password: senha })
    if (error) {
      setErro('E-mail ou senha inválidos')
      setCarregando(false)
      return
    }
    router.replace('/admin/eventos')
    router.refresh()
  }

  return (
    <section className="pb-mc-48 sm:pb-mc-64" aria-labelledby="admin-auth-title">
      <PageContainer>
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-mc-large border border-mc-border bg-mc-surface shadow-mc-elevated lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <header className="bg-mc-structure p-mc-24 text-white sm:p-mc-32 lg:p-mc-48">
            <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Administração</p>
            <h1 id="admin-auth-title" className="mt-mc-12 font-mc-display text-3xl font-semibold leading-tight sm:text-mc-h1">Entrar como organizador</h1>
            <p className="mt-mc-16 max-w-md font-mc-interface leading-6 text-slate-200">
              Use a conta que administra eventos para configurar, checar, montar chaves e registrar resultados.
            </p>
          </header>
          <div className="p-mc-24 sm:p-mc-32 lg:p-mc-48">
            {erro ? <Alert variant="error" role="alert" className="mb-mc-24">{erro}</Alert> : null}
            <form onSubmit={handleSubmit} className="space-y-mc-24">
              <FormField id="admin-email" label="E-mail" required>
                <Input type="email" value={usuario} onChange={(event) => setUsuario(event.target.value)} placeholder="nome@exemplo.com" required autoComplete="email" />
              </FormField>
              <FormField id="admin-password" label="Senha" required>
                <div className="relative">
                  <Input type={mostrarSenha ? 'text' : 'password'} value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Digite sua senha" required autoComplete="current-password" className="pr-12" />
                  <button type="button" onClick={() => setMostrarSenha((value) => !value)} className="absolute inset-y-0 right-0 inline-flex min-w-11 items-center justify-center text-mc-text-secondary hover:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus" aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>
                    {mostrarSenha ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                  </button>
                </div>
              </FormField>
              <div className="flex justify-end">
                <Link href="/recuperar-senha" className="inline-flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline">
                  Esqueci a senha
                </Link>
              </div>
              <Button type="submit" size="large" disabled={carregando} className="w-full">
                {carregando ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            <p className="mt-mc-24 text-center font-mc-interface text-sm text-mc-text-secondary">
              Ainda não tem acesso?{' '}
              <Link href="/login?mode=register" className="font-semibold text-mc-action hover:underline">Criar conta</Link>
            </p>
          </div>
        </div>
      </PageContainer>
    </section>
  )
}
