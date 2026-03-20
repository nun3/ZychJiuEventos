'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiUser, FiEdit, FiUsers, FiClipboard, FiAward, FiCreditCard, FiChevronRight, FiAlertCircle } from 'react-icons/fi'

const menuItems = [
  { href: '/dashboard/meu-perfil', label: 'Meu Perfil', icon: FiUser },
  { href: '/dashboard/alterar-cadastro', label: 'Alterar Meu Cadastro', icon: FiEdit },
  { href: '/dashboard/meus-atletas', label: 'Meus Atletas', icon: FiUsers },
  { href: '/dashboard/inscricoes', label: 'Inscrições Realizadas', icon: FiClipboard },
  { href: '/dashboard/minhas-filiacoes', label: 'Minhas Filiações', icon: FiAward },
  { href: '/dashboard/meus-ingressos', label: 'Meus Ingressos', icon: FiCreditCard, active: true },
]

interface Ticket {
  id: string
  eventName: string
  eventDate: string
  ticketType: string
  quantity: number
  price: number
  totalPrice: number
  purchaseDate: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

const mockTickets: Ticket[] = [
  // Deixar vazio para mostrar o estado de "sem ingressos"
]

export default function MeusIngressosPage() {
  const [tickets] = useState<Ticket[]>(mockTickets)
  const hasTickets = tickets.length > 0

  return (
    <div className="container mx-auto px-6 pt-6 pb-12">
      <section className="rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0C3049] via-blue-800 to-[#0C3049] px-6 py-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2">Meus Ingressos</h1>
            <p className="text-base text-blue-100">Acompanhe seus ingressos comprados</p>
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
            {/* Alerta quando não há ingressos */}
            {!hasTickets && (
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
                      Você ainda NÃO fez nenhuma compra de ingresso no site.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Ingressos (quando houver) */}
            {hasTickets && (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 uppercase mb-2">{ticket.eventName}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>Data do Evento: <span className="font-semibold">{ticket.eventDate}</span></p>
                          <p>Tipo de Ingresso: <span className="font-semibold">{ticket.ticketType}</span></p>
                          <p>Quantidade: <span className="font-semibold">{ticket.quantity}</span></p>
                          <p>Valor Unitário: <span className="font-semibold">R$ {ticket.price.toFixed(2).replace('.', ',')}</span></p>
                          <p>Valor Total: <span className="font-semibold text-primary-blue">R$ {ticket.totalPrice.toFixed(2).replace('.', ',')}</span></p>
                          <p>Comprado em: <span className="font-semibold">{ticket.purchaseDate}</span></p>
                        </div>
                      </div>
                      <div className="ml-4">
                        {ticket.status === 'confirmed' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                            <span className="w-2 h-2 rounded-full bg-green-600"></span>
                            Confirmado
                          </span>
                        )}
                        {ticket.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                            Pendente
                          </span>
                        )}
                        {ticket.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            Cancelado
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

