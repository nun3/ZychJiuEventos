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
    <div className="space-y-5">

      <div className="space-y-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-blue hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition flex items-center space-x-2 text-base"
        >
          <FiFile size={22} />
          <span>EMITIR 2ª VIA DO BOLETO</span>
        </button>

        <div className="bg-gray-50 p-5 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <FiFile className="mx-auto text-4xl text-gray-400 mb-2" />
            <p className="text-base text-gray-600 mb-2">
              Para emitir o boleto, você precisa estar inscrito no evento.
            </p>
            <Link
              href={`/eventos/${eventId}`}
              className="inline-block bg-primary-blue hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition text-base"
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
            <div className="p-5">
              {/* Cabeçalho */}
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 uppercase">
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
                  <FiX size={22} />
                </button>
              </div>

              {/* Mensagem de Atenção */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-5">
                <p className="text-base text-gray-800">
                  <strong className="uppercase">ATENÇÃO:</strong> Boletos vencidos não são aceitos pelos bancos. Devem ser
                  solicitados uma nova via do boleto.
                </p>
              </div>

              {/* Campo CPF */}
              <div className="mb-5">
                <label className="block text-base text-primary-blue font-semibold mb-2 uppercase">
                  CPF DO RESPONSÁVEL PELA INSCRIÇÃO
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="123.456.789-00"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                    maxLength={14}
                  />
                  <button
                    onClick={handleConsultar}
                    disabled={!cpf || cpf.length < 14 || isSearching}
                    className="bg-primary-blue hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSearch size={18} />
                    <span>CONSULTAR</span>
                  </button>
                </div>
              </div>

              {/* Lista de Boletos */}
              {boletos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-cyan-600 mb-2 uppercase">Boleto</h3>
                  {boletos.map((boleto, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 space-y-2.5"
                    >
                      <div className="grid grid-cols-2 gap-2 text-base">
                        <div>
                          <span className="font-medium uppercase">Nº: </span>
                          <span className="text-gray-700">{boleto.numero}</span>
                        </div>
                        <div>
                          <span className="font-medium uppercase">Valor: </span>
                          <span className="text-gray-700">
                            R$ {boleto.valor.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium uppercase">Vencimento: </span>
                          <span className="text-gray-700">{boleto.vencimento}</span>
                        </div>
                        <div>
                          <span className="font-medium uppercase">Situação: </span>
                          <span className={boleto.situacao === 'Pago' ? 'text-green-600' : 'text-red-600'}>{boleto.situacao}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleImprimir(boleto.numero)}
                          className="bg-primary-blue hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition flex items-center gap-2 text-xs"
                        >
                          <FiPrinter size={14} />
                          <span>IMPRIMIR</span>
                        </button>
                        <button
                          onClick={() => handleVerAtletas(boleto.numero)}
                          className="bg-primary-blue hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition flex items-center gap-2 text-xs"
                        >
                          <FiUsers size={14} />
                          <span>ATLETAS</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão Fechar */}
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => {
                    setIsModalOpen(false)
                    setCpf('')
                    setBoletos([])
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-5 rounded-lg transition"
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

