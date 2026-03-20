 'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import NewAthleteModal from '@/components/Modals/NewAthleteModal'
import { User, Users, Briefcase } from 'lucide-react'

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
  const [selectedRegisterType, setSelectedRegisterType] = useState<'atleta' | 'organizador' | 'responsavel' | null>(null)
  const [isNewAthleteModalOpen, setIsNewAthleteModalOpen] = useState(false)

  const handleModalSubmit = (data: any) => {
    // Aqui você pode adicionar lógica para salvar o cadastro
    console.log('Dados cadastrados:', data)
    setIsNewAthleteModalOpen(false)
    setSelectedRegisterType(null)
    // Após cadastro, pode redirecionar para login ou mostrar mensagem de sucesso
    setMode('login')
  }

  const currentTab = accessTabs.find((tab) => tab.id === activeTab)!

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ModernNavbar />

      <section className="container mx-auto px-4 pt-32 pb-12">
        <div className="flex flex-col items-center">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-gray-200 bg-[#0C3049] px-6 py-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Portal do atleta</p>
                <h1 className="mt-1 text-xl sm:text-2xl font-bold">
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
                      className="mt-1 inline-flex items-center rounded-full bg-primary-blue px-4 py-1 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
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
                      className="mt-1 inline-flex items-center rounded-full bg-primary-blue px-4 py-1 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
                    >
                      + Novo cadastro
                    </button>
                  </>
                )}
              </div>
            </header>

            <div className="px-6 py-8">
              {/* Tabs principais: Entrar / Criar conta / Recuperar senha */}
              <div className="mb-6 inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-semibold text-gray-500">
                {loginTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMode(tab.id as typeof mode)}
                    className={`rounded-full px-4 py-2 transition ${
                      mode === tab.id ? 'bg-white text-primary-blue shadow' : 'hover:text-primary-blue'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {mode === 'login' && (
                <form className="space-y-6">
                  <div className="mb-6 inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-semibold text-gray-500">
                    {accessTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'cpf' | 'email')}
                        type="button"
                        className={`rounded-full px-4 py-2 transition ${
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
                      className="font-semibold text-primary-blue hover:text-blue-700 transition"
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

                  <div className="relative py-3 text-center text-xs font-semibold uppercase tracking-[0.4em] text-gray-400">
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
                <div className="space-y-6">
                  {!selectedRegisterType ? (
                    <>
                      <div className="text-center mb-6">
                        <p className="text-sm text-gray-700 leading-relaxed mb-2">
                          Selecione o tipo de cadastro que deseja realizar:
                        </p>
                      </div>

                      {/* Cards de seleção de tipo de cadastro */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Card: Atleta */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRegisterType('atleta')
                            setIsNewAthleteModalOpen(true)
                          }}
                          className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-blue hover:shadow-lg transition-all group"
                        >
                          <div className="w-16 h-16 rounded-full bg-primary-blue/10 flex items-center justify-center mb-3 group-hover:bg-primary-blue/20 transition">
                            <User size={24} className="text-primary-blue" />
                          </div>
                          <h3 className="text-base font-bold text-gray-900 mb-2">Atleta</h3>
                          <p className="text-xs text-gray-600 text-center">
                            Cadastro para atletas que participarão de eventos e competições.
                          </p>
                        </button>

                        {/* Card: Organizador */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRegisterType('organizador')
                            setIsNewAthleteModalOpen(true)
                          }}
                          className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-blue hover:shadow-lg transition-all group"
                        >
                          <div className="w-16 h-16 rounded-full bg-primary-blue/10 flex items-center justify-center mb-3 group-hover:bg-primary-blue/20 transition">
                            <Briefcase size={24} className="text-primary-blue" />
                          </div>
                          <h3 className="text-base font-bold text-gray-900 mb-2">Organizador</h3>
                          <p className="text-xs text-gray-600 text-center">
                            Cadastro para organizadores que criarão e gerenciarão eventos.
                          </p>
                        </button>

                        {/* Card: Responsável */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRegisterType('responsavel')
                            setIsNewAthleteModalOpen(true)
                          }}
                          className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-blue hover:shadow-lg transition-all group"
                        >
                          <div className="w-16 h-16 rounded-full bg-primary-blue/10 flex items-center justify-center mb-3 group-hover:bg-primary-blue/20 transition">
                            <Users size={24} className="text-primary-blue" />
                          </div>
                          <h3 className="text-base font-bold text-gray-900 mb-2">Responsável</h3>
                          <p className="text-xs text-gray-600 text-center">
                            Cadastro para responsáveis que inscreverão atletas menores de idade.
                          </p>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedRegisterType(null)}
                        className="text-sm text-primary-blue hover:text-blue-700 mb-4 inline-flex items-center gap-2"
                      >
                        ← Voltar para seleção de tipo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {mode === 'recover' && (
                <div className="space-y-6 text-sm text-gray-700">
                  <p className="leading-relaxed">
                    Escolha a opção desejada para recuperar sua senha. Hoje o fluxo continua em uma tela dedicada, mas
                    será integrado aqui futuramente.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                      href="/recuperar-senha"
                      className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 hover:border-primary-blue transition"
                    >
                      <span className="text-sm font-semibold text-gray-800">Recuperar por WhatsApp</span>
                      <span className="text-xs text-gray-600">
                        Receba uma mensagem no número cadastrado para redefinir sua senha.
                      </span>
                    </Link>
                    <Link
                      href="/recuperar-senha"
                      className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 hover:border-primary-blue transition"
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

      {/* Modal de Cadastro */}
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

      <ModernFooter />
    </main>
  )
}

