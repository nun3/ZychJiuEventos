import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import Link from 'next/link'
import { FiArrowLeft, FiUserPlus } from 'react-icons/fi'

export default function NewAthletePage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ModernNavbar />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-10">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/eventos/${params.id}`}
              className="text-gray-600 hover:text-amber-600 flex items-center space-x-2 transition mb-6"
            >
              <FiArrowLeft />
              <span>voltar</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
              CADASTRAR NOVO ATLETA
            </h1>
            <p className="text-center text-lg text-gray-600 mb-12">
              Preencha os dados do novo atleta. Após o cadastro, você poderá inscrevê-lo no evento.
            </p>
          </div>

          {/* Formulário de Cadastro */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-lg p-8 lg:p-12 max-w-4xl mx-auto">

            <div className="space-y-8">
              {/* Dados Pessoais */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Dados Pessoais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition text-gray-900"
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      CPF *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition text-gray-900"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Telefone/WhatsApp *
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition text-gray-900"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Dados da Academia */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Dados da Academia</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Academia *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition text-gray-900"
                      placeholder="Nome da academia"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Faixa *
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition text-gray-900"
                    >
                      <option>Selecione a faixa</option>
                      <option>Branca</option>
                      <option>Cinza</option>
                      <option>Amarela</option>
                      <option>Laranja</option>
                      <option>Verde</option>
                      <option>Azul</option>
                      <option>Roxa</option>
                      <option>Marrom</option>
                      <option>Preta</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dados Físicos */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Dados Físicos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Peso (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition text-gray-900"
                      placeholder="Ex: 35.5"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition text-gray-900"
                      placeholder="Ex: 150"
                    />
                  </div>
                </div>
              </div>

              {/* Responsável (para menores) */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Responsável (se menor de idade)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Nome do Responsável
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition text-gray-900"
                      placeholder="Nome completo do responsável"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Telefone do Responsável
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition text-gray-900"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-between pt-8 border-t border-gray-200">
                <Link
                  href={`/eventos/${params.id}`}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-8 rounded-xl transition flex items-center gap-3"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  <span>Cancelar</span>
                </Link>
                <button
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-lg py-3 px-12 rounded-xl transition"
                >
                  CADASTRAR E INSCREVER
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ModernFooter />
    </main>
  )
}

