'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'

const tabs = [
  { id: 'cpf', label: 'Por CPF', placeholder: 'CPF do cadastro', mask: '123.456.789-00' },
  { id: 'email', label: 'Por e-mail', placeholder: 'E-mail cadastrado', mask: 'nome@exemplo.com' },
]

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'cpf' | 'email'>('cpf')

  const currentTab = tabs.find((tab) => tab.id === activeTab)!

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <section className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col items-center">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-gray-200 bg-[#0C3049] px-6 py-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Portal do atleta</p>
                <h1 className="mt-1 text-2xl font-bold">Acessar conta</h1>
              </div>
              <div className="text-right text-xs text-orange-100">
                Ainda não tem acesso?
                <br />
                <Link
                  href="/cadastro"
                  className="mt-1 inline-flex items-center rounded-full bg-primary-orange px-4 py-1 text-sm font-semibold text-white shadow hover:bg-orange-600"
                >
                  + Novo cadastro
                </Link>
              </div>
            </header>

            <div className="px-6 py-8">
              <div className="mb-6 inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-semibold text-gray-500">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'cpf' | 'email')}
                    className={`rounded-full px-4 py-2 transition ${
                      tab.id === activeTab ? 'bg-white text-primary-orange shadow' : 'hover:text-primary-red'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {currentTab.placeholder}
                  </label>
                  <input
                    type={activeTab === 'cpf' ? 'text' : 'email'}
                    placeholder={currentTab.mask}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 shadow-sm focus:border-primary-orange focus:outline-none focus:ring-2 focus:ring-primary-orange/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">Senha</label>
                  <input
                    type="password"
                    placeholder="Digite sua senha"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 shadow-sm focus:border-primary-orange focus:outline-none focus:ring-2 focus:ring-primary-orange/40"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-orange focus:ring-primary-orange/60"
                    />
                    Manter conectado
                  </label>
                  <Link href="/recuperar-senha" className="font-semibold text-primary-red hover:text-primary-orange">
                    Esqueci a senha
                  </Link>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary-red py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md hover:bg-red-700 transition"
                >
                  Acessar
                </button>

                <div className="relative py-2 text-center text-xs font-semibold uppercase tracking-[0.4em] text-gray-400">
                  <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-gray-200" aria-hidden />
                  <span className="bg-white px-2">ou</span>
                </div>

                <Link
                  href="/cadastro"
                  className="w-full rounded-lg bg-primary-orange py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md hover:bg-orange-600 transition text-center inline-block"
                >
                  + Novo cadastro
                </Link>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppWidget />
    </main>
  )
}

