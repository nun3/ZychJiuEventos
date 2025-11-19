'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiMenu, FiX } from 'react-icons/fi'
import Logo from './Logo'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-[#0C3049] shadow-md">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo maior, estilo similar ao iLutas */}
          <Logo showText={true} size="lg" />

          {/* Menu Desktop */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/" className="text-white/90 hover:text-white font-medium">
              Início
            </Link>
            <Link href="/academias" className="text-white/90 hover:text-white font-medium">
              Academias
            </Link>
            <Link href="/sistema" className="text-white/90 hover:text-white font-medium">
              Sistema
            </Link>
            <Link href="/filiacao" className="text-white/90 hover:text-white font-medium">
              Filiação
            </Link>
            <Link href="/quem-somos" className="text-white/90 hover:text-white font-medium">
              Quem Somos
            </Link>
          </div>

          {/* Botões de Ação */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-white/90 hover:text-white font-medium"
            >
              Acessar Conta
            </Link>
            <Link
              href="/criar-evento"
              className="px-6 py-2 bg-primary-orange text-white font-bold rounded hover:bg-orange-500 transition"
            >
              CRIAR EVENTO
            </Link>
            <Link
              href="/cadastro"
              className="px-6 py-2 bg-primary-red text-white font-bold rounded hover:bg-red-500 transition"
            >
              CADASTRE-SE
            </Link>
          </div>

          {/* Menu Mobile Toggle */}
          <button
            className="lg:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-white/90 hover:text-white font-medium py-2">
                Início
              </Link>
              <Link href="/academias" className="text-white/90 hover:text-white font-medium py-2">
                Academias
              </Link>
              <Link href="/sistema" className="text-white/90 hover:text-white font-medium py-2">
                Sistema
              </Link>
              <Link href="/filiacao" className="text-white/90 hover:text-white font-medium py-2">
                Filiação
              </Link>
              <Link href="/quem-somos" className="text-white/90 hover:text-white font-medium py-2">
                Quem Somos
              </Link>
              <div className="pt-4 border-t border-white/10 space-y-2">
                <Link
                  href="/login"
                  className="block px-4 py-2 text-white/90 hover:text-white font-medium"
                >
                  Acessar Conta
                </Link>
                <Link
                  href="/criar-evento"
                  className="block px-4 py-2 bg-primary-orange text-white font-bold rounded text-center"
                >
                  CRIAR EVENTO
                </Link>
                <Link
                  href="/cadastro"
                  className="block px-4 py-2 bg-primary-red text-white font-bold rounded text-center"
                >
                  CADASTRE-SE
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

