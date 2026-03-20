'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiLock, FiUser, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi'

export default function AdminAuthPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrarMe, setLembrarMe] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    // Simulação de autenticação - em produção, isso seria uma chamada à API
    // Para desenvolvimento, aceita qualquer usuário/senha (desde que não estejam vazios)
    // ou use as credenciais padrão: admin / admin123
    setTimeout(() => {
      // Salvar token de autenticação (em produção, usar JWT ou session)
      if (usuario && senha) {
        localStorage.setItem('admin_authenticated', 'true')
        localStorage.setItem('admin_usuario', usuario)
        router.push('/admin/eventos')
      } else {
        setErro('Por favor, preencha usuário e senha')
        setCarregando(false)
      }
    }, 500)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0C3049] via-[#1a4a6b] to-[#0C3049] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card de Autenticação */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header do Card */}
          <div className="bg-gradient-to-r from-[#0C3049] to-[#1a4a6b] px-8 py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FiLock className="text-white" size={32} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-2">
              Área Restrita
            </h1>
            <p className="text-blue-200 text-sm md:text-base">
              Acesso exclusivo para organizadores
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {/* Campo Usuário */}
            <div className="space-y-2">
              <label htmlFor="usuario" className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Usuário ou E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" size={20} />
                </div>
                <input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 outline-none transition-colors bg-white"
                  placeholder="Digite seu usuário ou e-mail"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <label htmlFor="senha" className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 text-base border-2 border-gray-200 rounded-lg focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 outline-none transition-colors bg-white"
                  placeholder="Digite sua senha"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {mostrarSenha ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Lembrar-me e Esqueci senha */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lembrarMe}
                  onChange={(e) => setLembrarMe(e.target.checked)}
                  className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
                />
                <span className="text-sm text-gray-600">Lembrar de mim</span>
              </label>
              <a href="#" className="text-sm text-primary-blue hover:underline font-medium">
                Esqueci minha senha
              </a>
            </div>

            {/* Mensagem de Erro */}
            {erro && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg px-4 py-3">
                <p className="text-red-700 text-sm font-medium">{erro}</p>
              </div>
            )}

            {/* Mensagem de Ajuda (Desenvolvimento) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-blue-700 text-xs font-medium">
                <strong>Desenvolvimento:</strong> Use qualquer usuário e senha para fazer login.
              </p>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-gradient-to-r from-primary-blue to-blue-700 text-white font-bold py-3 px-6 rounded-lg text-base uppercase tracking-wide hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {carregando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <FiLogIn size={18} />
                  <span>Entrar</span>
                </>
              )}
            </button>

            {/* Link para criar conta */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <a href="/cadastro" className="text-primary-blue font-semibold hover:underline">
                  Criar nova conta
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm">
            © {new Date().getFullYear()} Todos os direitos reservados
          </p>
        </div>
      </div>
    </main>
  )
}

