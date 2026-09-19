'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, MapPin, Mail, Lock, Users, Award } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface NewAthleteModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (data: any) => void
  mode?: 'create' | 'edit'
  showPasswordFields?: boolean
  initialData?: any
  registerType?: 'atleta' | 'organizador' | 'responsavel' | 'professor'
}

function buildInitialFormData(mode: 'create' | 'edit', initialData?: any) {
  if (mode === 'edit' && initialData) {
    return {
      nomeCompleto: initialData.name || '',
      cpf: initialData.cpf || '',
      dataNascimento: initialData.birthDate || '',
      sexo: initialData.gender === 'F' ? 'Feminino' : initialData.gender === 'M' ? 'Masculino' : '',
      necessidadeEspecial: initialData.specialNeeds ? 'Sim' : 'NÃ£o',
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
    necessidadeEspecial: 'NÃ£o',
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      setActiveSection('dados')
    }
  }, [open, registerType])

  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.documentElement.style.overflow = 'hidden'
      
      return () => {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.documentElement.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [open])
  
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

  useEffect(() => {
    if (open && mode === 'edit' && initialData) {
      setFormData(buildInitialFormData(mode, initialData))
    } else if (open && mode === 'create') {
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
      return baseSections
    }
  }

  const sections = getSections()

  const getModalTitle = () => {
    if (mode === 'edit') {
      return 'Editar Atleta'
    }
    switch (registerType) {
      case 'organizador':
        return 'Cadastrar Novo Organizador'
      case 'responsavel':
        return 'Cadastrar Novo Responsável'
      case 'professor':
        return 'Cadastrar Novo Professor'
      default:
        return 'Cadastrar Novo Atleta'
    }
  }

  const getPortalText = () => {
    switch (registerType) {
      case 'organizador':
        return 'Portal do organizador'
      case 'responsavel':
        return 'Portal do responsável'
      case 'professor':
        return 'Portal do professor'
      default:
        return 'Portal do atleta'
    }
  }

  if (!mounted || !open) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Container de Scroll da Viewport */}
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Centralizador Flexível */}

            {/* Overlay Escuro (Fundo) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 transition-opacity"
              aria-hidden="true"
            />

            {/* Card do Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col"
            >
              {/* Header Compacto */}
              <header className="flex items-center justify-between border-b border-gray-200 bg-[#0C3049] px-4 py-3 text-white flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-orange-300 truncate">
                    {getPortalText()}
                  </p>
                  <h1 className="mt-1 text-lg font-bold truncate">
                    {getModalTitle()}
                  </h1>
                </div>
                <button
                  onClick={onClose}
                  className="ml-3 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all flex-shrink-0"
                  aria-label="Fechar"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </header>

              {/* Tabs Compactas */}
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex gap-1 overflow-x-auto flex-shrink-0">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id as any)}
                      type="button"
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                        activeSection === section.id
                          ? 'bg-white text-primary-blue shadow-sm'
                          : 'text-gray-600 hover:text-primary-blue hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{section.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 px-4 py-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Seção: Dados Básicos */}
                  {activeSection === 'dados' && (
                    <div className="space-y-4">
                      {/* Dados Pessoais */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <User size={16} className="text-primary-blue" />
                          Dados Pessoais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nome Completo *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.nomeCompleto}
                              onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                              placeholder="Digite o nome completo"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CPF {showPasswordFields ? '*' : '(não obrigatório)'}
                            </label>
                            <input
                              type="text"
                              required={showPasswordFields}
                              value={formData.cpf}
                              onChange={(e) => handleInputChange('cpf', e.target.value)}
                              placeholder="000.000.000-00"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Data de Nascimento *
                            </label>
                            <input
                              type="date"
                              required
                              value={formData.dataNascimento}
                              onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Sexo *
                            </label>
                            <select
                              required
                              value={formData.sexo}
                              onChange={(e) => handleInputChange('sexo', e.target.value)}
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            >
                              <option value="">Selecione</option>
                              <option value="Feminino">Feminino</option>
                              <option value="Masculino">Masculino</option>
                              <option value="Outro">Outro</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Possui necessidade especial?
                            </label>
                            <select
                              value={formData.necessidadeEspecial}
                              onChange={(e) => handleInputChange('necessidadeEspecial', e.target.value)}
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            >
                              <option value="Não">Não</option>
                              <option value="Sim">Sim</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Informações de Contato */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Mail size={16} className="text-primary-blue" />
                          Informações de Contato
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              E-mail *
                            </label>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="nome@exemplo.com"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Celular/WhatsApp *
                            </label>
                            <input
                              type="tel"
                              required
                              value={formData.celular}
                              onChange={(e) => handleInputChange('celular', e.target.value)}
                              placeholder="(00) 00000-0000"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Informações de Acesso */}
                      {showPasswordFields && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Lock size={16} className="text-primary-blue" />
                            Informações de Acesso
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Senha *
                              </label>
                              <input
                                type="password"
                                required
                                value={formData.senha}
                                onChange={(e) => handleInputChange('senha', e.target.value)}
                                placeholder="Crie uma senha forte"
                                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirme a Senha *
                              </label>
                              <input
                                type="password"
                                required
                                value={formData.confirmarSenha}
                                onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                                placeholder="Repita a senha"
                                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Seção: Endereço */}
                  {activeSection === 'endereco' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <MapPin size={16} className="text-primary-blue" />
                          Informações de Endereço
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CEP
                            </label>
                            <input
                              type="text"
                              value={formData.cep}
                              onChange={(e) => handleInputChange('cep', e.target.value)}
                              placeholder="00000-000"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Estado
                            </label>
                            <input
                              type="text"
                              value={formData.estado}
                              onChange={(e) => handleInputChange('estado', e.target.value)}
                              placeholder="Ex.: ES"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cidade
                            </label>
                            <input
                              type="text"
                              value={formData.cidade}
                              onChange={(e) => handleInputChange('cidade', e.target.value)}
                              placeholder="Vitória"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Bairro
                            </label>
                            <input
                              type="text"
                              value={formData.bairro}
                              onChange={(e) => handleInputChange('bairro', e.target.value)}
                              placeholder="Centro"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Endereço
                            </label>
                            <input
                              type="text"
                              value={formData.endereco}
                              onChange={(e) => handleInputChange('endereco', e.target.value)}
                              placeholder="Rua, avenida, número"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nº/Complemento
                            </label>
                            <input
                              type="text"
                              value={formData.complemento}
                              onChange={(e) => handleInputChange('complemento', e.target.value)}
                              placeholder="Apto, bloco..."
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seção: Organização */}
                  {activeSection === 'organizacao' && registerType === 'organizador' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          Informações da Organização
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nome da Organização/Academia *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.equipe || ''}
                              onChange={(e) => handleInputChange('equipe', e.target.value)}
                              placeholder="Digite o nome da organização"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CNPJ
                            </label>
                            <input
                              type="text"
                              value={formData.cpf || ''}
                              onChange={(e) => handleInputChange('cpf', e.target.value)}
                              placeholder="00.000.000/0000-00"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Telefone Comercial
                            </label>
                            <input
                              type="tel"
                              value={formData.celular || ''}
                              onChange={(e) => handleInputChange('celular', e.target.value)}
                              placeholder="(00) 0000-0000"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seção: Esporte */}
                  {activeSection === 'esporte' && registerType === 'atleta' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Award size={16} className="text-primary-blue" />
                          Informações do Esporte
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Equipe/Academia
                            </label>
                            <input
                              type="text"
                              value={formData.equipe}
                              onChange={(e) => handleInputChange('equipe', e.target.value)}
                              placeholder="Digite ou selecione a equipe"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                            <p className="text-xs text-primary-blue mt-1">
                              Caso não localize, cadastre-a <a href="#" className="underline hover:text-blue-700">aqui</a>.
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Professor
                            </label>
                            <input
                              type="text"
                              value={formData.professor}
                              onChange={(e) => handleInputChange('professor', e.target.value)}
                              placeholder="Nome do professor"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                            <p className="text-xs text-primary-blue mt-1">
                              Caso não localize, cadastre-o <a href="#" className="underline hover:text-blue-700">aqui</a>.
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Esporte
                            </label>
                            <select
                              value={formData.esporte}
                              onChange={(e) => handleInputChange('esporte', e.target.value)}
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            >
                              <option>Jiu-Jitsu</option>
                              <option>Grappling</option>
                              <option>No-Gi</option>
                              <option>Judo</option>
                              <option>Outros</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Graduação/Faixa
                            </label>
                            <select
                              value={formData.graduacao}
                              onChange={(e) => handleInputChange('graduacao', e.target.value)}
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Peso (kg) <span className="text-xs text-gray-500">(com kimono)</span>
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={formData.peso}
                              onChange={(e) => handleInputChange('peso', e.target.value)}
                              placeholder="Ex: 75.5"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Altura (cm)
                            </label>
                            <input
                              type="number"
                              value={formData.altura}
                              onChange={(e) => handleInputChange('altura', e.target.value)}
                              placeholder="Ex: 175"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seção: Responsável */}
                  {activeSection === 'responsavel' && registerType === 'atleta' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Users size={16} className="text-primary-blue" />
                          Responsável (se menor de idade)
                        </h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <p className="text-xs text-yellow-800">
                            <strong>Atenção:</strong> Preencha apenas se o atleta for menor de 18 anos.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nome do Responsável
                            </label>
                            <input
                              type="text"
                              value={formData.nomeResponsavel}
                              onChange={(e) => handleInputChange('nomeResponsavel', e.target.value)}
                              placeholder="Nome completo do responsável"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Telefone do Responsável
                            </label>
                            <input
                              type="tel"
                              value={formData.telefoneResponsavel}
                              onChange={(e) => handleInputChange('telefoneResponsavel', e.target.value)}
                              placeholder="(00) 00000-0000"
                              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-800 focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer com Botões Compactos */}
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors h-10"
                >
                  Cancelar
                </button>
                <div className="flex gap-2">
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
                      className="px-4 py-2 text-sm border border-primary-blue text-primary-blue rounded-lg font-medium hover:bg-primary-blue hover:text-white transition-colors h-10"
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
                      className="px-6 py-2 text-sm bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-700 transition-colors h-10"
                    >
                      Próximo
                    </button>
                  ) : (
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      className="px-6 py-2 text-sm bg-primary-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition h-10"
                    >
                      {mode === 'edit' 
                        ? 'Salvar Alterações' 
                        : registerType === 'organizador' 
                          ? 'Cadastrar Organizador'
                          : registerType === 'responsavel'
                            ? 'Cadastrar Responsável'
                            : registerType === 'professor'
                              ? 'Cadastrar Professor'
                              : 'Cadastrar Atleta'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
