'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AthleteSelectionModal from '@/components/AthleteSelectionModal'
import NewAthleteModal from '@/components/Modals/NewAthleteModal'
import IncludeMyAthletesModal from '@/components/Modals/IncludeMyAthletesModal'
import { FiUser, FiUsers, FiCheck, FiChevronRight, FiChevronLeft, FiSearch, FiUserPlus, FiDownload } from 'react-icons/fi'

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
  const [includedAthletes, setIncludedAthletes] = useState<typeof mockAthletes>([]) // Atletas incluídos do dashboard
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewAthleteModalOpen, setIsNewAthleteModalOpen] = useState(false)
  const [isIncludeMyAthletesModalOpen, setIsIncludeMyAthletesModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'unified' | 'individual'>('unified')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const athletesPerPage = 24 // Grid mais compacto permite mais cards por página

  // Lista combinada de atletas (mockados + incluídos do dashboard)
  const allAthletes = [...mockAthletes, ...includedAthletes]

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

    // Calcular atletas da página atual (usando lista combinada)
    const filtered = allAthletes.filter((athlete) =>
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

  const getBeltColorClass = (belt: string) => {
    const normalizedBelt = belt.toUpperCase()
    
    if (normalizedBelt.includes('BRANCA')) return 'bg-gray-100 text-gray-700 border border-gray-200'
    if (normalizedBelt.includes('CINZA')) return 'bg-slate-400 text-white'
    if (normalizedBelt.includes('AMARELA')) return 'bg-yellow-400 text-yellow-900'
    if (normalizedBelt.includes('LARANJA')) return 'bg-orange-500 text-white'
    if (normalizedBelt.includes('VERDE')) return 'bg-green-600 text-white'
    if (normalizedBelt.includes('AZUL')) return 'bg-blue-600 text-white'
    if (normalizedBelt.includes('ROXA')) return 'bg-purple-600 text-white'
    if (normalizedBelt.includes('MARROM')) return 'bg-amber-800 text-white'
    if (normalizedBelt.includes('PRETA')) return 'bg-black text-white border border-gray-700'
    
    return 'bg-gray-200 text-gray-600'
  }

  const handleConfirmSelection = (selectedIds: number[]) => {
    const newAthletes: SelectedAthlete[] = selectedIds
      .map((id) => {
        const athlete = allAthletes.find((a) => a.id === id)
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

  const handleIncludeMyAthletes = (athletes: any[]) => {
    // Converter os atletas para o formato da lista de exibição
    const formattedAthletes = athletes.map((athlete) => ({
      id: athlete.id,
      name: athlete.name,
      age: athlete.age,
      gender: athlete.gender,
      academy: athlete.academy,
      belt: athlete.belt,
      weight: athlete.weight,
    }))

    // Adicionar à lista de atletas incluídos (para aparecer no grid)
    setIncludedAthletes((prev) => {
      const existingIds = prev.map((a) => a.id)
      const newOnes = formattedAthletes.filter((a) => !existingIds.includes(a.id))
      return [...prev, ...newOnes]
    })

    // Adicionar aos atletas selecionados
    const newAthletes: SelectedAthlete[] = athletes.map((athlete) => ({
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

    setSelectedAthletes((prev) => {
      const existingIds = prev.map((a) => a.id)
      const newOnes = newAthletes.filter((a) => !existingIds.includes(a.id))
      return [...prev, ...newOnes]
    })
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

  const filteredAthletes = allAthletes.filter((athlete) =>
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-7 lg:p-11">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-5 md:gap-11 lg:gap-14 mb-14">
          {[
            { num: 1, label: 'Atletas' },
            { num: 2, label: 'Categorias' },
            { num: 3, label: 'Pagamento' },
            { num: 4, label: 'Confirmação' },
          ].map((step, index) => (
            <div key={step.num} className="flex flex-col items-center">
              <div className="flex items-center">
                <div
                  className={`${
                    currentStep >= step.num
                      ? 'w-14 h-14 bg-primary-blue text-white text-xl'
                      : 'w-12 h-12 bg-gray-300 text-gray-600 text-lg'
                  } rounded-full flex items-center justify-center font-bold transition`}
                >
                  {currentStep > step.num ? <FiCheck size={22} /> : step.num}
                </div>
                {index < 3 && (
                  <div
                    className={`w-16 md:w-28 lg:w-36 h-1 ${
                      currentStep > step.num ? 'bg-primary-blue' : 'bg-gray-300'
                    } transition`}
                  />
                )}
              </div>
              <span className="mt-2 text-lg md:text-xl text-gray-600 font-semibold uppercase whitespace-nowrap">
                {step.num} {step.label}
              </span>
            </div>
          ))}
        </div>

      {/* Step Content */}
      <div>
        {/* Step 1: Seleção de Atletas */}
        {currentStep === 1 && (
          <div>
            {/* Título */}
            <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-2 uppercase">
              INSCRIÇÃO – {mockEvent.title}
            </h1>
            <p className="text-center text-lg text-gray-600 mb-8">
              Selecione quem irá competir
            </p>

            {/* Card Principal */}
            <div>
              {/* Busca + Botões */}
              <div className="flex flex-col sm:flex-row gap-3 mb-7">
                <input
                  type="text"
                  placeholder="Buscar por nome, faixa ou peso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                />
                <button
                  onClick={handleSelectAll}
                  className="px-5 py-3 bg-gray-800 text-white rounded-lg font-medium text-lg hover:bg-black transition whitespace-nowrap"
                >
                  SELECIONAR TODOS
                </button>
                <button
                  onClick={() => setIsIncludeMyAthletesModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  <FiDownload size={20} />
                  Incluir Meus Atletas
                </button>
                <button
                  onClick={() => setIsNewAthleteModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-blue text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  <FiUserPlus size={20} />
                  Cadastrar Novo Atleta
                </button>
              </div>

              {/* Grid de Cards de Atletas Selecionáveis */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-7">
                {/* Card Especial do Professor */}
                <label
                  className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                    selectedAthletes.some((a) => a.id === 0)
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 ring-2 ring-blue-500 shadow-md'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 hover:border-blue-400 hover:shadow-sm'
                  }`}
                >
                  <div className="p-2.5">
                    {/* Checkbox no canto superior direito */}
                    <div className="absolute top-1.5 right-1.5">
                      <input
                        type="checkbox"
                        checked={selectedAthletes.some((a) => a.id === 0)}
                        onChange={handleToggleProfessor}
                        className="w-4 h-4 text-primary-blue rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Badge Especial */}
                    <div className="absolute top-1.5 left-1.5">
                      <span className="bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                        Prof
                      </span>
                    </div>

                    {/* Avatar Especial */}
                    <div className="flex justify-center mb-2 mt-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 ${
                        selectedAthletes.some((a) => a.id === 0)
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-gray-800 text-white border-gray-900'
                      }`}>
                        JS
                      </div>
                    </div>

                    {/* Nome */}
                    <h3 className={`text-center font-bold mb-1.5 text-xs leading-tight ${
                      selectedAthletes.some((a) => a.id === 0) ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      Prof. José Silva
                    </h3>

                    {/* Informações */}
                    <div className="space-y-1 text-center">
                      <p className="text-[10px] text-gray-600">
                        Faixa Preta
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black text-white">
                          PRETA
                        </span>
                        <span className="text-[10px] text-gray-500">•</span>
                        <span className="text-[10px] text-gray-600">Master</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        (Opcional)
                      </p>
                    </div>
                  </div>
                </label>

                {/* Cards de Atletas */}
                {paginatedAthletes.map((athlete) => {
                  const isSelected = selectedAthletes.some((a) => a.id === athlete.id)
                  const isRegistered = athlete.isRegistered

                  return (
                    <label
                      key={athlete.id}
                      className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                        isRegistered
                          ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-white border-blue-500 ring-2 ring-blue-500 shadow-md'
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="p-2.5">
                        {/* Checkbox no canto superior direito */}
                        <div className="absolute top-1.5 right-1.5">
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
                            className="w-4 h-4 text-primary-blue rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Avatar */}
                        <div className="flex justify-center mb-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected 
                              ? 'bg-primary-blue text-white' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {getInitials(athlete.name)}
                          </div>
                        </div>

                        {/* Nome */}
                        <h3 className={`text-center font-semibold mb-1.5 text-xs leading-tight line-clamp-2 ${
                          isSelected ? 'text-primary-blue' : 'text-gray-900'
                        }`}>
                          {athlete.name}
                        </h3>

                        {/* Informações */}
                        <div className="space-y-1 text-center">
                          <p className="text-[10px] text-gray-600">
                            {athlete.age} anos
                          </p>
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getBeltColorClass(athlete.belt)}`}>
                              {athlete.belt}
                            </span>
                            <span className="text-[10px] text-gray-500">•</span>
                            <span className="text-[10px] text-gray-600">{athlete.weight}kg</span>
                          </div>
                          <p className="text-[10px] text-gray-500 truncate mt-1">
                            {athlete.academy}
                          </p>
                          {isRegistered && (
                            <p className="text-[10px] text-red-600 font-medium mt-0.5">
                              (inscrito)
                            </p>
                          )}
                        </div>
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
                      className="px-5 py-2 text-lg border rounded-lg hover:bg-gray-100"
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
                          <span key={`ellipsis-${page}`} className="px-2 text-lg">
                            ...
                          </span>
                        )
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-5 py-2 text-lg rounded-lg font-medium ${
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
                      className="px-5 py-2 text-lg border rounded-lg hover:bg-gray-100"
                    >
                      Próximo
                    </button>
                  )}
                </div>
              )}

              {/* Rodapé */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-200">
                <div className="text-center my-4 sm:my-0">
                  <span className="text-3xl md:text-4xl font-bold text-gray-800">
                    {selectedAthletes.length}
                  </span>
                  <br />
                  <span className="text-xl text-gray-600">atletas selecionados</span>
                </div>

                <button
                  onClick={handleNext}
                  disabled={!canProceedToStep2}
                  className="px-7 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium text-lg hover:bg-gray-300 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-3 text-gray-800 uppercase">
              CATEGORIAS
            </h1>
            <p className="text-center text-lg text-gray-600 mb-10">
              Configure as categorias, faixas e pesos para cada atleta
            </p>

            <div className="bg-white border border-gray-200 rounded-lg shadow-md p-7 lg:p-11">
              <div className="space-y-5">
                {selectedAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {athlete.name}, {athlete.age} anos
                        </h3>
                        <p className="text-lg text-gray-600">
                          {athlete.academy} • {athlete.belt} • {athlete.weight} kg
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg text-gray-600 uppercase">Inscrição:</span>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`register-${athlete.id}`}
                            checked={!athlete.willRegister}
                            onChange={() => handleToggleRegister(athlete.id)}
                            className="w-4 h-4 text-amber-600 focus:ring-amber-600"
                          />
                          <span className="text-lg text-gray-700">NÃO</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`register-${athlete.id}`}
                            checked={athlete.willRegister}
                            onChange={() => handleToggleRegister(athlete.id)}
                            className="w-5 h-5 text-amber-600 focus:ring-amber-600"
                          />
                          <span className="text-lg text-gray-700">SIM</span>
                        </label>
                      </div>
                    </div>

                    {athlete.willRegister && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-lg text-gray-700 font-medium mb-2 uppercase">
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
                          <label className="block text-lg text-gray-700 font-medium mb-2 uppercase">Faixa</label>
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
                          <label className="block text-lg text-gray-700 font-medium mb-2 uppercase">
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
                          <label className="block text-lg text-gray-700 font-medium mb-2 uppercase">
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

                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-xl">
                  <p className="text-lg text-gray-700">
                    <strong className="text-gray-800 uppercase">ATENÇÃO:</strong> Para o campeonato, a
                    idade é calculada com base no ano de nascimento.{' '}
                    <strong>Exemplo:</strong> O atleta nasceu em 2015, então em 2025 ele tem 10
                    anos.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-7 border-t border-gray-200 mt-7">
                <button
                  onClick={handlePrevious}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-7 rounded-xl transition flex items-center gap-2"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceedToStep3}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-lg py-2 px-10 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>Continuar</span>
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pagamento */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-3 text-gray-800 uppercase">
              PAGAMENTO
            </h1>
            <p className="text-center text-lg text-gray-600 mb-10">
              Escolha a forma de pagamento
            </p>

            <div className="bg-white border border-gray-200 rounded-lg shadow-md p-7 lg:p-11">
              {/* Resumo */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 uppercase">Resumo da Inscrição</h3>
                <div className="space-y-2 text-lg text-gray-700">
                  <p>
                    <strong>N° de atleta(s) inscrito(s):</strong> {registeredCount}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    Valor Total: R$ {totalValue.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 uppercase">
                  Forma de Pagamento: Boleto Bancário ou Pix
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-400 transition">
                    <input
                      type="radio"
                      name="payment-method"
                      value="unified"
                      checked={paymentMethod === 'unified'}
                      onChange={() => setPaymentMethod('unified')}
                      className="w-5 h-5 text-amber-600 focus:ring-amber-600"
                    />
                    <span className="text-lg text-gray-700 font-medium">
                      Pagamento Unificado: Todas as inscrições juntas
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-400 transition">
                    <input
                      type="radio"
                      name="payment-method"
                      value="individual"
                      checked={paymentMethod === 'individual'}
                      onChange={() => setPaymentMethod('individual')}
                      className="w-5 h-5 text-amber-600 focus:ring-amber-600"
                    />
                    <span className="text-lg text-gray-700 font-medium">
                      Pagamento Individual: Cada inscrição terá o seu pagamento
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between pt-7 border-t border-gray-200 mt-7">
                <button
                  onClick={handlePrevious}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-7 rounded-xl transition flex items-center gap-2"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
                <button
                  onClick={handleNext}
                  disabled={registeredCount === 0}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium text-lg py-2 px-10 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>Continuar</span>
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmação */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-3 text-gray-800 uppercase">
              CONFIRMAÇÃO
            </h1>
            <p className="text-center text-lg text-gray-600 mb-10">
              Revise todas as informações antes de finalizar
            </p>

            <div className="bg-white border border-gray-200 rounded-lg shadow-md p-7 lg:p-11">
              {/* Resumo Completo */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 uppercase">Resumo da Inscrição</h3>
                <div className="space-y-2 text-lg text-gray-700">
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
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-5">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 uppercase">Atletas Selecionados</h3>
                  <div className="space-y-2">
                    {selectedAthletes
                      .filter((a) => a.willRegister)
                      .map((athlete) => (
                        <div
                          key={athlete.id}
                          className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl border border-gray-200"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {getInitials(athlete.name)}
                          </div>
                          <div className="flex-1">
                            <p className="text-xl font-semibold text-gray-900">{athlete.name}</p>
                            <p className="text-lg text-gray-600">
                              {athlete.category} • {athlete.beltCategory} • {athlete.weightCategory}
                            </p>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            R$ {athlete.price?.toFixed(2).replace('.', ',') || '0,00'}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-7 border-t border-gray-200">
                <button
                  onClick={handlePrevious}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-7 rounded-xl transition flex items-center gap-2"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>
                <button
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-lg py-2 px-10 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Modal de Incluir Meus Atletas */}
      <IncludeMyAthletesModal
        open={isIncludeMyAthletesModalOpen}
        onClose={() => setIsIncludeMyAthletesModalOpen(false)}
        onConfirm={handleIncludeMyAthletes}
        alreadySelectedIds={selectedAthletes.map((a) => a.id)}
      />
    </div>
  )
}

