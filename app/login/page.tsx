'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Briefcase, ShieldCheck, User, Users } from 'lucide-react'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { PageContainer } from '@/components/ui/PageContainer'
import { createClient } from '@/lib/supabase/client'

const NewAthleteModal = dynamic(() => import('@/components/Modals/NewAthleteModal'))

const loginTabs = [
  { id: 'login', label: 'Entrar' },
  { id: 'register', label: 'Criar conta' },
  { id: 'recover', label: 'Recuperar senha' },
] as const

type AuthMode = typeof loginTabs[number]['id']

const modeContent: Record<AuthMode, { eyebrow: string; title: string; description: string }> = {
  login: {
    eyebrow: 'Acesso à plataforma',
    title: 'Entre na sua conta',
    description: 'Acompanhe inscrições e acesse as ferramentas do seu perfil no MEU CAMP.',
  },
  register: {
    eyebrow: 'Novo acesso',
    title: 'Crie sua conta',
    description: 'Escolha o perfil que representa sua participação nas competições.',
  },
  recover: {
    eyebrow: 'Recuperação de acesso',
    title: 'Redefina sua senha',
    description: 'Solicite um link seguro para voltar a acessar sua conta.',
  },
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const requestedMode = searchParams.get('mode')
  const initialMode: AuthMode = loginTabs.some((tab) => tab.id === requestedMode) ? requestedMode as AuthMode : 'login'

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [selectedRegisterType, setSelectedRegisterType] = useState<'atleta' | 'organizador' | 'responsavel' | null>(null)
  const [isNewAthleteModalOpen, setIsNewAthleteModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || ''),
    })

    if (error) {
      setFeedback({ type: 'error', message: 'E-mail ou senha inválidos.' })
      setLoading(false)
      return
    }

    const requestedPath = searchParams.get('redirectTo')
    const redirectTo = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
      ? requestedPath
      : '/dashboard'
    window.location.assign(redirectTo)
  }

  const handleModalSubmit = async (data: any) => {
    setFeedback(null)
    if (data.senha !== data.confirmarSenha) {
      setFeedback({ type: 'error', message: 'As senhas informadas não coincidem.' })
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: String(data.email || '').trim(),
      password: String(data.senha || ''),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/dashboard`,
        data: { nome_completo: data.nomeCompleto, tipo_cadastro: selectedRegisterType },
      },
    })

    if (error) {
      setFeedback({ type: 'error', message: error.message })
      return
    }

    setIsNewAthleteModalOpen(false)
    setSelectedRegisterType(null)
    setMode('login')
    setFeedback({ type: 'success', message: 'Cadastro recebido. Verifique seu e-mail para confirmar a conta.' })
  }

  const openRegistration = (registerType: 'atleta' | 'organizador' | 'responsavel') => {
    setSelectedRegisterType(registerType)
    setIsNewAthleteModalOpen(true)
  }

  const content = modeContent[mode]

  return (
    <main className="min-h-screen bg-mc-background">
      <ModernNavbar />

      <section className="pt-28 sm:pt-32" aria-labelledby="auth-title">
        <PageContainer className="pb-mc-48 sm:pb-mc-64">
          <div className="mx-auto grid max-w-5xl overflow-hidden rounded-mc-large border border-mc-border bg-mc-surface shadow-mc-elevated lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <header className="bg-mc-structure p-mc-24 text-white sm:p-mc-32 lg:p-mc-48">
              <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">{content.eyebrow}</p>
              <h1 id="auth-title" className="mt-mc-12 font-mc-display text-3xl font-semibold leading-tight text-white sm:text-mc-h1">{content.title}</h1>
              <p className="mt-mc-16 max-w-md font-mc-interface leading-6 text-slate-200">{content.description}</p>
              <div className="mt-mc-32 hidden border-t border-white/20 pt-mc-24 font-mc-interface text-sm text-slate-300 lg:flex lg:items-start lg:gap-mc-12">
                <ShieldCheck aria-hidden="true" size={21} className="shrink-0 text-blue-200" />
                <p>Use os dados cadastrados na plataforma para acessar sua conta com segurança.</p>
              </div>
            </header>

            <div className="p-mc-24 sm:p-mc-32 lg:p-mc-48">
              <nav aria-label="Opções de acesso" className="grid grid-cols-3 border-b border-mc-border">
                {loginTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMode(tab.id)
                      setFeedback(null)
                    }}
                    aria-current={mode === tab.id ? 'page' : undefined}
                    className={`min-h-12 border-b-2 px-mc-8 pb-mc-12 font-mc-interface text-xs font-semibold transition-colors duration-mc-normal sm:text-sm ${
                      mode === tab.id
                        ? 'border-mc-action text-mc-action'
                        : 'border-transparent text-mc-text-secondary hover:text-mc-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {feedback ? (
                <Alert variant={feedback.type} role="status" className="mt-mc-24">
                  {feedback.message}
                </Alert>
              ) : null}

              {mode === 'login' ? (
                <form className="mt-mc-32 space-y-mc-24" method="post" onSubmit={handleLogin}>
                  <FormField id="login-email" label="E-mail cadastrado" required>
                    <Input name="email" type="email" placeholder="nome@exemplo.com" required autoComplete="email" />
                  </FormField>

                  <FormField id="login-password" label="Senha" required>
                    <Input name="password" type="password" placeholder="Digite sua senha" required autoComplete="current-password" />
                  </FormField>

                  <div className="flex flex-col gap-mc-12 font-mc-interface text-sm sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex min-h-11 items-center gap-mc-8 text-mc-text-secondary">
                      <input type="checkbox" className="h-4 w-4 rounded border-mc-border text-mc-action focus:ring-mc-focus" />
                      Manter conectado
                    </label>
                    <button type="button" onClick={() => setMode('recover')} className="min-h-11 text-left font-semibold text-mc-action hover:underline sm:text-right">
                      Esqueci a senha
                    </button>
                  </div>

                  <Button type="submit" size="large" disabled={loading || !hydrated} className="w-full">
                    {loading ? 'Entrando...' : 'Entrar na conta'}
                  </Button>

                  <p className="text-center font-mc-interface text-sm text-mc-text-secondary">
                    Ainda não tem acesso?{' '}
                    <button type="button" onClick={() => setMode('register')} className="min-h-11 font-semibold text-mc-action hover:underline">
                      Criar conta
                    </button>
                  </p>
                </form>
              ) : null}

              {mode === 'register' ? (
                <div className="mt-mc-32">
                  <p className="font-mc-interface text-sm leading-6 text-mc-text-secondary">Selecione o tipo de cadastro:</p>
                  <div className="mt-mc-16 divide-y divide-mc-border border-y border-mc-border">
                    <button type="button" onClick={() => openRegistration('atleta')} className="group flex min-h-20 w-full items-center gap-mc-16 py-mc-16 text-left">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-mc-full bg-mc-action/10 text-mc-action"><User aria-hidden="true" size={21} /></span>
                      <span className="min-w-0 flex-1"><strong className="block font-mc-interface text-mc-text-primary">Atleta</strong><span className="mt-mc-4 block font-mc-interface text-sm text-mc-text-secondary">Para participar de eventos e competições.</span></span>
                      <ArrowRight aria-hidden="true" size={19} className="shrink-0 text-mc-text-secondary transition-transform duration-mc-normal group-hover:translate-x-0.5" />
                    </button>
                    <button type="button" onClick={() => openRegistration('organizador')} className="group flex min-h-20 w-full items-center gap-mc-16 py-mc-16 text-left">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-mc-full bg-mc-action/10 text-mc-action"><Briefcase aria-hidden="true" size={21} /></span>
                      <span className="min-w-0 flex-1"><strong className="block font-mc-interface text-mc-text-primary">Organizador</strong><span className="mt-mc-4 block font-mc-interface text-sm text-mc-text-secondary">Para criar e gerenciar eventos.</span></span>
                      <ArrowRight aria-hidden="true" size={19} className="shrink-0 text-mc-text-secondary transition-transform duration-mc-normal group-hover:translate-x-0.5" />
                    </button>
                    <button type="button" onClick={() => openRegistration('responsavel')} className="group flex min-h-20 w-full items-center gap-mc-16 py-mc-16 text-left">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-mc-full bg-mc-action/10 text-mc-action"><Users aria-hidden="true" size={21} /></span>
                      <span className="min-w-0 flex-1"><strong className="block font-mc-interface text-mc-text-primary">Responsável</strong><span className="mt-mc-4 block font-mc-interface text-sm text-mc-text-secondary">Para inscrever atletas menores de idade.</span></span>
                      <ArrowRight aria-hidden="true" size={19} className="shrink-0 text-mc-text-secondary transition-transform duration-mc-normal group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              ) : null}

              {mode === 'recover' ? (
                <div className="mt-mc-32">
                  <p className="font-mc-interface leading-6 text-mc-text-secondary">Enviaremos um link seguro ao e-mail cadastrado para você definir uma nova senha.</p>
                  <Link
                    href="/recuperar-senha"
                    className="mt-mc-24 inline-flex min-h-12 w-full items-center justify-center gap-mc-8 rounded-mc-medium bg-mc-action px-mc-24 font-mc-interface font-semibold text-white transition-colors duration-mc-normal hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
                  >
                    Solicitar link de recuperação
                    <ArrowRight aria-hidden="true" size={18} />
                  </Link>
                  <button type="button" onClick={() => setMode('login')} className="mt-mc-16 min-h-11 w-full font-mc-interface text-sm font-semibold text-mc-action hover:underline">
                    Voltar para o login
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </PageContainer>
      </section>

      {isNewAthleteModalOpen ? (
        <NewAthleteModal
          open={isNewAthleteModalOpen}
          onClose={() => {
            setIsNewAthleteModalOpen(false)
            setSelectedRegisterType(null)
          }}
          onSubmit={handleModalSubmit}
          mode="create"
          showPasswordFields={true}
          registerType={selectedRegisterType || 'atleta'}
        />
      ) : null}

      <ModernFooter />
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-mc-background" aria-busy="true" />}>
      <LoginPageContent />
    </Suspense>
  )
}
