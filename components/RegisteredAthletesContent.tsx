'use client'

import { useState, useEffect } from 'react'
import { FiUsers, FiSearch, FiCheck, FiAlertTriangle, FiActivity, FiZap, FiShield, FiChevronDown, FiChevronUp } from 'react-icons/fi'

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
  {
    id: '0110',
    name: 'GABRIEL SANTOS',
    age: 12,
    gender: 'M',
    category: 'INFANTO-JUVENIL A',
    belt: 'AMARELA',
    weightCategory: 'PLUMA',
    weight: '38.5',
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    professor: 'RICARDO ZYCH',
    paymentStatus: 'confirmed',
  },
  {
    id: '0111',
    name: 'MANUELA OLIVEIRA',
    age: 10,
    gender: 'F',
    category: 'INFANTIL A',
    belt: 'LARANJA',
    weightCategory: 'LEVE',
    weight: '32.0',
    academy: 'THE MATCH CHAMP',
    professor: 'CRYSTIAN DA CUNHA',
    paymentStatus: 'pending',
  },
  {
    id: '0112',
    name: 'THEO FERREIRA',
    age: 9,
    gender: 'M',
    category: 'INFANTIL A',
    belt: 'VERDE',
    weightCategory: 'MÉDIO',
    weight: '40.0',
    academy: 'GRACIE BARRA PALMAS PR',
    professor: 'DIEGO BUSSOLARO',
    paymentStatus: 'confirmed',
    absolute: true,
  },
  {
    id: '0113',
    name: 'LUIZA COSTA',
    age: 8,
    gender: 'F',
    category: 'INFANTIL A',
    belt: 'BRANCA',
    weightCategory: 'GALO',
    weight: '28.0',
    academy: 'ARAÚJO JIU-JITSU TEAM',
    professor: 'FELIPE BURILLE',
    paymentStatus: 'confirmed',
  },
  {
    id: '0114',
    name: 'DAVI SILVA',
    age: 11,
    gender: 'M',
    category: 'INFANTO-JUVENIL A',
    belt: 'AZUL',
    weightCategory: 'PESADO',
    weight: '55.0',
    academy: 'EDL TEAM',
    professor: 'DOUGLAS MELLO',
    paymentStatus: 'pending',
  },
  {
    id: '0115',
    name: 'ISABELLA MARTINS',
    age: 7,
    gender: 'F',
    category: 'PRÉ-MIRIM',
    belt: 'CINZA',
    weightCategory: 'LEVE',
    weight: '25.0',
    academy: 'THE MATCH CHAMP - CLEVELANDIA',
    professor: 'MARCELO VALERIO',
    paymentStatus: 'confirmed',
  },
  {
    id: '0116',
    name: 'LUCAS ALMEIDA',
    age: 13,
    gender: 'M',
    category: 'INFANTO-JUVENIL B',
    belt: 'VERDE',
    weightCategory: 'MEIO PESADO',
    weight: '52.0',
    academy: 'ARAÚJO JIU-JITSU TEAM',
    professor: 'ALEXANDRE ARAUJO',
    paymentStatus: 'confirmed',
    absolute: true,
  },
  {
    id: '0117',
    name: 'SOFIA RODRIGUES',
    age: 9,
    gender: 'F',
    category: 'INFANTIL A',
    belt: 'AMARELA',
    weightCategory: 'PLUMA',
    weight: '30.5',
    academy: 'GRACIE BARRA PALMAS PR',
    professor: 'DIEGO BUSSOLARO',
    paymentStatus: 'pending',
  },
  {
    id: '0118',
    name: 'ARTHUR LIMA',
    age: 10,
    gender: 'M',
    category: 'INFANTIL A',
    belt: 'LARANJA',
    weightCategory: 'MÉDIO',
    weight: '42.0',
    academy: 'THE MATCH CHAMP',
    professor: 'CRYSTIAN DA CUNHA',
    paymentStatus: 'confirmed',
  },
]

type ViewMode = 'geral' | 'categoria-peso' | 'absoluto' | 'equipe'

interface RegisteredAthletesContentProps {
  eventId: string
}

export default function RegisteredAthletesContent({ eventId }: RegisteredAthletesContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('geral')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const athletesPerPage = 4
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [expandedProfessors, setExpandedProfessors] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    category: '',
    belt: '',
    weight: '',
    gender: '',
    academy: '',
    professor: '',
  })

  // Resetar página quando a busca mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  const getBeltColorClass = (belt: string) => {
    const beltColors: Record<string, string> = {
      'BRANCA': 'bg-gray-200 text-gray-800',
      'Branca': 'bg-gray-200 text-gray-800',
      'CINZA': 'bg-gray-500 text-white',
      'Cinza': 'bg-gray-500 text-white',
      'AMARELA': 'bg-yellow-400 text-black',
      'Amarela': 'bg-yellow-400 text-black',
      'LARANJA': 'bg-orange-500 text-white',
      'Laranja': 'bg-orange-500 text-white',
      'VERDE': 'bg-green-500 text-white',
      'Verde': 'bg-green-500 text-white',
      'AZUL': 'bg-blue-600 text-white',
      'Azul': 'bg-blue-600 text-white',
      'ROXA': 'bg-purple-600 text-white',
      'Roxa': 'bg-purple-600 text-white',
      'MARROM': 'bg-amber-800 text-white',
      'Marrom': 'bg-amber-800 text-white',
      'PRETA': 'bg-black text-white',
      'Preta': 'bg-black text-white',
    }
    return beltColors[belt] || 'bg-gray-400 text-white'
  }

  // Agrupar atletas por categoria de peso
  const groupByWeightCategory = (athletes: Athlete[]) => {
    const grouped: Record<string, Athlete[]> = {}
    athletes.forEach((athlete) => {
      const key = `${athlete.category} - ${athlete.belt} - ${athlete.weightCategory} - ${athlete.gender === 'M' ? 'MASCULINO' : 'FEMININO'}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(athlete)
    })
    return grouped
  }

  // Agrupar por equipe
  const groupByTeam = (athletes: Athlete[]) => {
    const grouped: Record<string, Athlete[]> = {}
    athletes.forEach((athlete) => {
      if (!grouped[athlete.academy]) {
        grouped[athlete.academy] = []
      }
      grouped[athlete.academy].push(athlete)
    })
    return grouped
  }

  // Agrupar por equipe e professor (para acordeão)
  const groupByTeamAndProfessor = (athletes: Athlete[]) => {
    const grouped: Record<string, Record<string, Athlete[]>> = {}
    athletes.forEach((athlete) => {
      if (!grouped[athlete.academy]) {
        grouped[athlete.academy] = {}
      }
      if (!grouped[athlete.academy][athlete.professor]) {
        grouped[athlete.academy][athlete.professor] = []
      }
      grouped[athlete.academy][athlete.professor].push(athlete)
    })
    return grouped
  }

  // Filtrar atletas
  const filteredAthletes = mockAthletes.filter((athlete) => {
    // Busca por texto
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (
        !athlete.name.toLowerCase().includes(searchLower) &&
        !athlete.academy.toLowerCase().includes(searchLower) &&
        !athlete.professor.toLowerCase().includes(searchLower) &&
        !athlete.category.toLowerCase().includes(searchLower) &&
        !athlete.belt.toLowerCase().includes(searchLower) &&
        !athlete.weightCategory.toLowerCase().includes(searchLower)
      ) {
        return false
      }
    }
    // Filtros específicos
    if (filters.category && !athlete.category.includes(filters.category)) return false
    if (filters.belt && !athlete.belt.includes(filters.belt)) return false
    if (filters.weight && !athlete.weightCategory.includes(filters.weight)) return false
    if (filters.gender && athlete.gender !== filters.gender) return false
    if (filters.academy && !athlete.academy.includes(filters.academy)) return false
    if (filters.professor && !athlete.professor.includes(filters.professor)) return false
    return true
  })

  // Toggle para expandir/colapsar equipe
  const toggleTeam = (team: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(team)) {
      newExpanded.delete(team)
      // Fechar todos os professores dessa equipe também
      const teamProfessors = Object.keys(groupByTeamAndProfessor(filteredAthletes)[team] || {})
      const newExpandedProfessors = new Set(expandedProfessors)
      teamProfessors.forEach(prof => {
        newExpandedProfessors.delete(`${team}-${prof}`)
      })
      setExpandedProfessors(newExpandedProfessors)
    } else {
      newExpanded.add(team)
    }
    setExpandedTeams(newExpanded)
  }

  // Toggle para expandir/colapsar professor
  const toggleProfessor = (team: string, professor: string) => {
    const key = `${team}-${professor}`
    const newExpanded = new Set(expandedProfessors)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedProfessors(newExpanded)
  }

  // Toggle para expandir/colapsar categoria de peso
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  // Preparar atletas para paginação baseado no modo
  let athletesForPagination: Athlete[] = []
  let totalPages = 1
  let startIndex = 0
  let endIndex = 0
  let paginatedAthletes: Athlete[] = []

  if (viewMode === 'geral') {
    athletesForPagination = filteredAthletes
  } else if (viewMode === 'absoluto') {
    athletesForPagination = filteredAthletes.filter((a) => a.absolute)
  } else if (viewMode === 'categoria-peso') {
    // Para categoria-peso, não precisamos paginar atletas, apenas categorias
    athletesForPagination = filteredAthletes
  } else if (viewMode === 'equipe') {
    const grouped = groupByTeamAndProfessor(filteredAthletes)
    athletesForPagination = Object.entries(grouped).flatMap(([_, professors]) => 
      Object.values(professors).flat()
    )
  }

  // Paginação
  if (viewMode === 'categoria-peso') {
    // Para categoria-peso, paginar as categorias (5 por página)
    const grouped = groupByWeightCategory(filteredAthletes)
    const filteredGroups = Object.entries(grouped).filter(([category, athletes]) => {
      if (filters.category && !category.includes(filters.category)) return false
      if (filters.belt && !category.includes(filters.belt)) return false
      if (filters.weight && !category.includes(filters.weight)) return false
      if (filters.gender) {
        const genderText = filters.gender === 'M' ? 'MASCULINO' : 'FEMININO'
        if (!category.includes(genderText)) return false
      }
      return true
    })
    const categoriesPerPage = 5
    totalPages = Math.ceil(filteredGroups.length / categoriesPerPage)
    startIndex = (currentPage - 1) * categoriesPerPage
    endIndex = startIndex + categoriesPerPage
    // Para categoria-peso, paginatedAthletes será usado apenas para verificar quais categorias mostrar
    paginatedAthletes = filteredAthletes // Todos os atletas para verificação
  } else {
    totalPages = Math.ceil(athletesForPagination.length / athletesPerPage)
    startIndex = (currentPage - 1) * athletesPerPage
    endIndex = startIndex + athletesPerPage
    paginatedAthletes = athletesForPagination.slice(startIndex, endIndex)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderAthleteCard = (athlete: Athlete, index: number) => (
    <div
      key={athlete.id}
      className="bg-gray-50/70 hover:bg-gray-100 rounded-xl p-6 flex items-center gap-5 border border-gray-200 transition-shadow hover:shadow-md"
    >
      <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
        {getInitials(athlete.name)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <p className="text-xl font-bold text-gray-800">{athlete.name.toUpperCase()}</p>
          {athlete.absolute && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              ABSOLUTO
            </span>
          )}
        </div>
        <p className="text-base font-medium text-gray-600 mb-1">
          {athlete.age ? `${athlete.age} anos • ` : ''}
          <span className={`px-3 py-1 rounded-full font-semibold text-xs ${getBeltColorClass(athlete.belt)}`}>
            {athlete.belt}
          </span>
          {' • '}
          {athlete.weight}kg
        </p>
        <p className="text-sm font-medium text-gray-500">{athlete.academy}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-gray-500 mb-2">ID: 0{athlete.id}</p>
        <p className={`${athlete.paymentStatus === 'confirmed' ? 'text-green-600' : 'text-red-600'} font-semibold text-sm flex items-center gap-2`}>
          {athlete.paymentStatus === 'confirmed' ? (
            <>
              <FiCheck size={18} />
              PAGAMENTO CONFIRMADO
            </>
          ) : (
            <>
              <FiAlertTriangle size={18} />
              PAGAMENTO PENDENTE
            </>
          )}
        </p>
      </div>
    </div>
  )

  return (
    <div className="w-full">
      {/* Título */}
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-3">
        ATLETAS INSCRITOS
      </h1>
      <p className="text-center text-lg text-gray-600 mb-10">
        Lista de atletas inscritos no evento
      </p>

      {/* Card Principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Abas Internas */}
        <div className="flex flex-wrap gap-0 border-b border-gray-200 bg-gray-50/70">
          <button
            onClick={() => {
              setViewMode('geral')
              setCurrentPage(1)
            }}
            className={`px-8 py-5 text-lg font-semibold flex items-center gap-3 transition ${
              viewMode === 'geral'
                ? 'bg-white border-b-4 border-orange-500 text-orange-600 font-bold shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiUsers size={20} />
            Geral
          </button>
          <button
            onClick={() => {
              setViewMode('categoria-peso')
              setCurrentPage(1)
            }}
            className={`px-8 py-5 text-lg font-semibold flex items-center gap-3 transition ${
              viewMode === 'categoria-peso'
                ? 'bg-white border-b-4 border-orange-500 text-orange-600 font-bold shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiActivity size={20} />
            Categoria de Peso
          </button>
          <button
            onClick={() => {
              setViewMode('absoluto')
              setCurrentPage(1)
            }}
            className={`px-8 py-5 text-lg font-semibold flex items-center gap-3 transition ${
              viewMode === 'absoluto'
                ? 'bg-white border-b-4 border-orange-500 text-orange-600 font-bold shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiZap size={20} />
            Absoluto Jiu-Jitsu
          </button>
          <button
            onClick={() => {
              setViewMode('equipe')
              setCurrentPage(1)
            }}
            className={`px-8 py-5 text-lg font-semibold flex items-center gap-3 transition ${
              viewMode === 'equipe'
                ? 'bg-white border-b-4 border-orange-500 text-orange-600 font-bold shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiShield size={20} />
            Equipe
          </button>
        </div>

        <div className="p-8 lg:p-12">
          {/* Busca */}
          <div className="relative max-w-2xl mx-auto mb-10">
            <FiSearch className="absolute left-5 top-5 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, academia, professor, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 border border-gray-300 rounded-xl text-lg focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          {/* Filtros (apenas para categoria-peso) */}
          {viewMode === 'categoria-peso' && (
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                >
                  <option value="">Sexo</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>
          )}

          {/* Lista de Atletas - baseado no modo de visualização */}
          {viewMode === 'geral' && (
            <div className="space-y-5 mb-8">
              {paginatedAthletes.map((athlete, index) => renderAthleteCard(athlete, startIndex + index))}
            </div>
          )}

          {viewMode === 'categoria-peso' && (() => {
            const grouped = groupByWeightCategory(filteredAthletes)
            const filteredGroups = Object.entries(grouped).filter(([category, athletes]) => {
              if (filters.category && !category.includes(filters.category)) return false
              if (filters.belt && !category.includes(filters.belt)) return false
              if (filters.weight && !category.includes(filters.weight)) return false
              if (filters.gender) {
                const genderText = filters.gender === 'M' ? 'MASCULINO' : 'FEMININO'
                if (!category.includes(genderText)) return false
              }
              return true
            })
            
            // Paginar categorias (5 por página)
            const categoriesPerPage = 5
            const startCategoryIndex = (currentPage - 1) * categoriesPerPage
            const endCategoryIndex = startCategoryIndex + categoriesPerPage
            const paginatedCategories = filteredGroups.slice(startCategoryIndex, endCategoryIndex)
            
            return (
              <div className="space-y-4 mb-8">
                {paginatedCategories.map(([category, athletes]) => {
                  const isCategoryExpanded = expandedCategories.has(category)
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      {/* Cabeçalho da Categoria */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                            {athletes[0]?.weightCategory?.substring(0, 2).toUpperCase() || 'KG'}
                          </div>
                          <div className="text-left">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">
                              {category}
                            </h3>
                            <p className="text-sm font-medium text-gray-600">
                              {athletes.length} {athletes.length === 1 ? 'atleta inscrito' : 'atletas inscritos'} • Até {athletes[0]?.weight || 'N/A'} KG
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {isCategoryExpanded ? (
                            <FiChevronUp className="w-5 h-5 text-gray-600" />
                          ) : (
                            <FiChevronDown className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                      </button>

                      {/* Conteúdo da Categoria (Acordeão) */}
                      {isCategoryExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50 p-6">
                          <div className="space-y-3">
                            {athletes.map((athlete, idx) => renderAthleteCard(athlete, idx))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {viewMode === 'absoluto' && (
            <div className="space-y-4 mb-8">
              {paginatedAthletes.map((athlete, index) => renderAthleteCard(athlete, startIndex + index))}
            </div>
          )}

          {viewMode === 'equipe' && (
            <div className="space-y-4 mb-8">
              {Object.entries(groupByTeamAndProfessor(filteredAthletes))
                .map(([team, professors]) => {
                  const totalAthletes = Object.values(professors).flat().length
                  const isTeamExpanded = expandedTeams.has(team)
                  
                  return (
                    <div key={team} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      {/* Cabeçalho da Equipe */}
                      <button
                        onClick={() => toggleTeam(team)}
                        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                            {getInitials(team)}
                          </div>
                          <div className="text-left">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">{team}</h3>
                            <p className="text-sm font-medium text-gray-600">
                              {totalAthletes} {totalAthletes === 1 ? 'atleta inscrito' : 'atletas inscritos'} • {Object.keys(professors).length} {Object.keys(professors).length === 1 ? 'professor' : 'professores'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {isTeamExpanded ? (
                            <FiChevronUp className="w-5 h-5 text-gray-600" />
                          ) : (
                            <FiChevronDown className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                      </button>

                      {/* Conteúdo da Equipe (Acordeão) */}
                      {isTeamExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          {Object.entries(professors).map(([professor, athletes]) => {
                            const professorKey = `${team}-${professor}`
                            const isProfessorExpanded = expandedProfessors.has(professorKey)
                            const visibleAthletes = athletes.filter((athlete) =>
                              paginatedAthletes.some((a) => a.id === athlete.id)
                            )
                            
                            if (visibleAthletes.length === 0 && athletes.length > 0) return null

                            return (
                              <div key={professorKey} className="border-b border-gray-200 last:border-b-0">
                                {/* Cabeçalho do Professor */}
                                <button
                                  onClick={() => toggleProfessor(team, professor)}
                                  className="w-full flex items-center justify-between p-5 hover:bg-gray-100 transition"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-base flex-shrink-0">
                                      {getInitials(professor)}
                                    </div>
                                    <div className="text-left">
                                      <h4 className="text-base font-semibold text-gray-800 mb-1">{professor}</h4>
                                      <p className="text-sm font-medium text-gray-600">
                                        {athletes.length} {athletes.length === 1 ? 'atleta' : 'atletas'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    {isProfessorExpanded ? (
                                      <FiChevronUp className="w-5 h-5 text-gray-500" />
                                    ) : (
                                      <FiChevronDown className="w-5 h-5 text-gray-500" />
                                    )}
                                  </div>
                                </button>

                                {/* Lista de Atletas do Professor */}
                                {isProfessorExpanded && visibleAthletes.length > 0 && (
                                  <div className="bg-white px-5 pb-5 space-y-3">
                                    {visibleAthletes.map((athlete, idx) => renderAthleteCard(athlete, idx))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}

          {/* Paginação - disponível em todas as abas */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="font-semibold text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          )}

          {/* Contador Final */}
          <div className="text-center mt-12 pt-10 border-t border-gray-200">
            <span className="text-6xl font-black text-orange-600">
              {athletesForPagination.length}
            </span>
            <p className="text-2xl text-gray-600 mt-2">
              atletas inscritos no evento
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

