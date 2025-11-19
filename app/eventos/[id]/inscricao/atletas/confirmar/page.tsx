'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import AthleteSelectionModal from '@/components/AthleteSelectionModal'
import Link from 'next/link'
import { FiArrowLeft, FiUsers, FiPlus, FiUser } from 'react-icons/fi'

interface SelectedAthlete {
  id: number
  name: string
  age: number
  gender: 'M' | 'F'
  academy: string
  belt: string
  weight: string
  willRegister: boolean
  category: string
  beltCategory: string
  weightCategory: string
  registrationType: string
  price: number
}

// Dados mockados de atletas selecionados
const initialSelectedAthletes: SelectedAthlete[] = [
  {
    id: 1,
    name: 'JOAQUIM LUIZ CAMPOS',
    age: 13,
    gender: 'M',
    academy: 'ZYCH JIU JITSU',
    belt: 'BRANCA',
    weight: '35.00',
    willRegister: true,
    category: 'Infanto-Juvenil A (12 a 13 anos)',
    beltCategory: 'Branca',
    weightCategory: 'Pluma (Até 38.500 kg)',
    registrationType: 'Apenas Categoria de Peso',
    price: 50.00,
  },
]

export default function ConfirmAthletesPage({ params }: { params: { id: string } }) {
  const [selectedAthletes, setSelectedAthletes] = useState<SelectedAthlete[]>(initialSelectedAthletes)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'unified' | 'individual'>('individual')

  const handleToggleRegister = (athleteId: number) => {
    setSelectedAthletes((prev) =>
      prev.map((athlete) =>
        athlete.id === athleteId
          ? { ...athlete, willRegister: !athlete.willRegister }
          : athlete
      )
    )
  }

  const handleCategoryChange = (athleteId: number, field: string, value: string) => {
    setSelectedAthletes((prev) =>
      prev.map((athlete) =>
        athlete.id === athleteId ? { ...athlete, [field]: value } : athlete
      )
    )
  }

  const handleConfirmSelection = (selectedIds: number[]) => {
    // Aqui você adicionaria novos atletas à lista
    console.log('Novos atletas selecionados:', selectedIds)
  }

  const registeredCount = selectedAthletes.filter((a) => a.willRegister).length
  const totalValue = selectedAthletes
    .filter((a) => a.willRegister)
    .reduce((sum, a) => sum + a.price, 0)

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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Atletas para Inscrever
            </h1>
          </div>

          {/* Botão Selecionar Atletas */}
          <div className="mb-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-primary-red hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition"
            >
              SELECIONAR MEUS ATLETAS
            </button>
          </div>

          {/* Avisos */}
          <div className="mb-6 space-y-4">
            <div className="border-2 border-primary-red p-4 rounded-lg bg-red-50">
              <p className="text-gray-700">
                <strong className="text-primary-red">ATENÇÃO:</strong> Poderá ser feito apenas{' '}
                <span className="underline font-bold">20</span> inscrições por vez, havendo muitos atletas repita esse procedimento novamente.
              </p>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong className="text-gray-800">ATENÇÃO:</strong> Para o campeonato, a idade é calculada com base no ano de nascimento.{' '}
                <strong>Exemplo:</strong> O atleta nasceu em 2015, então em 2025 ele tem 10 anos.
              </p>
            </div>
          </div>

          {/* Lista de Atletas Selecionados */}
          <div className="space-y-6 mb-6">
            {selectedAthletes.map((athlete) => (
              <div
                key={athlete.id}
                className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Informações do Atleta - Lado Esquerdo */}
                  <div>
                    <div className="flex items-start space-x-4 mb-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <FiUser className="text-gray-500 text-2xl" />
                      </div>

                      {/* Dados do Atleta */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          {athlete.name}, {athlete.age} anos
                          <span className={`ml-2 text-sm ${athlete.gender === 'M' ? 'text-blue-600' : 'text-red-600'}`}>
                            {athlete.gender === 'M' ? '♂' : '♀'}
                          </span>
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>{athlete.category}</p>
                          <p>{athlete.belt}</p>
                          <p>{athlete.weightCategory}</p>
                          <p>{athlete.academy}</p>
                          <p>RICARDO ZYCH</p>
                        </div>
                      </div>
                    </div>

                    {/* Opção de Inscrição */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="font-bold text-gray-800 mb-3">INSCREVER ESSE ATLETA?</p>
                      <div className="flex space-x-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`register-${athlete.id}`}
                            checked={!athlete.willRegister}
                            onChange={() => handleToggleRegister(athlete.id)}
                            className="w-4 h-4 text-primary-red focus:ring-primary-red"
                          />
                          <span className="text-gray-700 font-medium">NÃO</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`register-${athlete.id}`}
                            checked={athlete.willRegister}
                            onChange={() => handleToggleRegister(athlete.id)}
                            className="w-4 h-4 text-primary-red focus:ring-primary-red"
                          />
                          <span className="text-gray-700 font-medium">SIM</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Seleção de Categorias - Lado Direito */}
                  {athlete.willRegister && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Categoria
                        </label>
                        <select
                          value={athlete.category}
                          onChange={(e) => handleCategoryChange(athlete.id, 'category', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                        >
                          <option>Infanto-Juvenil A (12 a 13 anos)</option>
                          <option>Infanto-Juvenil B (14 a 15 anos)</option>
                          <option>Juvenil (16 a 17 anos)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Faixa
                        </label>
                        <select
                          value={athlete.beltCategory}
                          onChange={(e) => handleCategoryChange(athlete.id, 'beltCategory', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                        >
                          <option>Branca</option>
                          <option>Cinza</option>
                          <option>Amarela</option>
                          <option>Laranja</option>
                          <option>Verde</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Categoria de Peso
                        </label>
                        <select
                          value={athlete.weightCategory}
                          onChange={(e) => handleCategoryChange(athlete.id, 'weightCategory', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                        >
                          <option>Pluma (Até 38.500 kg)</option>
                          <option>Pena (Até 42.500 kg)</option>
                          <option>Leve (Até 46.500 kg)</option>
                          <option>Médio (Até 50.500 kg)</option>
                          <option>Meio Pesado (Até 54.500 kg)</option>
                          <option>Pesado (Acima de 54.500 kg)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Tipo de Inscrição
                        </label>
                        <select
                          value={athlete.registrationType}
                          onChange={(e) => {
                            const type = e.target.value
                            const price = type.includes('Absoluto') ? 80.00 : 50.00
                            handleCategoryChange(athlete.id, 'registrationType', type)
                            handleCategoryChange(athlete.id, 'price', price.toString())
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                        >
                          <option>Apenas Categoria de Peso: R$ 50,00</option>
                          <option>Categoria de Peso + Absoluto: R$ 80,00</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Resumo e Ações */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
              <div>
                <p className="text-gray-700 mb-1">
                  <strong>N° de atleta(s) inscrito(s):</strong> {registeredCount}
                </p>
                <p className="text-xl font-bold text-gray-800">
                  Valor Total das Inscrições: R$ {totalValue.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <Link
                href={`/eventos/${params.id}/inscricao/cadastrar-atleta`}
                className="bg-primary-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition flex items-center space-x-2"
              >
                <FiPlus />
                <span>Cadastrar Novo Atleta</span>
              </Link>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-primary-orange mb-4">
              Forma de Pagamento: Boleto Bancário ou Pix
            </h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="payment-method"
                  value="unified"
                  checked={paymentMethod === 'unified'}
                  onChange={() => setPaymentMethod('unified')}
                  className="w-4 h-4 text-primary-red focus:ring-primary-red"
                />
                <span className="text-gray-700">
                  Pagamento Unificado: Todas as inscrições juntas
                </span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition">
                <input
                  type="radio"
                  name="payment-method"
                  value="individual"
                  checked={paymentMethod === 'individual'}
                  onChange={() => setPaymentMethod('individual')}
                  className="w-4 h-4 text-primary-red focus:ring-primary-red"
                />
                <span className="text-gray-700">
                  Pagamento Individual: Cada inscrição terá o seu pagamento
                </span>
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between space-x-4">
            <Link
              href={`/eventos/${params.id}/inscricao/atletas`}
              className="bg-primary-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              voltar
            </Link>
            <button
              className="bg-primary-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition"
              disabled={registeredCount === 0}
            >
              finalizar inscrição
            </button>
          </div>
        </div>
      </div>
      <Footer />
      <WhatsAppWidget />

      {/* Modal de Seleção */}
      <AthleteSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        athletes={[]}
        eventId={params.id}
        onConfirmSelection={handleConfirmSelection}
      />
    </main>
  )
}

