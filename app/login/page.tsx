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

      <section className="container mx-auto px-4 sm:px-6 md:px-8 pt-32 sm:pt-36 md:pt-40 lg:pt-44 pb-16 sm:pb-20 md:pb-24">
        <div className="flex flex-col items-center">
          <div className="flex w-full max-w-4xl md:max-w-5xl lg:max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-gray-200 bg-[#0C3049] px-6 sm:px-8 md:px-10 lg:px-12 py-5 sm:py-6 md:py-7 lg:py-8 text-white">
              <div>
                <p className="text-xs sm:text-sm md:text-base uppercase tracking-[0.28em] text-orange-300">Portal do atleta</p>
                <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                  {mode === 'login' && 'Acessar conta'}
                  {mode === 'register' && 'Criar conta'}
                  {mode === 'recover' && 'Recuperar senha'}
                </h1>
              </div>
              <div className="text-right text-xs sm:text-sm md:text-base text-orange-100">
                {mode !== 'login' ? (
                  <>
                    Já tem cadastro?
                    <br />
                    <button
                      onClick={() => setMode('login')}
                      className="mt-1 sm:mt-2 inline-flex items-center rounded-full bg-primary-blue px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 md:py-2.5 text-sm sm:text-base md:text-lg font-semibold text-white shadow hover:bg-blue-700 transition"
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
                      className="mt-1 sm:mt-2 inline-flex items-center rounded-full bg-primary-blue px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 md:py-2.5 text-sm sm:text-base md:text-lg font-semibold text-white shadow hover:bg-blue-700 transition"
                    >
                      + Novo cadastro
                    </button>
                  </>
                )}
              </div>
            </header>

            <div className="px-6 sm:px-8 md:px-10 lg:px-12 py-8 sm:py-10 md:py-12 lg:py-14">
              {/* Tabs principais: Entrar / Criar conta / Recuperar senha */}
              <div className="mb-6 sm:mb-8 md:mb-10 inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 sm:p-1.5 text-xs sm:text-sm md:text-base font-semibold text-gray-500">
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
                  <div className="mb-4 sm:mb-6 md:mb-8 inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 sm:p-1.5 text-xs sm:text-sm md:text-base font-semibold text-gray-500">
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

                  <div className="space-y-2 sm:space-y-3">
                    <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600">
                      {currentTab.placeholder}
                    </label>
                    <input
                      type={activeTab === 'cpf' ? 'text' : 'email'}
                      placeholder={currentTab.mask}
                      className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                    />
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600">Senha</label>
                    <input
                      type="password"
                      placeholder="Digite sua senha"
                      className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm sm:text-base md:text-lg">
                    <label className="flex items-center gap-2 sm:gap-3 text-gray-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 rounded border-gray-300 text-primary-blue focus:ring-primary-blue/60"
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
                    className="w-full rounded-lg bg-primary-blue py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg lg:text-xl font-semibold uppercase tracking-wide text-white shadow-md hover:bg-blue-700 transition"
                  >
                    Acessar
                  </button>

                  <div className="relative py-3 sm:py-4 md:py-5 text-center text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.4em] text-gray-400">
                    <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-gray-200" aria-hidden />
                    <span className="bg-white px-2 sm:px-3 md:px-4">ou</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="w-full rounded-lg bg-primary-blue py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg lg:text-xl font-semibold uppercase tracking-wide text-white shadow-md hover:bg-blue-700 transition text-center inline-block"
                  >
                    + Novo cadastro
                  </button>
                </form>
              )}

              {mode === 'register' && (
                <div className="space-y-6 sm:space-y-8 md:space-y-10">
                  {!selectedRegisterType ? (
                    <>
                      <div className="text-center mb-6 sm:mb-8">
                        <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-2">
                          Selecione o tipo de cadastro que deseja realizar:
                        </p>
                      </div>

                      {/* Cards de seleção de tipo de cadastro */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        {/* Card: Atleta */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRegisterType('atleta')
                            setIsNewAthleteModalOpen(true)
                          }}
                          className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-blue hover:shadow-lg transition-all group"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-primary-blue/10 flex items-center justify-center mb-4 group-hover:bg-primary-blue/20 transition">
                            <User size={32} className="sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary-blue" />
                          </div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">Atleta</h3>
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">
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
                          className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-blue hover:shadow-lg transition-all group"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-primary-blue/10 flex items-center justify-center mb-4 group-hover:bg-primary-blue/20 transition">
                            <Briefcase size={32} className="sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary-blue" />
                          </div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">Organizador</h3>
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">
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
                          className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 rounded-xl border-2 border-gray-200 bg-white hover:border-primary-blue hover:shadow-lg transition-all group"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-primary-blue/10 flex items-center justify-center mb-4 group-hover:bg-primary-blue/20 transition">
                            <Users size={32} className="sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary-blue" />
                          </div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">Responsável</h3>
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 text-center">
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
                        className="text-sm sm:text-base text-primary-blue hover:text-blue-700 mb-4 inline-flex items-center gap-2"
                      >
                        ← Voltar para seleção de tipo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {mode === 'recover' && (
                <div className="space-y-4 sm:space-y-6 md:space-y-8 text-sm sm:text-base md:text-lg text-gray-700">
                  <p className="leading-relaxed">
                    Escolha a opção desejada para recuperar sua senha. Hoje o fluxo continua em uma tela dedicada, mas
                    será integrado aqui futuramente.
                  </p>
                  <div className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2">
                    <Link
                      href="/recuperar-senha"
                      className="flex flex-col gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 hover:border-primary-blue transition"
                    >
                      <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">Recuperar por WhatsApp</span>
                      <span className="text-xs sm:text-sm md:text-base text-gray-600">
                        Receba uma mensagem no número cadastrado para redefinir sua senha.
                      </span>
                    </Link>
                    <Link
                      href="/recuperar-senha"
                      className="flex flex-col gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 hover:border-primary-blue transition"
                    >
                      <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">Recuperar por e-mail</span>
                      <span className="text-xs sm:text-sm md:text-base text-gray-600">
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

