'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, MapPin, Mail, Lock, Users, Award } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface NewAthleteModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (data: any) => void
  mode?: 'create' | 'edit'
  showPasswordFields?: boolean
  initialData?: any // Dados iniciais para edição
  registerType?: 'atleta' | 'organizador' | 'responsavel' // Tipo de cadastro
}

export default function NewAthleteModal({
  open,
  onClose,
  onSubmit,
  mode = 'create',
  showPasswordFields = false,
  initialData,
  registerType = 'atleta',
}: NewAthleteModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [activeSection, setActiveSection] = useState<'dados' | 'endereco' | 'esporte' | 'responsavel' | 'organizacao'>('dados')

  // Resetar seção ativa quando o tipo de registro mudar
  useEffect(() => {
    if (open) {
      setActiveSection('dados')
    }
  }, [open, registerType])
  
  // Inicializar formData com dados iniciais se estiver editando
  const getInitialFormData = () => {
    if (mode === 'edit' && initialData) {
      return {
        nomeCompleto: initialData.name || '',
        cpf: initialData.cpf || '',
        dataNascimento: initialData.birthDate || '',
        sexo: initialData.gender === 'F' ? 'Feminino' : initialData.gender === 'M' ? 'Masculino' : '',
        necessidadeEspecial: initialData.specialNeeds ? 'Sim' : 'Não',
        cep: initialData.cep || '',
        estado: initialData.estado || '',
        cidade: initialData.cidade || '',
        bairro: initialData.bairro || '',
        endereco: initialData.endereco || '',
        complemento: initialData.complemento || '',
        email: initialData.email || '',
        celular: initialData.celular || '',
        equipe: initialData.team || '',
        professor: initialData.coach || '',
        esporte: initialData.sport || 'Jiu-Jitsu',
        graduacao: initialData.belt || '',
        peso: initialData.weight || '',
        altura: initialData.altura || '',
        nomeResponsavel: initialData.nomeResponsavel || '',
        telefoneResponsavel: initialData.telefoneResponsavel || '',
        senha: '',
        confirmarSenha: '',
      }
    }
    return {
      nomeCompleto: '',
      cpf: '',
      dataNascimento: '',
      sexo: '',
      necessidadeEspecial: 'Não',
      cep: '',
      estado: '',
      cidade: '',
      bairro: '',
      endereco: '',
      complemento: '',
      email: '',
      celular: '',
      equipe: '',
      professor: '',
      esporte: 'Jiu-Jitsu',
      graduacao: '',
      peso: '',
      altura: '',
      nomeResponsavel: '',
      telefoneResponsavel: '',
      senha: '',
      confirmarSenha: '',
    }
  }

  const [formData, setFormData] = useState(getInitialFormData())

  // Atualizar formData quando o modal abrir ou initialData mudar
  useEffect(() => {
    if (open && mode === 'edit' && initialData) {
      setFormData(getInitialFormData())
    } else if (open && mode === 'create') {
      // Resetar formulário quando abrir para criar novo
      setFormData({
        nomeCompleto: '',
        cpf: '',
        dataNascimento: '',
        sexo: '',
        necessidadeEspecial: 'Não',
        cep: '',
        estado: '',
        cidade: '',
        bairro: '',
        endereco: '',
        complemento: '',
        email: '',
        celular: '',
        equipe: '',
        professor: '',
        esporte: 'Jiu-Jitsu',
        graduacao: '',
        peso: '',
        altura: '',
        nomeResponsavel: '',
        telefoneResponsavel: '',
        senha: '',
        confirmarSenha: '',
      })
    }
  }, [open, mode, initialData])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(formData)
    }
    onClose()
  }

  // Definir seções baseado no tipo de registro
  const getSections = () => {
    const baseSections = [
      { id: 'dados', label: 'Dados Básicos', icon: User },
      { id: 'endereco', label: 'Endereço', icon: MapPin },
    ]

    if (registerType === 'atleta') {
      return [
        ...baseSections,
        { id: 'esporte', label: 'Esporte', icon: Award },
        { id: 'responsavel', label: 'Responsável', icon: Users },
      ]
    } else if (registerType === 'organizador') {
      return [
        ...baseSections,
        { id: 'organizacao', label: 'Organização', icon: Award },
      ]
    } else {
      // Responsável
      return baseSections
    }
  }

  const sections = getSections()

  // Título do modal baseado no tipo
  const getModalTitle = () => {
    if (mode === 'edit') {
      return 'Editar Atleta'
    }
    switch (registerType) {
      case 'organizador':
        return 'Cadastrar Novo Organizador'
      case 'responsavel':
        return 'Cadastrar Novo Responsável'
      default:
        return 'Cadastrar Novo Atleta'
    }
  }

  // Texto do portal baseado no tipo
  const getPortalText = () => {
    switch (registerType) {
      case 'organizador':
        return 'Portal do organizador'
      case 'responsavel':
        return 'Portal do responsável'
      default:
        return 'Portal do atleta'
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Estilo igual à página de login */}
              <header className="flex items-center justify-between border-b border-gray-200 bg-[#0C3049] px-6 sm:px-8 md:px-10 lg:px-12 py-5 sm:py-6 md:py-7 lg:py-8 text-white">
                <div>
                  <p className="text-xs sm:text-sm md:text-base uppercase tracking-[0.28em] text-orange-300">
                    {getPortalText()}
                  </p>
                  <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                    {getModalTitle()}
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-blue-100">
                    Preencha os dados do atleta para {mode === 'edit' ? 'atualizar' : 'criar'} o cadastro
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
                  aria-label="Fechar"
                >
                  <X size={isMobile ? 20 : 24} strokeWidth={2.5} />
                </button>
              </header>

              {/* Conteúdo */}
              <div className="px-6 sm:px-8 md:px-10 lg:px-12 py-8 sm:py-10 md:py-12 lg:py-14 overflow-y-auto flex-1">
                {/* Tabs de navegação - Estilo do dashboard */}
                <div className="mb-6 sm:mb-8 md:mb-10 inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 sm:p-1.5 text-xs sm:text-sm md:text-base font-semibold text-gray-500 w-full overflow-x-auto">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id as any)}
                        type="button"
                        className={`flex items-center gap-2 rounded-full px-3 sm:px-4 md:px-5 py-2 transition whitespace-nowrap ${
                          activeSection === section.id
                            ? 'bg-white text-primary-blue shadow'
                            : 'hover:text-primary-blue'
                        }`}
                      >
                        <Icon size={16} className="sm:w-5 sm:h-5" />
                        <span>{section.label}</span>
                      </button>
                    )
                  })}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  {/* Seção: Dados Básicos */}
                  {activeSection === 'dados' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6 sm:space-y-8"
                    >
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                          <User size={20} className="text-primary-blue" />
                          Dados Pessoais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Nome Completo *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.nomeCompleto}
                              onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                              placeholder="Digite o nome completo"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              CPF {showPasswordFields ? '*' : '(não obrigatório)'}
                            </label>
                            <input
                              type="text"
                              required={showPasswordFields}
                              value={formData.cpf}
                              onChange={(e) => handleInputChange('cpf', e.target.value)}
                              placeholder="000.000.000-00"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Data de Nascimento *
                            </label>
                            <input
                              type="date"
                              required
                              value={formData.dataNascimento}
                              onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                              placeholder="dd/mm/aaaa"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Sexo *
                            </label>
                            <select
                              required
                              value={formData.sexo}
                              onChange={(e) => handleInputChange('sexo', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            >
                              <option value="">Selecione</option>
                              <option value="Feminino">Feminino</option>
                              <option value="Masculino">Masculino</option>
                              <option value="Outro">Outro</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Possui necessidade especial?
                            </label>
                            <select
                              value={formData.necessidadeEspecial}
                              onChange={(e) => handleInputChange('necessidadeEspecial', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            >
                              <option value="Não">Não</option>
                              <option value="Sim">Sim</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Informações de Contato */}
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                          <Mail size={20} className="text-primary-blue" />
                          Informações de Contato
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              E-mail *
                            </label>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="nome@exemplo.com"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Celular/WhatsApp *
                            </label>
                            <input
                              type="tel"
                              required
                              value={formData.celular}
                              onChange={(e) => handleInputChange('celular', e.target.value)}
                              placeholder="(00) 00000-0000"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Informações de Acesso */}
                      {showPasswordFields && (
                        <div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                            <Lock size={20} className="text-primary-blue" />
                            Informações de Acesso
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                              <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                                Senha *
                              </label>
                              <input
                                type="password"
                                required
                                value={formData.senha}
                                onChange={(e) => handleInputChange('senha', e.target.value)}
                                placeholder="Crie uma senha forte"
                                className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                              />
                            </div>
                            <div>
                              <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                                Confirme a Senha *
                              </label>
                              <input
                                type="password"
                                required
                                value={formData.confirmarSenha}
                                onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                                placeholder="Repita a senha"
                                className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Seção: Endereço */}
                  {activeSection === 'endereco' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6 sm:space-y-8"
                    >
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                          <MapPin size={20} className="text-primary-blue" />
                          Informações de Endereço
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              CEP
                            </label>
                            <input
                              type="text"
                              value={formData.cep}
                              onChange={(e) => handleInputChange('cep', e.target.value)}
                              placeholder="00000-000"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Estado
                            </label>
                            <input
                              type="text"
                              value={formData.estado}
                              onChange={(e) => handleInputChange('estado', e.target.value)}
                              placeholder="Ex.: ES"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Cidade
                            </label>
                            <input
                              type="text"
                              value={formData.cidade}
                              onChange={(e) => handleInputChange('cidade', e.target.value)}
                              placeholder="Vitória"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Bairro
                            </label>
                            <input
                              type="text"
                              value={formData.bairro}
                              onChange={(e) => handleInputChange('bairro', e.target.value)}
                              placeholder="Centro"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Endereço
                            </label>
                            <input
                              type="text"
                              value={formData.endereco}
                              onChange={(e) => handleInputChange('endereco', e.target.value)}
                              placeholder="Rua, avenida, número"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Nº/Complemento
                            </label>
                            <input
                              type="text"
                              value={formData.complemento}
                              onChange={(e) => handleInputChange('complemento', e.target.value)}
                              placeholder="Apto, bloco..."
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Seção: Organização (apenas para organizadores) */}
                  {activeSection === 'organizacao' && registerType === 'organizador' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6 sm:space-y-8"
                    >
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">
                          Informações da Organização
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Nome da Organização/Academia *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.equipe || ''}
                              onChange={(e) => handleInputChange('equipe', e.target.value)}
                              placeholder="Digite o nome da organização"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              CNPJ
                            </label>
                            <input
                              type="text"
                              value={formData.cpf || ''}
                              onChange={(e) => handleInputChange('cpf', e.target.value)}
                              placeholder="00.000.000/0000-00"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Telefone Comercial
                            </label>
                            <input
                              type="tel"
                              value={formData.celular || ''}
                              onChange={(e) => handleInputChange('celular', e.target.value)}
                              placeholder="(00) 0000-0000"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Seção: Esporte (apenas para atletas) */}
                  {activeSection === 'esporte' && registerType === 'atleta' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6 sm:space-y-8"
                    >
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                          <Award size={20} className="text-primary-blue" />
                          Informações do Esporte
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Equipe/Academia
                            </label>
                            <input
                              type="text"
                              value={formData.equipe}
                              onChange={(e) => handleInputChange('equipe', e.target.value)}
                              placeholder="Digite ou selecione a equipe"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                            <p className="text-xs sm:text-sm text-primary-blue mt-1">
                              Caso não localize, cadastre-a <a href="#" className="underline hover:text-blue-700">aqui</a>.
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Professor
                            </label>
                            <input
                              type="text"
                              value={formData.professor}
                              onChange={(e) => handleInputChange('professor', e.target.value)}
                              placeholder="Nome do professor"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                            <p className="text-xs sm:text-sm text-primary-blue mt-1">
                              Caso não localize, cadastre-o <a href="#" className="underline hover:text-blue-700">aqui</a>.
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Esporte
                            </label>
                            <select
                              value={formData.esporte}
                              onChange={(e) => handleInputChange('esporte', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            >
                              <option>Jiu-Jitsu</option>
                              <option>Grappling</option>
                              <option>No-Gi</option>
                              <option>Judo</option>
                              <option>Outros</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Graduação/Faixa
                            </label>
                            <select
                              value={formData.graduacao}
                              onChange={(e) => handleInputChange('graduacao', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            >
                              <option value="">Selecione</option>
                              <option>Faixa branca</option>
                              <option>Faixa cinza</option>
                              <option>Faixa amarela</option>
                              <option>Faixa laranja</option>
                              <option>Faixa verde</option>
                              <option>Faixa azul</option>
                              <option>Faixa roxa</option>
                              <option>Faixa marrom</option>
                              <option>Faixa preta</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Peso (kg) <span className="text-xs text-gray-500">(com kimono)</span>
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={formData.peso}
                              onChange={(e) => handleInputChange('peso', e.target.value)}
                              placeholder="Ex: 75.5"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Altura (cm)
                            </label>
                            <input
                              type="number"
                              value={formData.altura}
                              onChange={(e) => handleInputChange('altura', e.target.value)}
                              placeholder="Ex: 175"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Seção: Responsável */}
                  {activeSection === 'responsavel' && registerType === 'atleta' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6 sm:space-y-8"
                    >
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                          <Users size={20} className="text-primary-blue" />
                          Responsável (se menor de idade)
                        </h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-5 mb-4 sm:mb-6">
                          <p className="text-sm sm:text-base text-yellow-800">
                            <strong>Atenção:</strong> Preencha apenas se o atleta for menor de 18 anos.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Nome do Responsável
                            </label>
                            <input
                              type="text"
                              value={formData.nomeResponsavel}
                              onChange={(e) => handleInputChange('nomeResponsavel', e.target.value)}
                              placeholder="Nome completo do responsável"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-gray-600 mb-2">
                              Telefone do Responsável
                            </label>
                            <input
                              type="tel"
                              value={formData.telefoneResponsavel}
                              onChange={(e) => handleInputChange('telefoneResponsavel', e.target.value)}
                              placeholder="(00) 00000-0000"
                              className="w-full rounded-lg border border-gray-200 px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-medium text-gray-800 shadow-sm focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </form>
              </div>

              {/* Footer com botões - Estilo igual à página de login */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 sm:px-8 md:px-10 lg:px-12 py-4 sm:py-5 md:py-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base md:text-lg"
                >
                  Cancelar
                </button>
                <div className="flex gap-3 sm:gap-4">
                  {activeSection !== sections[0].id && (
                    <button
                      type="button"
                      onClick={() => {
                        const sectionsArray = sections.map(s => s.id)
                        const currentIndex = sectionsArray.indexOf(activeSection)
                        if (currentIndex > 0) {
                          setActiveSection(sectionsArray[currentIndex - 1] as any)
                        }
                      }}
                      className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 border border-primary-blue text-primary-blue rounded-lg font-medium hover:bg-primary-blue hover:text-white transition-colors text-sm sm:text-base md:text-lg"
                    >
                      Anterior
                    </button>
                  )}
                  {activeSection !== sections[sections.length - 1].id ? (
                    <button
                      type="button"
                      onClick={() => {
                        const sectionsArray = sections.map(s => s.id)
                        const currentIndex = sectionsArray.indexOf(activeSection)
                        if (currentIndex < sectionsArray.length - 1) {
                          setActiveSection(sectionsArray[currentIndex + 1] as any)
                        }
                      }}
                      className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base md:text-lg"
                    >
                      Próximo
                    </button>
                  ) : (
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      className="px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-4 md:py-5 bg-primary-blue text-white rounded-lg font-semibold uppercase tracking-wide hover:bg-blue-700 transition text-sm sm:text-base md:text-lg lg:text-xl shadow-md"
                    >
                      {mode === 'edit' 
                        ? 'Salvar Alterações' 
                        : registerType === 'organizador' 
                          ? 'Cadastrar Organizador'
                          : registerType === 'responsavel'
                            ? 'Cadastrar Responsável'
                            : 'Cadastrar Atleta'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
