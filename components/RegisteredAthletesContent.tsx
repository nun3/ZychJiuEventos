'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  FiUsers, FiSearch, FiCheck, FiAlertTriangle, 
  FiActivity, FiZap, FiShield, FiChevronDown, FiChevronUp, FiX
} from 'react-icons/fi'

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
  const athletesPerPage = 8
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [expandedProfessors, setExpandedProfessors] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [activeProfessor, setActiveProfessor] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  const [filters, setFilters] = useState({
    category: '',
    belt: '',
    weight: '',
    gender: '',
    academy: '',
    professor: '',
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  // --- Funções Auxiliares (Cores e Agrupamentos) ---

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

  const groupByWeightCategory = (athletes: Athlete[]) => {
    const grouped: Record<string, Athlete[]> = {}
    athletes.forEach((athlete) => {
      const key = `${athlete.category} • ${athlete.belt} • ${athlete.weightCategory} • ${athlete.gender === 'M' ? 'MASC' : 'FEM'}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(athlete)
    })
    return grouped
  }

  const groupByTeamAndProfessor = (athletes: Athlete[]) => {
    const grouped: Record<string, Record<string, Athlete[]>> = {}
    athletes.forEach((athlete) => {
      if (!grouped[athlete.academy]) grouped[athlete.academy] = {}
      if (!grouped[athlete.academy][athlete.professor]) grouped[athlete.academy][athlete.professor] = []
      grouped[athlete.academy][athlete.professor].push(athlete)
    })
    return grouped
  }

  // --- Lógica de Filtro ---
  const filteredAthletes = mockAthletes.filter((athlete) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (
        !athlete.name.toLowerCase().includes(searchLower) &&
        !athlete.academy.toLowerCase().includes(searchLower) &&
        !athlete.professor.toLowerCase().includes(searchLower) &&
        !athlete.category.toLowerCase().includes(searchLower)
      ) {
        return false
      }
    }
    if (filters.category && !athlete.category.includes(filters.category)) return false
    if (filters.belt && !athlete.belt.includes(filters.belt)) return false
    if (filters.weight && !athlete.weightCategory.includes(filters.weight)) return false
    if (filters.gender && athlete.gender !== filters.gender) return false
    return true
  })

  // Auto-selecionar o primeiro professor quando o modal abrir
  useEffect(() => {
    if (selectedTeam) {
      const teamData = groupByTeamAndProfessor(filteredAthletes)[selectedTeam]
      if (teamData) {
        const professorsList = Object.keys(teamData)
        if (professorsList.length > 0) {
          setActiveProfessor(professorsList[0])
        }
      }
    } else {
      setActiveProfessor(null)
    }
  }, [selectedTeam, filteredAthletes])

  // --- Toggles ---
  const toggleTeam = (team: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(team)) {
      newExpanded.delete(team)
    } else {
      newExpanded.add(team)
    }
    setExpandedTeams(newExpanded)
  }

  const toggleProfessor = (team: string, professor: string) => {
    const key = `${team}-${professor}`
    const newExpanded = new Set(expandedProfessors)
    if (newExpanded.has(key)) newExpanded.delete(key)
    else newExpanded.add(key)
    setExpandedProfessors(newExpanded)
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) newExpanded.delete(category)
    else newExpanded.add(category)
    setExpandedCategories(newExpanded)
  }

  // --- Paginação Logic ---
  let athletesForPagination: Athlete[] = []
  
  if (viewMode === 'geral') athletesForPagination = filteredAthletes
  else if (viewMode === 'absoluto') athletesForPagination = filteredAthletes.filter((a) => a.absolute)
  else if (viewMode === 'equipe') {
    const grouped = groupByTeamAndProfessor(filteredAthletes)
    athletesForPagination = Object.values(grouped).flatMap(professors => Object.values(professors).flat())
  }
  else if (viewMode === 'categoria-peso') athletesForPagination = filteredAthletes

  // Helper para iniciais
  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  // --- RENDERIZAÇÃO DO CARD (Otimizado / High Density) ---
  const renderAthleteCard = (athlete: Athlete, index: number) => (
    <div
      key={athlete.id}
      className="bg-white hover:bg-gray-50 rounded-lg p-3 flex items-center gap-3 border border-gray-200 transition-colors group"
    >
      {/* Avatar Compacto */}
      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-blue-100">
        {getInitials(athlete.name)}
      </div>

      {/* Informações Principais */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">{athlete.name}</p>
          {athlete.absolute && (
            <span className="bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
              Absoluto
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          <span>{athlete.age} anos</span>
          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
          <span className={`px-1.5 rounded text-[10px] font-medium ${getBeltColorClass(athlete.belt)}`}>
            {athlete.belt}
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
          <span>{athlete.weight}kg</span>
          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
          <span className="truncate max-w-[150px]">{athlete.academy}</span>
        </div>
      </div>

      {/* Status e ID */}
      <div className="text-right flex flex-col items-end gap-1">
        <span className="text-[10px] font-mono text-gray-400">#{athlete.id}</span>
        {athlete.paymentStatus === 'confirmed' ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
            <FiCheck size={10} /> PAGO
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            <FiAlertTriangle size={10} /> PENDENTE
          </span>
        )}
      </div>
    </div>
  )

  // Paginação Calculations
  let paginatedAthletes: Athlete[] = []
  let totalPages = 1
  let startIndex = 0
  
  const itemsPerPage = viewMode === 'categoria-peso' ? 5 : athletesPerPage
  const listToPaginate = viewMode === 'categoria-peso' 
    ? Object.entries(groupByWeightCategory(filteredAthletes))
    : athletesForPagination
  
  totalPages = Math.ceil(listToPaginate.length / itemsPerPage)
  startIndex = (currentPage - 1) * itemsPerPage
  
  const currentItems = listToPaginate.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* --- ABAS (Compactas) --- */}
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50/50">
          {[
            { id: 'geral', icon: FiUsers, label: 'Geral' },
            { id: 'categoria-peso', icon: FiActivity, label: 'Categoria' },
            { id: 'absoluto', icon: FiZap, label: 'Absoluto' },
            { id: 'equipe', icon: FiShield, label: 'Equipes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setViewMode(tab.id as ViewMode); setCurrentPage(1); }}
              className={`px-5 py-3 text-base font-medium flex items-center gap-2 transition whitespace-nowrap ${
                viewMode === tab.id
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- CONTEÚDO --- */}
        <div className="p-4 md:p-6">
          
          {/* Busca e Filtros Compactos */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar atleta, equipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 h-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            
            {/* Filtros Dropdown (Simplificado visualmente) */}
            {viewMode === 'categoria-peso' && (
              <div className="flex gap-2">
                <select 
                  className="h-10 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                  onChange={(e) => setFilters({...filters, belt: e.target.value})}
                >
                  <option value="">Todas Faixas</option>
                  <option value="Branca">Branca</option>
                  <option value="Azul">Azul</option>
                  <option value="Roxa">Roxa</option>
                </select>
                <select 
                  className="h-10 pl-3 pr-8 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="">Todas Categorias</option>
                  <option value="Infantil">Infantil</option>
                  <option value="Pré-Mirim">Pré-Mirim</option>
                  <option value="Master">Master</option>
                </select>
              </div>
            )}
          </div>

          {/* LISTAS */}
          
          {/* 1. MODO GERAL & ABSOLUTO - Grid de Cards */}
          {(viewMode === 'geral' || viewMode === 'absoluto') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(currentItems as Athlete[]).map((athlete, index) => (
                <div
                  key={athlete.id}
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  {/* Avatar e Nome */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-blue-100">
                      {getInitials(athlete.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {athlete.name}
                      </p>
                      {athlete.absolute && (
                        <span className="inline-block mt-0.5 bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                          Absoluto
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações Compactas */}
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-600">
                    <span>{athlete.age} anos</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getBeltColorClass(athlete.belt)}`}>
                      {athlete.belt}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{athlete.weight}kg</span>
                  </div>

                  {/* Academia (truncada) */}
                  <p className="text-xs text-gray-500 truncate mb-2">
                    {athlete.academy}
                  </p>

                  {/* Status de Pagamento e ID */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-mono text-gray-400">#{athlete.id}</span>
                    {athlete.paymentStatus === 'confirmed' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                        <FiCheck size={10} /> PAGO
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        <FiAlertTriangle size={10} /> PENDENTE
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. MODO CATEGORIA (Acordeão com Grid de Cards) */}
          {viewMode === 'categoria-peso' && (
            <div className="space-y-3">
              {(currentItems as [string, Athlete[]][]).map(([category, athletes]) => {
                const isExpanded = expandedCategories.has(category)
                return (
                  <div key={category} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">
                          {athletes[0]?.weightCategory?.substring(0, 2).toUpperCase() || 'KG'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-800 uppercase">{category}</h3>
                          <p className="text-xs text-gray-500">{athletes.length} atletas</p>
                        </div>
                      </div>
                      {isExpanded ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
                    </button>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                          {athletes.map((athlete) => (
                            <div
                              key={athlete.id}
                              className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                            >
                              {/* Avatar e Nome */}
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-blue-100">
                                  {getInitials(athlete.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {athlete.name}
                                  </p>
                                </div>
                              </div>

                              {/* Informações Compactas */}
                              <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-600">
                                <span>{athlete.age} anos</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getBeltColorClass(athlete.belt)}`}>
                                  {athlete.belt}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>{athlete.weight}kg</span>
                              </div>

                              {/* Academia (truncada) */}
                              <p className="text-xs text-gray-500 truncate mb-2">
                                {athlete.academy}
                              </p>

                              {/* Status de Pagamento e ID */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-[10px] font-mono text-gray-400">#{athlete.id}</span>
                                {athlete.paymentStatus === 'confirmed' ? (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                    <FiCheck size={10} /> PAGO
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                    <FiAlertTriangle size={10} /> PENDENTE
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 3. MODO EQUIPE (Grid de Escudos) */}
          {viewMode === 'equipe' && (
            <>
              {/* Grid de Escudos das Escolas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                {Object.entries(groupByTeamAndProfessor(filteredAthletes))
                  .map(([team, professors]) => {
                    const totalAthletes = Object.values(professors).flat().length
                    const totalProfessors = Object.keys(professors).length
                    
                    return (
                      <button
                        key={team}
                        onClick={() => setSelectedTeam(team)}
                        className="group relative bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-primary-blue hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center aspect-square"
                      >
                        {/* Escudo da Escola */}
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary-blue to-blue-700 text-white flex items-center justify-center font-bold text-2xl md:text-3xl mb-3 group-hover:scale-110 transition-transform duration-200 shadow-md">
                          {getInitials(team)}
                        </div>
                        
                        {/* Nome da Escola (truncado) */}
                        <h3 className="text-sm md:text-base font-bold text-gray-800 text-center mb-1 line-clamp-2 group-hover:text-primary-blue transition-colors">
                          {team}
                        </h3>
                        
                        {/* Estatísticas */}
                        <div className="text-xs text-gray-600 text-center mt-1">
                          <p className="font-semibold">{totalAthletes} {totalAthletes === 1 ? 'atleta' : 'atletas'}</p>
                          <p className="text-gray-500">{totalProfessors} {totalProfessors === 1 ? 'professor' : 'professores'}</p>
                        </div>
                      </button>
                    )
                  })}
              </div>

              {/* Modal de Detalhes da Equipe (Portalizado) */}
              {mounted && selectedTeam && createPortal(
                (() => {
                  const teamData = groupByTeamAndProfessor(filteredAthletes)[selectedTeam]
                  if (!teamData) return null
                  const allTeamAthletes = Object.values(teamData).flat()

                  return (
                    <div className="fixed inset-0 z-[9999] overflow-y-auto">
                      {/* 1. Wrapper de Scroll */}
                      <div className="flex min-h-full items-center justify-center p-4">
                        
                        {/* 2. Overlay Escuro */}
                        <div 
                          className="fixed inset-0 bg-black/60 transition-opacity"
                          onClick={() => setSelectedTeam(null)}
                        />

                        {/* 3. Card do Modal (Sem max-h fixo, deixa o wrapper rolar) */}
                        <div 
                          className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden my-8" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          
                          {/* Header do Modal */}
                          <div className="flex items-center justify-between border-b border-gray-200 bg-[#0C3049] px-6 py-4 text-white flex-shrink-0">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl">
                                {getInitials(selectedTeam)}
                              </div>
                              <div>
                                <h2 className="text-2xl font-bold">{selectedTeam}</h2>
                                <p className="text-sm text-blue-100">
                                  {allTeamAthletes.length} {allTeamAthletes.length === 1 ? 'atleta inscrito' : 'atletas inscritos'} • {Object.keys(teamData).length} {Object.keys(teamData).length === 1 ? 'professor' : 'professores'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedTeam(null)}
                              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                              aria-label="Fechar"
                            >
                              <FiX className="w-6 h-6" />
                            </button>
                          </div>

                          {/* Conteúdo Master-Detail */}
                          <div className="p-6 bg-gray-50">
                            {/* MASTER SECTION: Grid de Professores */}
                            <div className="mb-8">
                              <h3 className="text-lg font-bold text-gray-800 mb-4">Professores</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.keys(teamData).map((prof) => {
                                  const profAthletes = teamData[prof] || []
                                  const isActive = activeProfessor === prof
                                  
                                  return (
                                    <button
                                      key={prof}
                                      onClick={() => setActiveProfessor(prof)}
                                      className={`relative p-4 rounded-xl border text-left transition-all ${
                                        isActive
                                          ? 'bg-white border-blue-500 ring-2 ring-blue-500 shadow-md'
                                          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-base flex-shrink-0 ${
                                          isActive 
                                            ? 'bg-primary-blue text-white' 
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                          {getInitials(prof)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className={`text-sm font-bold truncate ${
                                            isActive ? 'text-primary-blue' : 'text-gray-800'
                                          }`}>
                                            {prof}
                                          </h4>
                                          <p className="text-xs text-gray-600 mt-0.5">
                                            {profAthletes.length} {profAthletes.length === 1 ? 'atleta' : 'atletas'}
                                          </p>
                                        </div>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* DETAIL SECTION: Grid de Atletas do Professor Selecionado */}
                            {activeProfessor && teamData[activeProfessor] && teamData[activeProfessor].length > 0 && (
                              <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                  Atletas de {activeProfessor}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {teamData[activeProfessor].map((athlete) => (
                                    <div
                                      key={athlete.id}
                                      className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                                    >
                                      {/* Avatar e Nome */}
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-blue-100">
                                          {getInitials(athlete.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-gray-900 truncate">
                                            {athlete.name}
                                          </p>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getBeltColorClass(athlete.belt)}`}>
                                              {athlete.belt}
                                            </span>
                                            <span className="text-[10px] text-gray-500">•</span>
                                            <span className="text-[10px] text-gray-600">{athlete.weight}kg</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Status de Pagamento */}
                                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                        <span className="text-[10px] font-mono text-gray-400">#{athlete.id}</span>
                                        {athlete.paymentStatus === 'confirmed' ? (
                                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                            <FiCheck size={10} /> PAGO
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                            <FiAlertTriangle size={10} /> PENDENTE
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Mensagem quando nenhum professor está selecionado */}
                            {!activeProfessor && (
                              <div className="text-center py-12 text-gray-500">
                                <p className="text-sm">Selecione um professor para ver os atletas</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })(),
                document.body
              )}
            </>
          )}

          {/* Paginação Compacta */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {/* Footer Informativo */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-400">
              Total de <span className="font-bold text-gray-700">{athletesForPagination.length}</span> registros encontrados
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
