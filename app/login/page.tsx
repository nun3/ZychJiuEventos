'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Briefcase, GraduationCap, ShieldCheck, User, Users } from 'lucide-react'
import type { SignupRole } from '@/lib/auth/signup-role'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { PageContainer } from '@/components/ui/PageContainer'
import { resolvePostLoginRedirect } from '@/lib/auth/post-login-redirect'
import { createClient } from '@/lib/supabase/client'
import SignupAccountForm from './SignupAccountForm'

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

const roleOptions: ReadonlyArray<{ role: SignupRole; title: string; description: string; icon: typeof User }> = [
  { role: 'atleta', title: 'Atleta', description: 'Para participar de eventos.', icon: User },
  { role: 'professor', title: 'Professor', description: 'Para gerenciar equipe.', icon: GraduationCap },
  { role: 'organizador', title: 'Organizador', description: 'Para criar eventos.', icon: Briefcase },
  { role: 'responsavel', title: 'Responsável', description: 'Para inscrever menores.', icon: Users },
]

const registerRoleCopy: Record<SignupRole, string> = {
  atleta: 'Para participar de eventos e competições.',
  professor: 'Para gerenciar equipe e inscrever atletas vinculados, inclusive menores.',
  organizador: 'Para criar e gerenciar eventos.',
  responsavel: 'Para cadastrar e inscrever atletas menores de idade.',
}

const darkPanelTheme = "[&_.text-mc-text-secondary]:text-white/70 [&_.text-mc-text-primary]:text-white [&_.text-mc-action]:text-blue-300 [&_.text-mc-action:hover]:text-blue-200 [&_.border-mc-border]:border-white/15 [&_.divide-mc-border]:divide-white/15 [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:text-white [&_input::placeholder]:text-white/40 [&_input:hover]:border-white/40 [&_input:focus]:border-white [&_input:focus]:ring-white/20 [&_[role=status]]:!bg-white [&_[role=status]]:!text-mc-text-primary [&_[role=status]_*]:!text-mc-text-primary"

function LoginPageContent() {
  const searchParams = useSearchParams()
  const requestedMode = searchParams.get('mode')
  const initialMode: AuthMode = loginTabs.some((tab) => tab.id === requestedMode) ? requestedMode as AuthMode : 'login'

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [selectedRegisterType, setSelectedRegisterType] = useState<SignupRole | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return
    setFeedback(null)
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
      })

      if (error) {
        setFeedback({ type: 'error', message: 'E-mail ou senha inválidos.' })
        setLoading(false)
        return
      }

      const redirectTo = resolvePostLoginRedirect(searchParams.get('redirectTo'), '/dashboard')
      window.location.assign(redirectTo)
    } catch {
      setFeedback({ type: 'error', message: 'Não foi possível entrar agora. Tente novamente.' })
      setLoading(false)
    }
  }

  const openRegistration = (registerType: SignupRole) => {
    setMode('register')
    setSelectedRegisterType(registerType)
    setFeedback(null)
  }

  const content = modeContent[mode]

  return (
    <main className="min-h-screen bg-mc-nav-dark">
      <ModernNavbar overlayAtTop />

      <section data-login-stage aria-labelledby="auth-title" className="relative isolate overflow-hidden pb-14 pt-28 sm:pt-32 lg:pb-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-cover bg-[position:70%_center] bg-no-repeat [background-image:url('/images/cinematic/mc-hero-mobile.jpg')] md:bg-[position:center] md:[background-image:url('/images/cinematic/mc-hero.jpg')]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-mc-nav-dark/80 via-mc-nav-dark/35 to-transparent lg:via-mc-nav-dark/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-mc-nav-dark/45 via-transparent to-transparent" />
        </div>

        <PageContainer fluid className="relative z-10">
          <div className="glass-effect grid max-w-5xl overflow-hidden rounded-mc-large shadow-mc-elevated lg:grid-cols-2">
            <div data-mc-auth-enter className="flex flex-col justify-between gap-mc-24 p-mc-24 text-white sm:p-mc-32 lg:gap-0 lg:p-mc-48">
              <div>
                <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">{content.eyebrow}</p>
                <h1 id="auth-title" className="mt-mc-12 font-mc-display text-3xl font-semibold leading-tight text-white sm:text-mc-h1">{content.title}</h1>
                <p className="mt-mc-16 max-w-md font-mc-interface leading-6 text-white/80">{content.description}</p>
              </div>

              {mode === 'login' ? (
                <nav aria-label="Atalhos de cadastro por perfil" className="mt-mc-24 divide-y divide-white/10 border-y border-white/10 lg:mt-mc-32">
                  {roleOptions.map(({ role, title, description, icon: Icon }) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => openRegistration(role)}
                      className="group flex min-h-16 w-full items-center gap-mc-16 rounded-mc-small py-mc-12 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-mc-full bg-white/10 text-blue-200">
                        <Icon aria-hidden="true" size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block font-mc-interface text-sm text-white">{title}</strong>
                        <span className="mt-0.5 block font-mc-interface text-xs text-white/65">{description}</span>
                      </span>
                      <ArrowRight aria-hidden="true" size={16} className="shrink-0 text-white/50 transition-transform duration-mc-normal group-hover:translate-x-0.5 group-hover:text-white" />
                    </button>
                  ))}
                </nav>
              ) : (
                <div className="mt-mc-32 hidden border-t border-white/20 pt-mc-24 font-mc-interface text-sm text-white/75 lg:flex lg:items-start lg:gap-mc-12">
                  <ShieldCheck aria-hidden="true" size={21} className="shrink-0 text-blue-200" />
                  <p>Use os dados cadastrados na plataforma para acessar sua conta com segurança.</p>
                </div>
              )}
            </div>

            <div data-mc-auth-enter-delay className={`flex flex-col justify-center border-t border-white/15 p-mc-24 text-white sm:p-mc-32 lg:border-l lg:border-t-0 lg:p-mc-48 ${darkPanelTheme}`}>
              <nav aria-label="Opções de acesso" className="grid grid-cols-3 border-b border-mc-border">
                {loginTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMode(tab.id)
                      setFeedback(null)
                      if (tab.id !== 'register') setSelectedRegisterType(null)
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

                  <div className="flex justify-end font-mc-interface text-sm">
                    <button type="button" onClick={() => setMode('recover')} className="min-h-11 font-semibold text-mc-action hover:underline">
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
                  {selectedRegisterType ? (
                    <SignupAccountForm role={selectedRegisterType} onBack={() => setSelectedRegisterType(null)} />
                  ) : (
                    <>
                      <p className="font-mc-interface text-sm leading-6 text-mc-text-secondary">Selecione o tipo de cadastro. Somente maiores de 18 anos criam login.</p>
                      <div className="mt-mc-16 divide-y divide-mc-border border-y border-mc-border">
                        {roleOptions.map(({ role, title, icon: Icon }) => (
                          <button key={role} type="button" onClick={() => openRegistration(role)} className="group flex min-h-20 w-full items-center gap-mc-16 py-mc-16 text-left">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-mc-full bg-mc-action/10 text-mc-action"><Icon aria-hidden="true" size={21} /></span>
                            <span className="min-w-0 flex-1"><strong className="block font-mc-interface text-mc-text-primary">{title}</strong><span className="mt-mc-4 block font-mc-interface text-sm text-mc-text-secondary">{registerRoleCopy[role]}</span></span>
                            <ArrowRight aria-hidden="true" size={19} className="shrink-0 text-mc-text-secondary transition-transform duration-mc-normal group-hover:translate-x-0.5" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
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

      <div data-no-scroll-choreography>
        <ModernFooter />
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-mc-nav-dark" aria-busy="true" />}>
      <LoginPageContent />
    </Suspense>
  )
}
