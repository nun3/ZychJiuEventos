'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AthleteSelectionModal from '@/components/AthleteSelectionModal'
import NewAthleteModal from '@/components/Modals/NewAthleteModal'
import { FiUser, FiUsers, FiCheck, FiChevronRight, FiChevronLeft, FiSearch, FiUserPlus } from 'react-icons/fi'

// Dados mockados do evento
const mockEvent = {
  title: '2º FESTIVAL KIDS DE JIU-JITSU',
}

// Dados mockados de atletas cadastrados
const mockAthletes = [
  {
    id: 1,
    name: 'Ana Clara Souza',
    age: 9,
    gender: 'F' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '26.00',
  },
  {
    id: 2,
    name: 'Bruno Oliveira',
    age: 10,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '35.00',
    isRegistered: true,
  },
  {
    id: 3,
    name: 'Daniel Pereira',
    age: 8,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '23.00',
  },
  {
    id: 4,
    name: 'Julia Martins',
    age: 9,
    gender: 'F' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '30.00',
  },
  {
    id: 5,
    name: 'Enzo Gabriel',
    age: 10,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Cinza',
    weight: '32.50',
  },
  {
    id: 6,
    name: 'Maria Eduarda',
    age: 8,
    gender: 'F' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '24.00',
  },
  {
    id: 7,
    name: 'Pedro Henrique',
    age: 11,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Amarela',
    weight: '38.00',
  },
  {
    id: 8,
    name: 'Valentina',
    age: 9,
    gender: 'F' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Cinza',
    weight: '28.50',
  },
  {
    id: 9,
    name: 'Miguel Santos',
    age: 10,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Amarela',
    weight: '36.00',
  },
]

interface SelectedAthlete {
  id: number
  name: string
  age: number
  gender: 'M' | 'F'
  academy: string
  belt: string
  weight: string
  willRegister: boolean
  category?: string
  beltCategory?: string
  weightCategory?: string
  registrationType?: string
  price?: number
}

type Step = 1 | 2 | 3 | 4

interface RegistrationWizardProps {
  eventId: string
}

export default function RegistrationWizard({ eventId }: RegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [selectedAthletes, setSelectedAthletes] = useState<SelectedAthlete[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewAthleteModalOpen, setIsNewAthleteModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'unified' | 'individual'>('unified')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const athletesPerPage = 4

  const handleToggleProfessor = () => {
    const professorId = 0
    const isSelected = selectedAthletes.some((a) => a.id === professorId)
    
    if (isSelected) {
      setSelectedAthletes((prev) => prev.filter((a) => a.id !== professorId))
    } else {
      const professor: SelectedAthlete = {
        id: professorId,
        name: 'Professor José Silva',
        age: 35,
        gender: 'M',
        academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
        belt: 'Preta',
        weight: '75.00',
        willRegister: true,
        category: 'Adulto',
        beltCategory: 'Preta',
        weightCategory: 'Médio',
        registrationType: 'Apenas Categoria de Peso',
        price: 70.0,
      }
      setSelectedAthletes((prev) => [...prev, professor])
    }
  }

  const handleSelectAll = () => {
    // Selecionar professor se não estiver selecionado
    const professorId = 0
    const isProfessorSelected = selectedAthletes.some((a) => a.id === professorId)
    if (!isProfessorSelected) {
      const professor: SelectedAthlete = {
        id: professorId,
        name: 'Professor José Silva',
        age: 35,
        gender: 'M',
        academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
        belt: 'Preta',
        weight: '75.00',
        willRegister: true,
        category: 'Adulto',
        beltCategory: 'Preta',
        weightCategory: 'Médio',
        registrationType: 'Apenas Categoria de Peso',
        price: 70.0,
      }
      setSelectedAthletes((prev) => [...prev, professor])
    }

    // Calcular atletas da página atual
    const filtered = mockAthletes.filter((athlete) =>
      athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.belt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.weight.includes(searchTerm)
    )
    const startIdx = (currentPage - 1) * athletesPerPage
    const endIdx = startIdx + athletesPerPage
    const currentPageAthletes = filtered.slice(startIdx, endIdx)

    // Selecionar todos os atletas da página atual que não estão registrados
    const pageAthletes = currentPageAthletes.filter((athlete) => !athlete.isRegistered)
    const allPageSelected = pageAthletes.every((athlete) =>
      selectedAthletes.some((a) => a.id === athlete.id)
    )

    if (allPageSelected) {
      const pageIds = pageAthletes.map((a) => a.id)
      setSelectedAthletes((prev) => prev.filter((a) => !pageIds.includes(a.id)))
    } else {
      const newAthletes: SelectedAthlete[] = pageAthletes
        .filter((athlete) => !selectedAthletes.some((a) => a.id === athlete.id))
        .map((athlete) => ({
          id: athlete.id,
          name: athlete.name,
          age: athlete.age,
          gender: athlete.gender,
          academy: athlete.academy,
          belt: athlete.belt,
          weight: athlete.weight,
          willRegister: true,
          category: 'Infanto-Juvenil A (12 a 13 anos)',
          beltCategory: athlete.belt,
          weightCategory: 'Pluma (Até 38.500 kg)',
          registrationType: 'Apenas Categoria de Peso',
          price: 70.0,
        }))
      setSelectedAthletes((prev) => [...prev, ...newAthletes])
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getBeltColor = (belt: string) => {
    const colors: Record<string, string> = {
      Branca: 'bg-gray-300 text-black',
      Cinza: 'bg-gray-500 text-white',
      Amarela: 'bg-yellow-400 text-black',
      Laranja: 'bg-orange-500 text-white',
      Verde: 'bg-green-500 text-white',
      Azul: 'bg-blue-500 text-white',
      Roxa: 'bg-purple-500 text-white',
      Marrom: 'bg-amber-700 text-white',
      Preta: 'bg-black text-white',
    }
    return colors[belt] || 'bg-gray-400 text-white'
  }

  const handleConfirmSelection = (selectedIds: number[]) => {
    const newAthletes: SelectedAthlete[] = selectedIds
      .map((id) => {
        const athlete = mockAthletes.find((a) => a.id === id)
        if (!athlete) return null
        return {
          id: athlete.id,
          name: athlete.name,
          age: athlete.age,
          gender: athlete.gender,
          academy: athlete.academy,
          belt: athlete.belt,
          weight: athlete.weight,
          willRegister: true,
          category: 'Infanto-Juvenil A (12 a 13 anos)',
          beltCategory: athlete.belt,
          weightCategory: 'Pluma (Até 38.500 kg)',
          registrationType: 'Apenas Categoria de Peso',
          price: 70.0,
        }
      })
      .filter((a): a is SelectedAthlete => a !== null)

    setSelectedAthletes((prev) => {
      const existingIds = prev.map((a) => a.id)
      const newOnes = newAthletes.filter((a) => !existingIds.includes(a.id))
      return [...prev, ...newOnes]
    })
    setIsModalOpen(false)
  }

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
      prev.map((athlete) => {
        if (athlete.id === athleteId) {
          const updated = { ...athlete, [field]: value }
          if (field === 'registrationType') {
            updated.price = value.includes('Absoluto') ? 95.0 : 70.0
          }
          return updated
        }
        return athlete
      })
    )
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
    }
  }

  const registeredCount = selectedAthletes.filter((a) => a.willRegister).length
  const totalValue = selectedAthletes
    .filter((a) => a.willRegister)
    .reduce((sum, a) => sum + (a.price || 0), 0)

  const canProceedToStep2 = selectedAthletes.length > 0
  const canProceedToStep3 = registeredCount > 0
  const canProceedToStep4 = registeredCount > 0

  // Resetar página quando a busca mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const filteredAthletes = mockAthletes.filter((athlete) =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.belt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.weight.includes(searchTerm)
  )

  // Paginação
  const totalPages = Math.ceil(filteredAthletes.length / athletesPerPage)
  const startIndex = (currentPage - 1) * athletesPerPage
  const endIndex = startIndex + athletesPerPage
  const paginatedAthletes = filteredAthletes.slice(startIndex, endIndex)

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 lg:p-12">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-8 mb-12">
          {[
            { num: 1, label: 'Atletas' },
            { num: 2, label: 'Categorias' },
            { num: 3, label: 'Pagamento' },
            { num: 4, label: 'Confirmação' },
          ].map((step, index) => (
            <div key={step.num} className="flex items-center">
              <div
                className={`${
                  currentStep >= step.num
                    ? 'w-12 h-12 bg-primary-blue text-white text-lg'
                    : 'w-10 h-10 bg-gray-300 text-gray-600 text-sm'
                } rounded-full flex items-center justify-center font-bold transition`}
              >
                {currentStep > step.num ? <FiCheck size={16} /> : step.num}
              </div>
              {index < 3 && (
                <div
                  className={`w-24 h-1 ${
                    currentStep > step.num ? 'bg-primary-blue' : 'bg-gray-300'
                  } transition`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center text-xs text-gray-500 -mt-6 mb-10">
          <span className="inline-block w-20">1 Atletas</span>
          <span className="inline-block w-24">2 Categorias</span>
          <span className="inline-block w-24">3 Pagamento</span>
          <span className="inline-block w-24">4 Confirmação</span>
        </div>

      {/* Step Content */}
      <div>
        {/* Step 1: Seleção de Atletas */}
        {currentStep === 1 && (
          <div>
            {/* Título */}
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2 uppercase">
              INSCRIÇÃO – {mockEvent.title}
            </h1>
            <p className="text-center italic text-gray-600 mb-10">
              Selecione quem irá competir
            </p>

            {/* Card Principal */}
            <div>
              {/* Seção: Inscrição do Responsável (Professor) */}
              <div className="mb-8">
                <p className="text-sm font-semibold italic text-gray-600 mb-3">
                  Inscrição do Responsável (Professor)
                </p>
                <label className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-100 transition">
                  <input
                    type="checkbox"
                    checked={selectedAthletes.some((a) => a.id === 0)}
                    onChange={handleToggleProfessor}
                    className="w-5 h-5 text-primary-blue rounded"
                  />
                  <div className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold">
                    JS
                  </div>
                  <div>
                    <p className="font-medium">Eu, Professor José Silva</p>
                    <p className="text-sm text-gray-600">
                      Professor faixa preta • Competirá na categoria Master (opcional)
                    </p>
                  </div>
                </label>
              </div>

              {/* Busca + Selecionar Todos */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <input
                  type="text"
                  placeholder="Buscar por nome, faixa ou peso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                />
                <button
                  onClick={handleSelectAll}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-black transition"
                >
                  SELECIONAR TODOS
                </button>
              </div>

              {/* Lista de Atletas Paginada */}
              <div className="space-y-4 mb-8">
                {paginatedAthletes.map((athlete) => {
                  const isSelected = selectedAthletes.some((a) => a.id === athlete.id)
                  const isRegistered = athlete.isRegistered

                  return (
                    <label
                      key={athlete.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition cursor-pointer ${
                        isRegistered
                          ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (!isRegistered) {
                            if (isSelected) {
                              setSelectedAthletes((prev) =>
                                prev.filter((a) => a.id !== athlete.id)
                              )
                            } else {
                              setSelectedAthletes((prev) => [
                                ...prev,
                                {
                                  id: athlete.id,
                                  name: athlete.name,
                                  age: athlete.age,
                                  gender: athlete.gender,
                                  academy: athlete.academy,
                                  belt: athlete.belt,
                                  weight: athlete.weight,
                                  willRegister: true,
                                  category: 'Infanto-Juvenil A (12 a 13 anos)',
                                  beltCategory: athlete.belt,
                                  weightCategory: 'Pluma (Até 38.500 kg)',
                                  registrationType: 'Apenas Categoria de Peso',
                                  price: 70.0,
                                },
                              ])
                            }
                          }
                        }}
                        disabled={isRegistered}
                        className="w-5 h-5 text-primary-blue rounded"
                      />
                      <div className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-sm">
                        {getInitials(athlete.name)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{athlete.name}</p>
                        <p className="text-sm text-gray-600">
                          {athlete.age} anos • {athlete.belt} • {athlete.weight}kg{' '}
                          {isRegistered && (
                            <em className="text-gray-500">(já inscrito neste evento)</em>
                          )}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-10">
                  {currentPage > 1 && (
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Anterior
                    </button>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                    )
                    .map((page, index, array) => {
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <span key={`ellipsis-${page}`} className="px-2">
                            ...
                          </span>
                        )
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            page === currentPage
                              ? 'bg-primary-blue text-white'
                              : 'border hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}

                  {currentPage < totalPages && (
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Próximo
                    </button>
                  )}
                </div>
              )}

              {/* Rodapé */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-200">
                <button
                  onClick={() => setIsNewAthleteModalOpen(true)}
                  className="text-primary-blue font-medium flex items-center gap-2 hover:gap-3 transition"
                >
                  <FiUserPlus size={24} />
                  Cadastrar Novo Atleta
                </button>

                <div className="text-center my-4">
                  <span className="text-3xl font-bold text-gray-800">
                    {selectedAthletes.length}
                  </span>
                  <br />
                  <span className="text-gray-600">atletas selecionados</span>
                </div>

                <button
                  onClick={handleNext}
                  disabled={!canProceedToStep2}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Configuração de Categorias */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800 uppercase">
              CATEGORIAS
            </h1>
            <p className="text-center text-lg italic text-gray-600 mb-12">
              Configure as categorias, faixas e pesos para cada atleta
            </p>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-lg p-8 lg:p-12">
              <div className="space-y-6">
                {selectedAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold italic text-gray-900">
                          {athlete.name}, {athlete.age} anos
                        </h3>
                        <p className="text-sm text-gray-600">
                          {athlete.academy} • {athlete.belt} • {athlete.weight} kg
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Inscrição:</span>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`register-${athlete.id}`}
                            checked={!athlete.willRegister}
                            onChange={() => handleToggleRegister(athlete.id)}
                            className="w-4 h-4 text-amber-600 focus:ring-amber-600"
                          />
                          <span className="text-gray-700">NÃO</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`register-${athlete.id}`}
                            checked={athlete.willRegister}
                            onChange={() => handleToggleRegister(athlete.id)}
                            className="w-4 h-4 text-amber-600 focus:ring-amber-600"
                          />
                          <span className="text-gray-700">SIM</span>
                        </label>
                      </div>
                    </div>

                    {athlete.willRegister && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">
                            Categoria
                          </label>
                          <select
                            value={athlete.category || ''}
                            onChange={(e) =>
                              handleCategoryChange(athlete.id, 'category', e.target.value)
                            }
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition"
                          >
                            <option>Infanto-Juvenil A (12 a 13 anos)</option>
                            <option>Infanto-Juvenil B (14 a 15 anos)</option>
                            <option>Juvenil (16 a 17 anos)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Faixa</label>
                          <select
                            value={athlete.beltCategory || ''}
                            onChange={(e) =>
                              handleCategoryChange(athlete.id, 'beltCategory', e.target.value)
                            }
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition"
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
                            value={athlete.weightCategory || ''}
                            onChange={(e) =>
                              handleCategoryChange(athlete.id, 'weightCategory', e.target.value)
                            }
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition"
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
                            value={athlete.registrationType || ''}
                            onChange={(e) =>
                              handleCategoryChange(athlete.id, 'registrationType', e.target.value)
                            }
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-gray-400 transition"
                          >
                            <option>Apenas Categoria de Peso: R$ 70,00</option>
                            <option>Categoria de Peso + Absoluto: R$ 95,00</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl">
                  <p className="text-gray-700">
                    <strong className="text-gray-800">ATENÇÃO:</strong> Para o campeonato, a
                    idade é calculada com base no ano de nascimento.{' '}
                    <strong>Exemplo:</strong> O atleta nasceu em 2015, então em 2025 ele tem 10
                    anos.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
                <button
                  onClick={handlePrevious}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-8 rounded-xl transition flex items-center gap-3"
                >
                  <FiChevronLeft className="w-5 h-5" />
                  <span>Voltar</span>
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceedToStep3}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-lg py-3 px-12 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  <span>Continuar</span>
                  <FiChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pagamento */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800 uppercase">
              PAGAMENTO
            </h1>
            <p className="text-center text-lg italic text-gray-600 mb-12">
              Escolha a forma de pagamento
            </p>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-lg p-8 lg:p-12">
              {/* Resumo */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-lg font-semibold italic text-gray-900 mb-4">Resumo da Inscrição</h3>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>N° de atleta(s) inscrito(s):</strong> {registeredCount}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    Valor Total: R$ {totalValue.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold italic text-gray-900 mb-4">
                  Forma de Pagamento: Boleto Bancário ou Pix
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-400 transition">
                    <input
                      type="radio"
                      name="payment-method"
                      value="unified"
                      checked={paymentMethod === 'unified'}
                      onChange={() => setPaymentMethod('unified')}
                      className="w-5 h-5 text-amber-600 focus:ring-amber-600"
                    />
                    <span className="text-gray-700 font-medium">
                      Pagamento Unificado: Todas as inscrições juntas
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-400 transition">
                    <input
                      type="radio"
                      name="payment-method"
                      value="individual"
                      checked={paymentMethod === 'individual'}
                      onChange={() => setPaymentMethod('individual')}
                      className="w-5 h-5 text-amber-600 focus:ring-amber-600"
                    />
                    <span className="text-gray-700 font-medium">
                      Pagamento Individual: Cada inscrição terá o seu pagamento
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
                <button
                  onClick={handlePrevious}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-8 rounded-xl transition flex items-center gap-3"
                >
                  <FiChevronLeft className="w-5 h-5" />
                  <span>Voltar</span>
                </button>
                <button
                  onClick={handleNext}
                  disabled={registeredCount === 0}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-lg py-3 px-12 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  <span>Continuar</span>
                  <FiChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmação */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800 uppercase">
              CONFIRMAÇÃO
            </h1>
            <p className="text-center text-lg italic text-gray-600 mb-12">
              Revise todas as informações antes de finalizar
            </p>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-lg p-8 lg:p-12">
              {/* Resumo Completo */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                <h3 className="text-lg font-semibold italic text-gray-900 mb-4">Resumo da Inscrição</h3>
                <div className="space-y-3 text-gray-700">
                  <p>
                    <strong>N° de atleta(s) inscrito(s):</strong> {registeredCount}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    Valor Total: R$ {totalValue.toFixed(2).replace('.', ',')}
                  </p>
                  <p>
                    <strong>Forma de Pagamento:</strong>{' '}
                    {paymentMethod === 'unified' ? 'Pagamento Unificado' : 'Pagamento Individual'}
                  </p>
                </div>
              </div>

              {/* Lista de Atletas Inscritos */}
              {selectedAthletes.filter((a) => a.willRegister).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
                  <h3 className="text-lg font-semibold italic text-gray-900 mb-4">Atletas Selecionados</h3>
                  <div className="space-y-3">
                    {selectedAthletes
                      .filter((a) => a.willRegister)
                      .map((athlete) => (
                        <div
                          key={athlete.id}
                          className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {getInitials(athlete.name)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{athlete.name}</p>
                            <p className="text-sm text-gray-600">
                              {athlete.category} • {athlete.beltCategory} • {athlete.weightCategory}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">
                            R$ {athlete.price?.toFixed(2).replace('.', ',') || '0,00'}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-8 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-8 rounded-xl transition flex items-center gap-3"
                >
                  <FiChevronLeft className="w-5 h-5" />
                  <span>Voltar</span>
                </button>
                <button
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-lg py-3 px-12 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={registeredCount === 0}
                >
                  FINALIZAR INSCRIÇÃO
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
      </div>

      {/* Modal de Seleção de Atletas */}
      <AthleteSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        athletes={mockAthletes}
        eventId={eventId}
        onConfirmSelection={handleConfirmSelection}
      />

      {/* Modal de Cadastro de Novo Atleta */}
      <NewAthleteModal
        open={isNewAthleteModalOpen}
        onClose={() => setIsNewAthleteModalOpen(false)}
        onSubmit={(data) => {
          // Aqui você pode adicionar lógica para salvar o atleta e atualizar a lista
          console.log('Novo atleta cadastrado:', data)
          setIsNewAthleteModalOpen(false)
          // Recarregar a lista de atletas ou adicionar o novo atleta à lista
        }}
        mode="create"
        showPasswordFields={false}
      />
    </div>
  )
}

