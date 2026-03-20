'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiUser, FiEdit, FiUsers, FiClipboard, FiAward, FiCreditCard, FiChevronRight, FiAlertCircle, FiPlus } from 'react-icons/fi'

const menuItems = [
  { href: '/dashboard/meu-perfil', label: 'Meu Perfil', icon: FiUser },
  { href: '/dashboard/alterar-cadastro', label: 'Alterar Meu Cadastro', icon: FiEdit },
  { href: '/dashboard/meus-atletas', label: 'Meus Atletas', icon: FiUsers },
  { href: '/dashboard/inscricoes', label: 'Inscrições Realizadas', icon: FiClipboard },
  { href: '/dashboard/minhas-filiacoes', label: 'Minhas Filiações', icon: FiAward, active: true },
  { href: '/dashboard/meus-ingressos', label: 'Meus Ingressos', icon: FiCreditCard },
]

interface Affiliation {
  id: string
  federation: string
  registrationNumber: string
  status: 'active' | 'pending' | 'expired'
  registrationDate: string
  expirationDate?: string
}

const mockAffiliations: Affiliation[] = [
  // Deixar vazio para mostrar o estado de "sem filiações"
]

export default function MinhasFiliacoesPage() {
  const [affiliations] = useState<Affiliation[]>(mockAffiliations)
  const hasAffiliations = affiliations.length > 0

  return (
    <div className="container mx-auto px-6 pt-6 pb-12">
      <section className="rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0C3049] via-blue-800 to-[#0C3049] px-6 py-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2">Minhas Filiações</h1>
            <p className="text-base text-blue-100">Gerencie suas filiações em federações</p>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-8 lg:grid-cols-[220px,1fr]">
          {/* Menu Lateral */}
          <aside className="space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                    item.active
                      ? 'border-primary-blue bg-primary-blue text-white shadow'
                      : 'border-gray-200 text-gray-600 hover:border-primary-blue hover:text-primary-blue'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              )
            })}
            <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition w-full">
              Sair da conta
              <FiChevronRight size={14} />
            </button>
          </aside>

          <div className="space-y-6">
            {/* Alerta quando não há filiações */}
            {!hasAffiliations && (
              <div className="rounded-xl border-2 border-pink-200 bg-pink-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <FiAlertCircle className="text-red-600" size={24} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-800 mb-2 uppercase">Atenção</h3>
                    <p className="text-base text-gray-700">
                      Você ainda NÃO se registrou em nenhuma Federação. Clique{' '}
                      <Link href="#" className="text-primary-blue font-semibold hover:underline">
                        AQUI
                      </Link>{' '}
                      para iniciar a sua Filiação.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botão Nova Filiação */}
            <div className="flex justify-start">
              <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-base font-semibold uppercase tracking-wide text-white shadow-md hover:bg-red-700 transition">
                <FiPlus size={20} />
                Nova Filiação em Outra Federação
              </button>
            </div>

            {/* Lista de Filiações (quando houver) */}
            {hasAffiliations && (
              <div className="space-y-4">
                {affiliations.map((affiliation) => (
                  <div key={affiliation.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 uppercase mb-2">{affiliation.federation}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>Número de Registro: <span className="font-semibold">{affiliation.registrationNumber}</span></p>
                          <p>Data de Registro: <span className="font-semibold">{affiliation.registrationDate}</span></p>
                          {affiliation.expirationDate && (
                            <p>Validade até: <span className="font-semibold">{affiliation.expirationDate}</span></p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {affiliation.status === 'active' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                            <span className="w-2 h-2 rounded-full bg-green-600"></span>
                            Ativa
                          </span>
                        )}
                        {affiliation.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                            Pendente
                          </span>
                        )}
                        {affiliation.status === 'expired' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            Expirada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

