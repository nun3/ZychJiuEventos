'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiX, FiSearch, FiPlus, FiEdit2, FiCheck } from 'react-icons/fi'
import Link from 'next/link'

interface Athlete {
  id: number
  name: string
  age: number
  gender: 'M' | 'F'
  academy: string
  belt: string
  weight: string
  isRegistered?: boolean
}

interface AthleteSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  athletes: Athlete[]
  eventId: string
  onConfirmSelection: (selectedIds: number[]) => void
}

export default function AthleteSelectionModal({
  isOpen,
  onClose,
  athletes,
  eventId,
  onConfirmSelection,
}: AthleteSelectionModalProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAthletes, setSelectedAthletes] = useState<number[]>([])
  const [expandedAthlete, setExpandedAthlete] = useState<number | null>(null)

  if (!isOpen) return null

  const filteredAthletes = athletes.filter((athlete) =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectAll = () => {
    if (selectedAthletes.length === filteredAthletes.length) {
      setSelectedAthletes([])
    } else {
      setSelectedAthletes(filteredAthletes.map((a) => a.id))
    }
  }

  const handleToggleAthlete = (athleteId: number) => {
    setSelectedAthletes((prev) =>
      prev.includes(athleteId)
        ? prev.filter((id) => id !== athleteId)
        : [...prev, athleteId]
    )
  }

  const handleConfirm = () => {
    if (selectedAthletes.length > 0) {
      onConfirmSelection(selectedAthletes)
      onClose()
      // Redirecionar para a página de confirmação
      router.push(`/eventos/${eventId}/inscricao/atletas/confirmar`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Selecionar Atletas
              </h2>
              <p className="text-sm text-gray-600">
                <span className="text-primary-red underline">
                  {athletes.length} atletas cadastrados
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              <FiX />
            </button>
          </div>

          {/* Search and Actions */}
          <div className="mt-4 flex gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Nome do Atleta"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange"
              />
            </div>
            <Link
              href={`/eventos/${eventId}/inscricao/cadastrar-atleta`}
              className="bg-primary-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition flex items-center space-x-2"
            >
              <FiPlus />
              <span>Novo Atleta</span>
            </Link>
          </div>
        </div>

        {/* Athlete List */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Select All */}
          <div className="mb-4 pb-4 border-b">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAthletes.length === filteredAthletes.length && filteredAthletes.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 text-primary-red focus:ring-primary-red rounded"
              />
              <span className="font-medium text-gray-700">Todos</span>
            </label>
          </div>

          {/* Athlete Items */}
          <div className="space-y-3">
            {filteredAthletes.map((athlete) => {
              const isSelected = selectedAthletes.includes(athlete.id)
              const isExpanded = expandedAthlete === athlete.id

              return (
                <div
                  key={athlete.id}
                  className={`border-2 rounded-lg p-4 transition ${
                    isSelected
                      ? 'border-primary-red bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleAthlete(athlete.id)}
                      className="mt-1 w-5 h-5 text-primary-red focus:ring-primary-red rounded"
                    />

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-500 text-xl">👤</span>
                    </div>

                    {/* Athlete Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-bold text-gray-800">
                          {athlete.name.toUpperCase()}, {athlete.age} anos
                        </h3>
                        <span
                          className={`text-sm ${
                            athlete.gender === 'M' ? 'text-blue-600' : 'text-red-600'
                          }`}
                        >
                          {athlete.gender === 'M' ? '♂' : '♀'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {athlete.academy}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Faixa: {athlete.belt}</span>
                        <span>Peso: {athlete.weight} kg</span>
                      </div>

                      {/* Status de Inscrito */}
                      {athlete.isRegistered && (
                        <div className="mt-2 flex items-center space-x-2 text-green-600">
                          <FiCheck />
                          <span className="text-sm font-medium">Inscrito</span>
                          <span className="text-xs text-gray-500">Nova Inscrição</span>
                        </div>
                      )}

                      {/* Opções quando selecionado */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <FiCheck className="text-green-600" />
                            <span className="text-sm font-medium text-green-600">Atleta Selecionado</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition text-center"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => {
                                // Aqui você redirecionaria para editar o cadastro
                                console.log('Alterar cadastro do atleta:', athlete.id)
                              }}
                              className="flex-1 bg-primary-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center space-x-2"
                            >
                              <FiEdit2 />
                              <span>Alterar Cadastro</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={handleConfirm}
            className="bg-primary-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Confirma Seleção
          </button>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 font-medium py-3 px-6"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

