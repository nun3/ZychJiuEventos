'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiChevronDown, FiChevronUp, FiLogOut, FiUser, FiClipboard, FiUsers, FiAward, FiCreditCard } from 'react-icons/fi'
import Logo from './Logo'

const accountLinks = [
  { href: '/dashboard/meu-perfil', label: 'Meu Perfil', icon: FiUser },
  { href: '/dashboard/alterar-cadastro', label: 'Alterar Meu Cadastro', icon: FiClipboard },
  { href: '/dashboard/inscricoes', label: 'Inscrições Realizadas', icon: FiClipboard },
  { href: '/dashboard/meus-atletas', label: 'Meus Atletas', icon: FiUsers },
  { href: '/dashboard/minhas-filiacoes', label: 'Filiações Registradas', icon: FiAward },
  { href: '/dashboard/meus-ingressos', label: 'Meus Ingressos', icon: FiCreditCard },
]

export default function DashboardHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-white shadow-md">
      <nav className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Logo showText size="md" />
          <div className="hidden md:flex items-center space-x-6 text-sm font-semibold text-gray-700">
            <Link href="/" className="hover:text-primary-blue lowercase first-letter:uppercase">
              Início
            </Link>
            <Link href="/academias" className="hover:text-primary-blue lowercase first-letter:uppercase">
              Divulgue sua academia
            </Link>
            <Link href="/sistema" className="hover:text-primary-blue lowercase first-letter:uppercase">
              Sistema para academia
            </Link>
            <Link href="/sistema" className="hover:text-primary-blue lowercase first-letter:uppercase">
              Filiação e serviços
            </Link>
            <Link href="/quem-somos" className="hover:text-primary-blue lowercase first-letter:uppercase">
              Quem somos
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/eventos/criar"
            className="hidden md:inline-flex items-center rounded-lg bg-primary-blue px-4 py-2 text-sm font-bold uppercase tracking-wide text-white shadow hover:bg-blue-600 transition"
          >
            Criar evento
          </Link>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg border border-primary-blue px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary-blue hover:bg-primary-blue hover:text-white transition"
            >
              Olá Ricardo!
              {menuOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
                <div className="border-b border-gray-700 bg-gray-900 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                  Minha conta
                </div>
                <ul className="py-2 text-sm">
                  {accountLinks.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition"
                        onClick={() => setMenuOpen(false)}
                      >
                        <item.icon size={18} className="text-white" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li className="border-t border-gray-700 mt-2">
                    <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-800 transition">
                      <FiLogOut size={18} className="text-white" />
                      Sair
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

