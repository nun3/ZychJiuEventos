'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { getEventById, saveEvent } from '@/lib/eventStorage'

export default function RegulamentoPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [regulamento, setRegulamento] = useState('')

  useEffect(() => {
    const authStatus = 'true' // A autorização é validada pelo middleware.
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      
      const id = parseInt(eventId)
      if (!isNaN(id)) {
        const stored = getEventById(id)
        if (stored) {
          setEventData({
            id: stored.id,
            title: stored.titulo,
          })
          // Carregar regulamento se existir
          setRegulamento(stored.regrasFiscalizacao || '')
        }
      }
      
      setIsLoading(false)
    } else {
      router.push('/admin/autenticacao')
    }
  }, [router, eventId])

  const handleSave = () => {
    const id = parseInt(eventId)
    if (!isNaN(id)) {
      const stored = getEventById(id)
      if (stored) {
        saveEvent({
          ...stored,
          regrasFiscalizacao: regulamento,
        })
        alert('Regulamento salvo com sucesso!')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0C3049] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm -mt-44 pt-44">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/admin/eventos/${eventId}/gerenciar`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#0C3049] transition-colors"
            >
              <FiArrowLeft size={20} />
              <span className="font-semibold">Voltar para Gestão</span>
            </Link>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-wide">
            Regulamento
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
              Regulamento e Regras do Evento
            </label>
            <textarea
              value={regulamento}
              onChange={(e) => setRegulamento(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
              placeholder="Digite o regulamento e as regras do evento aqui..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0C3049] to-blue-800 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition"
            >
              <FiSave size={20} />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
