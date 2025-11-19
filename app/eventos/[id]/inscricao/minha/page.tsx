import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import Link from 'next/link'
import { FiArrowLeft, FiUser } from 'react-icons/fi'

export default function MyRegistrationPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/eventos/${params.id}/inscricao`}
              className="text-gray-600 hover:text-primary-orange flex items-center space-x-2 transition mb-4"
            >
              <FiArrowLeft />
              <span>voltar</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center space-x-3">
              <FiUser className="text-primary-red" />
              <span>FAZER MINHA INSCRIÇÃO</span>
            </h1>
          </div>

          {/* Formulário de Inscrição Própria */}
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8 max-w-3xl mx-auto">
            <p className="text-gray-600 mb-6">
              Preencha os dados abaixo para fazer sua inscrição no evento. Esta é uma página wireframe para apresentação ao cliente.
            </p>

            <div className="space-y-4">
              {/* Dados Pessoais */}
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Dados Pessoais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      placeholder="Digite seu nome completo"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      CPF *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      placeholder="000.000.000-00"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      placeholder="(00) 00000-0000"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Dados da Academia */}
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Dados da Academia</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Academia *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      placeholder="Nome da academia"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Faixa *
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      disabled
                    >
                      <option>Selecione a faixa</option>
                      <option>Branca</option>
                      <option>Azul</option>
                      <option>Roxa</option>
                      <option>Marrom</option>
                      <option>Preta</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Categoria do Evento */}
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Categoria do Evento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Categoria *
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      disabled
                    >
                      <option>Selecione a categoria</option>
                      <option>Infantil - Branca</option>
                      <option>Infantil - Azul</option>
                      <option>Infantil - Roxa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Peso (kg) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                      placeholder="Ex: 70.5"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Confirmação */}
              <div className="pt-4">
                <button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
                  disabled
                >
                  CONFIRMAR INSCRIÇÃO
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <WhatsAppWidget />
    </main>
  )
}

