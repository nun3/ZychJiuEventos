'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import Link from 'next/link'
import { FiArrowLeft, FiUsers, FiSearch, FiCheck, FiAlertTriangle } from 'react-icons/fi'

interface Athlete {
  id: string
  name: string
  age?: number
  gender: 'M' | 'F'
  category: string
  belt: string
  weightCategory: string
  weight: string
  academy: string
  professor: string
  paymentStatus: 'confirmed' | 'pending'
  absolute?: boolean
}

// Dados mockados de atletas inscritos
const mockAthletes: Athlete[] = [
  {
    id: '0088',
    name: 'ADEMIR ANTONIO FROZZA',
    age: 45,
    gender: 'M',
    category: 'MASTER 5',
    belt: 'BRANCA',
    weightCategory: 'LEVE',
    weight: '70.0',
    academy: 'THE MATCH CHAMP',
    professor: 'CRYSTIAN DA CUNHA',
    paymentStatus: 'confirmed',
  },
  {
    id: '0123',
    name: 'ALUY FRANCISCO VARELA TREVISAN',
    age: 8,
    gender: 'M',
    category: 'INFANTIL A',
    belt: 'BRANCA/CINZA',
    weightCategory: 'MÉDIO',
    weight: '35.0',
    academy: 'ARAÚJO JIU-JITSU TEAM',
    professor: 'FELIPE BURILLE',
    paymentStatus: 'confirmed',
  },
  {
    id: '0089',
    name: 'ÁLVARO ARAÚJO DA SILVA',
    age: 35,
    gender: 'M',
    category: 'MASTER 1',
    belt: 'AZUL',
    weightCategory: 'SUPER PESADO',
    weight: '95.0',
    academy: 'GRACIE BARRA PALMAS PR',
    professor: 'DIEGO BUSSOLARO',
    paymentStatus: 'pending',
  },
  {
    id: '0104',
    name: 'TOMÁS VICENTE BONAVIGO DE ALMEIDA',
    age: 6,
    gender: 'M',
    category: 'INFANTIL A',
    belt: 'BRANCA/CINZA',
    weightCategory: 'GALO',
    weight: '23.0',
    academy: 'EDL TEAM',
    professor: 'DOUGLAS MELLO',
    paymentStatus: 'pending',
  },
  {
    id: '0053',
    name: 'ANNA LUIZA BARBOSA',
    age: 7,
    gender: 'F',
    category: 'INFANTIL A',
    belt: 'BRANCA/CINZA',
    weightCategory: 'LEVE',
    weight: '26.0',
    academy: 'THE MATCH CHAMP - CLEVELANDIA',
    professor: 'MARCELO VALERIO',
    paymentStatus: 'confirmed',
  },
  {
    id: '0113',
    name: 'MARIA EDUARDA DE MELO VIEIRA',
    age: 7,
    gender: 'F',
    category: 'INFANTIL A',
    belt: 'BRANCA/CINZA',
    weightCategory: 'LEVE',
    weight: '25.5',
    academy: 'ARAÚJO JIU-JITSU TEAM',
    professor: 'ALEXANDRE ARAUJO',
    paymentStatus: 'confirmed',
  },
  {
    id: '0045',
    name: 'ARON FERRARI',
    age: 8,
    gender: 'M',
    category: 'INFANTIL A',
    belt: 'COLORIDA',
    weightCategory: 'PLUMA',
    weight: '30.0',
    academy: 'ARAÚJO JIU-JITSU TEAM',
    professor: 'ALEXANDRE ARAUJO',
    paymentStatus: 'pending',
    absolute: true,
  },
  {
    id: '0107',
    name: 'BRAYON GUIMARAES CAVALCANTE',
    age: 25,
    gender: 'M',
    category: 'ADULTO',
    belt: 'BRANCA',
    weightCategory: 'MEIO PESADO',
    weight: '88.0',
    academy: 'ARAÚJO JIU-JITSU TEAM',
    professor: 'ALEXANDRE ARAUJO',
    paymentStatus: 'pending',
    absolute: true,
  },
  {
    id: '0109',
    name: 'HELENA VITÓRIA CORDEIRO LOURENÇO',
    age: 6,
    gender: 'F',
    category: 'PRÉ-MIRIM',
    belt: 'BRANCA/CINZA',
    weightCategory: 'LEVE',
    weight: '24.0',
    academy: 'ARAÚJO JIU-JITSU TEAM',
    professor: 'ALEXANDRE ARAUJO',
    paymentStatus: 'confirmed',
  },
]

type ViewMode = 'geral' | 'categoria-peso' | 'absoluto' | 'equipe' | 'equipe-professor'

export default function AthletesPage({ params }: { params: { id: string } }) {
  const [viewMode, setViewMode] = useState<ViewMode>('geral')
  const [filters, setFilters] = useState({
    category: '',
    belt: '',
    weight: '',
    gender: '',
    academy: '',
    professor: '',
  })

  // Agrupar atletas por categoria de peso
  const groupByWeightCategory = () => {
    const grouped: Record<string, Athlete[]> = {}
    mockAthletes.forEach((athlete) => {
      const key = `${athlete.category} - ${athlete.belt} - ${athlete.weightCategory} - ${athlete.gender === 'M' ? 'MASCULINO' : 'FEMININO'}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(athlete)
    })
    return grouped
  }

  // Agrupar por equipe
  const groupByTeam = () => {
    const grouped: Record<string, Athlete[]> = {}
    mockAthletes.forEach((athlete) => {
      if (!grouped[athlete.academy]) {
        grouped[athlete.academy] = []
      }
      grouped[athlete.academy].push(athlete)
    })
    return grouped
  }

  // Agrupar por equipe e professor
  const groupByTeamAndProfessor = () => {
    const grouped: Record<string, Athlete[]> = {}
    mockAthletes.forEach((athlete) => {
      const key = `${athlete.academy} - ${athlete.professor}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(athlete)
    })
    return grouped
  }

  // Filtrar atletas
  const filteredAthletes = mockAthletes.filter((athlete) => {
    if (filters.category && !athlete.category.includes(filters.category)) return false
    if (filters.belt && !athlete.belt.includes(filters.belt)) return false
    if (filters.weight && !athlete.weightCategory.includes(filters.weight)) return false
    if (filters.gender && athlete.gender !== filters.gender) return false
    if (filters.academy && !athlete.academy.includes(filters.academy)) return false
    if (filters.professor && !athlete.professor.includes(filters.professor)) return false
    return true
  })

  const renderAthleteCard = (athlete: Athlete) => (
    <div key={athlete.id} className="border-b border-gray-200 py-4">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <FiUsers className="text-gray-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 mb-1">{athlete.name}</h3>
          <p className="text-sm text-gray-600 mb-2">
            CATEGORIA DE PESO JIU-JITSU{' '}
            <span className="text-primary-orange cursor-pointer">
              {athlete.category} - {athlete.belt} - {athlete.weightCategory} - {athlete.gender === 'M' ? 'MASCULINO' : 'FEMININO'}
            </span>
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <span className="text-primary-orange cursor-pointer">{athlete.academy}</span>
          </p>
          <p className="text-sm text-gray-600 mb-2">{athlete.professor}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">ID: {athlete.id}</span>
            <div className="flex items-center space-x-2">
              {athlete.paymentStatus === 'confirmed' ? (
                <>
                  <FiCheck className="text-green-600" />
                  <span className="text-green-600 font-medium text-sm">PAGAMENTO CONFIRMADO</span>
                </>
              ) : (
                <>
                  <FiAlertTriangle className="text-red-600" />
                  <span className="text-red-600 font-medium text-sm">PAGAMENTO PENDENTE</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20">
        {/* Header */}
        <div className="bg-primary-dark text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl md:text-3xl font-bold">
                CHECAGEM 2º FESTIVAL KIDS DE JIU-JITSU
              </h1>
              <span className="text-gray-300 text-sm">página do</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Título e Tabs */}
          <div className="mb-6">
            <Link
              href={`/eventos/${params.id}`}
              className="text-gray-600 hover:text-primary-orange flex items-center space-x-2 transition mb-4"
            >
              <FiArrowLeft />
              <span>voltar para o evento</span>
            </Link>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-orange mb-4 border-b-2 border-primary-red pb-2">
              Lista de Atletas
            </h2>

            {/* Tabs de Visualização */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(['geral', 'categoria-peso', 'absoluto', 'equipe', 'equipe-professor'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    viewMode === mode
                      ? 'bg-primary-red text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {mode === 'geral' && 'Geral'}
                  {mode === 'categoria-peso' && 'Categoria de Peso'}
                  {mode === 'absoluto' && 'Absoluto Jiu-Jitsu'}
                  {mode === 'equipe' && 'Equipe'}
                  {mode === 'equipe-professor' && 'Equipe e Professor'}
                </button>
              ))}
            </div>

            {/* Filtros */}
            {viewMode === 'categoria-peso' && (
              <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                  >
                    <option value="">Categoria</option>
                    <option>Infantil A</option>
                    <option>Pré-Mirim</option>
                    <option>Master 1</option>
                    <option>Master 5</option>
                    <option>Adulto</option>
                  </select>
                  <select
                    value={filters.belt}
                    onChange={(e) => setFilters({ ...filters, belt: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                  >
                    <option value="">Faixa</option>
                    <option>Branca/Cinza</option>
                    <option>Branca</option>
                    <option>Azul</option>
                    <option>Colorida</option>
                  </select>
                  <select
                    value={filters.weight}
                    onChange={(e) => setFilters({ ...filters, weight: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                  >
                    <option value="">Peso</option>
                    <option>Galo</option>
                    <option>Pluma</option>
                    <option>Leve</option>
                    <option>Médio</option>
                    <option>Meio Pesado</option>
                    <option>Pesado</option>
                  </select>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
                  >
                    <option value="">Sexo</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
                <button className="mt-4 bg-primary-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition flex items-center space-x-2">
                  <FiSearch />
                  <span>Pesquisar</span>
                </button>
              </div>
            )}

            <div className="border-b-2 border-primary-red mb-4">
              <p className="text-primary-orange font-medium mb-2">Atleta</p>
            </div>
          </div>

          {/* Conteúdo baseado no modo de visualização */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {viewMode === 'geral' && (
              <div className="space-y-4">
                {filteredAthletes.map(renderAthleteCard)}
              </div>
            )}

            {viewMode === 'categoria-peso' && (
              <div className="space-y-6">
                {Object.entries(groupByWeightCategory()).map(([category, athletes]) => (
                  <div key={category}>
                    <h3 className="text-lg font-bold text-primary-orange mb-4 border-b border-primary-red pb-2">
                      {category} (ATÉ {athletes[0].weight} KG)
                    </h3>
                    {athletes.map(renderAthleteCard)}
                    <p className="text-sm text-gray-600 mt-2">Total: {athletes.length} {athletes.length === 1 ? 'atleta' : 'atletas'}</p>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'absoluto' && (
              <div className="space-y-4">
                {filteredAthletes.filter((a) => a.absolute).map(renderAthleteCard)}
              </div>
            )}

            {viewMode === 'equipe' && (
              <div className="space-y-6">
                {Object.entries(groupByTeam()).map(([team, athletes]) => (
                  <div key={team} className="border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-2xl">🛡️</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-primary-orange">{team}</h3>
                          <p className="text-sm text-gray-600">
                            {athletes.length} {athletes.length === 1 ? 'atleta inscrito' : 'atletas inscritos'}
                          </p>
                        </div>
                      </div>
                      <FiSearch className="text-gray-400 cursor-pointer" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'equipe-professor' && (
              <div className="space-y-6">
                {Object.entries(groupByTeamAndProfessor()).map(([key, athletes]) => {
                  const [team, professor] = key.split(' - ')
                  return (
                    <div key={key}>
                      <h3 className="text-lg font-bold text-primary-orange mb-4 border-b border-primary-red pb-2">
                        {team} - {professor}
                      </h3>
                      {athletes.map(renderAthleteCard)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <WhatsAppWidget />
    </main>
  )
}

