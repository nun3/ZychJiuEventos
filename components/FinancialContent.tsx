'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiFile, FiDownload, FiSearch, FiPrinter, FiUsers, FiX } from 'react-icons/fi'

interface FinancialContentProps {
  eventId: string
}

interface Boleto {
  numero: string
  valor: number
  vencimento: string
  situacao: 'Pendente' | 'Pago' | 'Vencido'
  atletas: string[]
}

export default function FinancialContent({ eventId }: FinancialContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cpf, setCpf] = useState('')
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Dados mockados de boletos
  const mockBoletos: Boleto[] = [
    {
      numero: '31226310143546844',
      valor: 70.0,
      vencimento: '03/12/2025',
      situacao: 'Pendente',
      atletas: ['Ana Clara Souza', 'Daniel Pereira'],
    },
    {
      numero: '31226310143906010',
      valor: 70.0,
      vencimento: '03/12/2025',
      situacao: 'Pendente',
      atletas: ['Julia Martins'],
    },
  ]

  const handleConsultar = () => {
    if (!cpf || cpf.length < 11) {
      return
    }
    setIsSearching(true)
    // Simular busca
    setTimeout(() => {
      setBoletos(mockBoletos)
      setIsSearching(false)
    }, 500)
  }

  const handleImprimir = (boletoNumero: string) => {
    // Implementar lógica de impressão
    console.log('Imprimir boleto:', boletoNumero)
    window.print()
  }

  const handleVerAtletas = (boletoNumero: string) => {
    // Implementar navegação para lista de atletas
    console.log('Ver atletas do boleto:', boletoNumero)
  }

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 uppercase">FINANCEIRO</h2>
        <p className="text-gray-600 mb-6 italic">
          Gerencie seus pagamentos e boletos relacionados a este evento.
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center space-x-2"
        >
          <FiFile />
          <span>EMITIR 2ª VIA DO BOLETO</span>
        </button>

        <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <FiFile className="mx-auto text-6xl text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Para emitir o boleto, você precisa estar inscrito no evento.
            </p>
            <Link
              href={`/eventos/${eventId}`}
              className="inline-block bg-primary-orange hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Fazer Inscrição
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Emitir 2ª Via do Boleto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Cabeçalho */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 uppercase">
                  EMITIR 2ª VIA DO BOLETO
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false)
                    setCpf('')
                    setBoletos([])
                  }}
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Mensagem de Atenção */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-gray-800">
                  <strong>ATENÇÃO:</strong> Boletos vencidos não são aceitos pelos bancos. Devem ser
                  solicitados uma nova via do boleto.
                </p>
              </div>

              {/* Campo CPF */}
              <div className="mb-6">
                <label className="block text-red-600 font-semibold mb-2">
                  CPF DO RESPONSÁVEL PELA INSCRIÇÃO
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="123.456.789-00"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    maxLength={14}
                  />
                  <button
                    onClick={handleConsultar}
                    disabled={!cpf || cpf.length < 14 || isSearching}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSearch size={20} />
                    <span>CONSULTAR</span>
                  </button>
                </div>
              </div>

              {/* Lista de Boletos */}
              {boletos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold italic text-cyan-600 mb-4">Boleto</h3>
                  {boletos.map((boleto, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Nº: </span>
                          <span className="text-gray-700">{boleto.numero}</span>
                        </div>
                        <div>
                          <span className="font-medium">Valor: </span>
                          <span className="text-gray-700">
                            R$ {boleto.valor.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Vencimento: </span>
                          <span className="text-gray-700">{boleto.vencimento}</span>
                        </div>
                        <div>
                          <span className="font-medium">Situação: </span>
                          <span className="text-red-600">{boleto.situacao}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleImprimir(boleto.numero)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2 text-sm"
                        >
                          <FiPrinter size={16} />
                          <span>IMPRIMIR</span>
                        </button>
                        <button
                          onClick={() => handleVerAtletas(boleto.numero)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2 text-sm"
                        >
                          <FiUsers size={16} />
                          <span>ATLETAS</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão Fechar */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setIsModalOpen(false)
                    setCpf('')
                    setBoletos([])
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition"
                >
                  fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

