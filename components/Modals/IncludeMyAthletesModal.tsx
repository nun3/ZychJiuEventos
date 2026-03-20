'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiSearch, FiCheck } from 'react-icons/fi'

// Dados mockados - futuramente virá de /dashboard/meus-atletas
const mockMyAthletes = [
  {
    id: 101,
    name: 'Ágata Gordiani',
    age: 9,
    gender: 'F' as const,
    academy: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '35.00',
  },
  {
    id: 102,
    name: 'Benjamín Grobe de Almeida',
    age: 8,
    gender: 'M' as const,
    academy: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '40.80',
  },
  {
    id: 103,
    name: 'Caetano Dall Acqua',
    age: 10,
    gender: 'M' as const,
    academy: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '46.00',
  },
  {
    id: 104,
    name: 'Catarina Lourenço Basso',
    age: 7,
    gender: 'F' as const,
    academy: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '32.00',
  },
  {
    id: 105,
    name: 'Pietro Gabriel dos Santos',
    age: 16,
    gender: 'M' as const,
    academy: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '72.00',
  },
  {
    id: 106,
    name: 'Rebeca Andrettta Klaus',
    age: 15,
    gender: 'F' as const,
    academy: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '46.00',
  },
  {
    id: 107,
    name: 'Theo Henrique Fernandes',
    age: 9,
    gender: 'M' as const,
    academy: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '29.00',
  },
  {
    id: 108,
    name: 'Valentino G. V. Bernardi',
    age: 10,
    gender: 'M' as const,
    academy: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '27.00',
  },
]

interface Athlete {
  id: number
  name: string
  age: number
  gender: 'M' | 'F'
  academy: string
  coach: string
  belt: string
  weight: string
}

interface IncludeMyAthletesModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (selectedAthletes: Athlete[]) => void
  alreadySelectedIds?: number[]
}

export default function IncludeMyAthletesModal({
  open,
  onClose,
  onConfirm,
  alreadySelectedIds = [],
}: IncludeMyAthletesModalProps) {
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      setSearchTerm('')
      setSelectedIds([])
    }
  }, [open])

  if (!mounted || !open) return null

  const filteredAthletes = mockMyAthletes.filter(
    (athlete) =>
      athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.belt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.weight.includes(searchTerm)
  )

  const availableAthletes = filteredAthletes.filter(
    (athlete) => !alreadySelectedIds.includes(athlete.id)
  )

  const handleToggleAthlete = (athleteId: number) => {
    setSelectedIds((prev) =>
      prev.includes(athleteId)
        ? prev.filter((id) => id !== athleteId)
        : [...prev, athleteId]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === availableAthletes.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(availableAthletes.map((a) => a.id))
    }
  }

  const handleConfirm = () => {
    const selectedAthletes = mockMyAthletes.filter((athlete) =>
      selectedIds.includes(athlete.id)
    )
    onConfirm(selectedAthletes)
    onClose()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Overlay Escuro */}
        <div
          className="fixed inset-0 bg-black/60 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Card do Modal */}
        <div
          className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#0C3049] to-blue-800 px-6 py-4 text-white">
            <div>
              <h2 className="text-xl font-bold">Incluir Meus Atletas</h2>
              <p className="text-sm text-blue-100 mt-1">
                Selecione os atletas já cadastrados no seu perfil
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Busca */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome, faixa ou peso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition"
              />
            </div>
          </div>

          {/* Lista de Atletas */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
            {availableAthletes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchTerm
                    ? 'Nenhum atleta encontrado com essa busca'
                    : 'Todos os seus atletas já foram selecionados'}
                </p>
              </div>
            ) : (
              <>
                {/* Selecionar Todos */}
                <div className="mb-4 pb-4 border-b">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === availableAthletes.length &&
                        availableAthletes.length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-primary-blue rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-700">
                      Selecionar Todos ({availableAthletes.length} disponíveis)
                    </span>
                  </label>
                </div>

                {/* Grid de Atletas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {availableAthletes.map((athlete) => {
                    const isSelected = selectedIds.includes(athlete.id)

                    return (
                      <label
                        key={athlete.id}
                        className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-blue-500 ring-2 ring-blue-500 shadow-md'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="p-2.5">
                          {/* Checkbox */}
                          <div className="absolute top-1.5 right-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleAthlete(athlete.id)}
                              className="w-4 h-4 text-primary-blue rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Avatar */}
                          <div className="flex justify-center mb-2">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                                isSelected
                                  ? 'bg-primary-blue text-white'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {getInitials(athlete.name)}
                            </div>
                          </div>

                          {/* Nome */}
                          <h3
                            className={`text-center font-semibold mb-1.5 text-xs leading-tight line-clamp-2 ${
                              isSelected ? 'text-primary-blue' : 'text-gray-900'
                            }`}
                          >
                            {athlete.name}
                          </h3>

                          {/* Informações */}
                          <div className="space-y-1 text-center">
                            <p className="text-[10px] text-gray-600">{athlete.age} anos</p>
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getBeltColorClass(
                                  athlete.belt
                                )}`}
                              >
                                {athlete.belt}
                              </span>
                              <span className="text-[10px] text-gray-500">•</span>
                              <span className="text-[10px] text-gray-600">{athlete.weight}kg</span>
                            </div>
                            <p className="text-[10px] text-gray-500 truncate mt-1">
                              {athlete.academy}
                            </p>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-primary-blue">{selectedIds.length}</span> atleta(s)
              selecionado(s)
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedIds.length === 0}
                className="px-6 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FiCheck size={18} />
                Incluir Selecionados
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

