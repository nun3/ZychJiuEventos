'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { FiInfo } from 'react-icons/fi'

const recoveryTabs = [
  {
    id: 'whatsapp',
    label: 'Por WhatsApp',
    description: 'Você receberá uma mensagem pelo WhatsApp para alterar a sua senha.',
    placeholder: 'Nº do celular do cadastro',
    mask: '(00) 00000-0000',
  },
  {
    id: 'email',
    label: 'Por e-mail',
    description: 'Enviaremos um e-mail com o link para redefinição de senha.',
    placeholder: 'E-mail cadastrado',
    mask: 'nome@exemplo.com',
  },
]

export default function PasswordRecoveryPage() {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp')
  const current = recoveryTabs.find((tab) => tab.id === activeTab)!

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <section className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col items-center">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-gray-200 bg-[#0C3049] px-6 py-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Portal do atleta</p>
                <h1 className="mt-1 text-2xl font-bold">Recuperar senha</h1>
              </div>
              <div className="text-right text-xs text-orange-100">
                Lembrou da senha?
                <br />
                <Link
                  href="/login"
                  className="mt-1 inline-flex items-center rounded-full bg-primary-orange px-4 py-1 text-sm font-semibold text-white shadow hover:bg-orange-600"
                >
                  Voltar para login
                </Link>
              </div>
            </header>

            <div className="px-6 py-8">
              <div className="mb-6 inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-semibold text-gray-500">
                {recoveryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'whatsapp' | 'email')}
                    className={`rounded-full px-4 py-2 transition ${
                      tab.id === activeTab ? 'bg-white text-primary-orange shadow' : 'hover:text-primary-red'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mb-5 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                <FiInfo className="mt-1 flex-shrink-0" size={16} />
                <p>{current.description}</p>
              </div>

              <form className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {current.placeholder}
                  </label>
                  <input
                    type={activeTab === 'whatsapp' ? 'tel' : 'email'}
                    placeholder={current.mask}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 shadow-sm focus:border-primary-orange focus:outline-none focus:ring-2 focus:ring-primary-orange/40"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary-red py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md hover:bg-red-700 transition"
                >
                  Solicitar
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm font-semibold text-primary-red hover:text-primary-orange">
                  &larr; Voltar para login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppWidget />
    </main>
  )
}

