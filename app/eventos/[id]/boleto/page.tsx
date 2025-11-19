import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import Link from 'next/link'
import { FiArrowLeft, FiFile, FiDownload } from 'react-icons/fi'

export default function BoletoPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/eventos/${params.id}`}
              className="text-gray-600 hover:text-primary-orange flex items-center space-x-2 transition mb-4"
            >
              <FiArrowLeft />
              <span>voltar para o evento</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center space-x-3">
              <FiFile className="text-primary-red" />
              <span>EMITIR BOLETO</span>
            </h1>
          </div>

          {/* Área de Emissão de Boleto */}
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <p className="text-gray-600 mb-6">
              Sistema de emissão de boleto será implementado em breve. Esta é uma página wireframe para apresentação ao cliente.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <FiFile className="mx-auto text-6xl text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    Para emitir o boleto, você precisa estar inscrito no evento.
                  </p>
                  <Link
                    href={`/eventos/${params.id}/inscricao`}
                    className="inline-block bg-primary-orange hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition"
                  >
                    Fazer Inscrição
                  </Link>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Informações do Boleto
                </h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Valor:</strong> R$ 80,00</p>
                  <p><strong>Vencimento:</strong> 08/11/2025</p>
                  <p><strong>Status:</strong> <span className="text-yellow-600">Aguardando pagamento</span></p>
                </div>

                <button
                  className="mt-4 bg-primary-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center space-x-2"
                  disabled
                >
                  <FiDownload />
                  <span>BAIXAR BOLETO</span>
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

