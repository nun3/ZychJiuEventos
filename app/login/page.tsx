 'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'

const loginTabs = [
  { id: 'login', label: 'Entrar' },
  { id: 'register', label: 'Criar conta' },
  { id: 'recover', label: 'Recuperar senha' },
]

const accessTabs = [
  { id: 'cpf', label: 'Por CPF', placeholder: 'CPF do cadastro', mask: '123.456.789-00' },
  { id: 'email', label: 'Por e-mail', placeholder: 'E-mail cadastrado', mask: 'nome@exemplo.com' },
]

export default function LoginPage() {
  const searchParams = useSearchParams()
  const initialMode = (searchParams.get('mode') as 'login' | 'register' | 'recover') || 'login'

  const [mode, setMode] = useState<'login' | 'register' | 'recover'>(initialMode)
  const [activeTab, setActiveTab] = useState<'cpf' | 'email'>('cpf')

  const currentTab = accessTabs.find((tab) => tab.id === activeTab)!

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ModernNavbar />

      <section className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col items-center">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-gray-200 bg-[#0C3049] px-6 py-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Portal do atleta</p>
                <h1 className="mt-1 text-2xl font-bold">
                  {mode === 'login' && 'Acessar conta'}
                  {mode === 'register' && 'Criar conta'}
                  {mode === 'recover' && 'Recuperar senha'}
                </h1>
              </div>
              <div className="text-right text-xs text-orange-100">
                {mode !== 'login' ? (
                  <>
                    Já tem cadastro?
                    <br />
                    <button
                      onClick={() => setMode('login')}
                      className="mt-1 inline-flex items-center rounded-full bg-primary-blue px-4 py-1 text-sm font-semibold text-white shadow hover:bg-blue-700"
                    >
                      Voltar para login
                    </button>
                  </>
                ) : (
                  <>
                    Ainda não tem acesso?
                    <br />
                    <button
                      onClick={() => setMode('register')}
                      className="mt-1 inline-flex items-center rounded-full bg-primary-blue px-4 py-1 text-sm font-semibold text-white shadow hover:bg-blue-700"
                    >
                      + Novo cadastro
                    </button>
                  </>
                )}
              </div>
            </header>

            <div className="px-6 py-8">
              {/* Tabs principais: Entrar / Criar conta / Recuperar senha */}
              <div className="mb-6 inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 text-xs sm:text-sm font-semibold text-gray-500">
                {loginTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMode(tab.id as typeof mode)}
                    className={`rounded-full px-3 sm:px-4 py-2 transition ${
                      mode === tab.id ? 'bg-white text-primary-blue shadow' : 'hover:text-primary-blue'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {mode === 'login' && (
                <form className="space-y-5">
                  <div className="mb-4 inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 text-xs sm:text-sm font-semibold text-gray-500">
                    {accessTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'cpf' | 'email')}
                        type="button"
                        className={`rounded-full px-3 sm:px-4 py-2 transition ${
                          tab.id === activeTab ? 'bg-white text-primary-blue shadow' : 'hover:text-primary-blue'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                      {currentTab.placeholder}
                    </label>
                    <input
                      type={activeTab === 'cpf' ? 'text' : 'email'}
                      placeholder={currentTab.mask}
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Senha</label>
                    <input
                      type="password"
                      placeholder="Digite sua senha"
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-gray-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary-blue focus:ring-primary-blue/60"
                      />
                      Manter conectado
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('recover')}
                      className="font-semibold text-primary-blue hover:text-blue-700"
                    >
                      Esqueci a senha
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-primary-blue py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md hover:bg-blue-700 transition"
                  >
                    Acessar
                  </button>

                  <div className="relative py-2 text-center text-xs font-semibold uppercase tracking-[0.4em] text-gray-400">
                    <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-gray-200" aria-hidden />
                    <span className="bg-white px-2">ou</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="w-full rounded-lg bg-primary-blue py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md hover:bg-blue-700 transition text-center inline-block"
                  >
                    + Novo cadastro
                  </button>
                </form>
              )}

              {mode === 'register' && (
                <div className="space-y-4 text-sm text-gray-700">
                  <p>
                    Preencha seu cadastro para acessar o portal do atleta e inscrever-se em eventos. Em breve esta etapa
                    será um wizard completo na própria tela de login.
                  </p>
                  <ul className="list-disc list-inside text-xs sm:text-sm text-gray-600 space-y-1">
                    <li>Dados pessoais (nome, data de nascimento, documento).</li>
                    <li>Endereço e contato.</li>
                    <li>Dados esportivos (equipe, professor, faixa, peso).</li>
                    <li>Criação de senha de acesso.</li>
                  </ul>
                  <Link
                    href="/cadastro"
                    className="mt-2 inline-flex justify-center rounded-lg bg-primary-blue px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md hover:bg-blue-700 transition"
                  >
                    Abrir formulário de cadastro
                  </Link>
                </div>
              )}

              {mode === 'recover' && (
                <div className="space-y-4 text-sm text-gray-700">
                  <p>
                    Escolha a opção desejada para recuperar sua senha. Hoje o fluxo continua em uma tela dedicada, mas
                    será integrado aqui futuramente.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/recuperar-senha"
                      className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 hover:border-primary-blue transition"
                    >
                      <span className="text-sm font-semibold text-gray-800">Recuperar por WhatsApp</span>
                      <span className="text-xs text-gray-600">
                        Receba uma mensagem no número cadastrado para redefinir sua senha.
                      </span>
                    </Link>
                    <Link
                      href="/recuperar-senha"
                      className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 hover:border-primary-blue transition"
                    >
                      <span className="text-sm font-semibold text-gray-800">Recuperar por e-mail</span>
                      <span className="text-xs text-gray-600">
                        Enviaremos um link de redefinição para o seu e-mail cadastrado.
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ModernFooter />
    </main>
  )
}

