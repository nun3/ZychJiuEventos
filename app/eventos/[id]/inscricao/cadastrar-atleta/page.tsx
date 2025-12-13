'use client'

import { useState } from 'react'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import NewAthleteModal from '@/components/Modals/NewAthleteModal'
import Link from 'next/link'
import { FiArrowLeft, FiUserPlus } from 'react-icons/fi'

export default function NewAthletePage({ params }: { params: { id: string } }) {
  const [isModalOpen, setIsModalOpen] = useState(false) // Não abre automaticamente

  const handleSubmit = (data: any) => {
    // Aqui você pode adicionar lógica para salvar o atleta e redirecionar para inscrição
    console.log('Dados do atleta:', data)
    // Após salvar, redirecionar para a página de inscrição do evento
    // window.location.href = `/eventos/${params.id}/inscricao`
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <ModernNavbar />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-10">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/eventos/${params.id}`}
              className="text-gray-600 hover:text-amber-600 flex items-center space-x-2 transition mb-6"
            >
              <FiArrowLeft />
              <span>voltar</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-800">
              CADASTRAR NOVO ATLETA
            </h1>
            <p className="text-center text-lg text-gray-600 mb-12">
              Preencha os dados do novo atleta. Após o cadastro, você poderá inscrevê-lo no evento.
            </p>
          </div>

          {/* Botão para abrir modal (caso o modal seja fechado) */}
          {!isModalOpen && (
            <div className="text-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-blue to-primary-accent text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all"
              >
                <FiUserPlus size={24} />
                Abrir Formulário de Cadastro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro de Atleta */}
      <NewAthleteModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        mode="create"
        showPasswordFields={false}
      />

      <ModernFooter />
    </main>
  )
}

