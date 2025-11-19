"use client"

import { useState } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiInfo, FiImage, FiUpload, FiSave, FiSend, FiX, FiCheckSquare, FiClipboard, FiSettings, FiAward } from 'react-icons/fi'

interface UploadedImage {
  file?: File
  preview?: string
  error?: string
}

export default function NewEventPage() {
  const [banner, setBanner] = useState<UploadedImage>({})
  const [destaque, setDestaque] = useState<UploadedImage>({})
  const [activeSection, setActiveSection] = useState<'sobre' | 'inscricoes' | 'pagamento' | 'checagem' | 'chaves' | 'pesagem' | 'premiacao' | 'cronograma' | 'avaliacao'>('sobre')

  const [form, setForm] = useState({
    organizer: 'Ricardo Zych',
    codigo: '',
    titulo: '',
    apresentacao: '',
    infoCategorias: '',
    faixasEtarias: '',
    faixasGraduacao: '',
    categoriasPeso: '',
    atencaoAgrupamento: '',
    infoAbsoluto: '',
    obsAbsoluto: '',
    infoChecagem: '',
    infoChecagemDesafioKids: '',
    infoChecagemAbsoluto: '',
    infoChaves: '',
    infoPesagem: '',
    infoPremiacao: '',
    sistemaPontuacao: '',
    criterioDesempate: '',
    regrasFiscalizacao: '',
    integridadeSaude: '',
    direitoImagem: '',
    termoAceiteAtleta: '',
    termoAceiteResponsavel: '',
    financeiroInfo: '',
    emailDadosBancarios: '',
    valoresInscricaoEvento: 'Apenas Categoria de Peso: R$ 70,00\nCategoria de Peso + Absoluto: R$ 95,00',
  })

  function handleTextChange(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validateImage(file: File, maxW: number, maxH: number): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = (e) => {
        img.onload = () => {
          const validFormat = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)
          if (!validFormat) return resolve('Formato inválido. Use jpg, jpeg, png ou gif.')
          if (img.width > maxW || img.height > maxH) {
            resolve(`Tamanho excede o máximo permitido (${maxW}x${maxH}px). Imagem atual: ${img.width}x${img.height}px`)
          } else {
            resolve(null)
          }
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  async function onSelectImage(e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'destaque') {
    const file = e.target.files?.[0]
    if (!file) return
    const isBanner = type === 'banner'
    const [maxW, maxH] = isBanner ? [550, 730] : [520, 421]
    const error = await validateImage(file, maxW, maxH)

    const preview = URL.createObjectURL(file)
    const data = { file, preview, error: error || undefined }
    if (isBanner) setBanner(data)
    else setDestaque(data)
  }

  function SectionHeader({ icon: Icon, title, id }: { icon: any; title: string; id: typeof activeSection }) {
    return (
      <button
        onClick={() => setActiveSection(id)}
        className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
          activeSection === id ? 'border-primary-red bg-white' : 'border-gray-200 bg-gray-50 hover:bg-white'
        }`}
      >
        <span className="flex items-center gap-3 text-gray-800 font-semibold">
          <Icon className="text-primary-red" /> {title}
        </span>
        <FiSettings className="text-gray-400" />
      </button>
    )
  }

  return (
    <main className="container mx-auto px-4">
      <div className="mb-6 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-600 hover:text-primary-orange">
            <FiArrowLeft />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0C3049]">Criar Evento</h1>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-[#0C3049] px-4 py-2 text-sm font-semibold text-[#0C3049] hover:bg-[#0C3049] hover:text-white">
            <FiSave /> Salvar rascunho
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <FiSend /> Publicar
          </button>
        </div>
      </div>

      {/* Cartão Principal */}
      <section className="rounded-2xl bg-white shadow p-6">
        {/* Metadados Básicos */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Organizador</label>
            <input value={form.organizer} disabled className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm bg-gray-50" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Código do Evento</label>
            <input value={form.codigo} onChange={(e) => handleTextChange('codigo', e.target.value)} placeholder="Gerado automaticamente" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" />
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Título</label>
            <input value={form.titulo} onChange={(e) => handleTextChange('titulo', e.target.value)} placeholder="Ex.: 1ª Copa Grêmio Industrial Kids de Jiu-Jitsu" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" />
          </div>
        </div>

        {/* Uploads */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Banner/Cartaz */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiImage className="text-primary-red" />
              <h3 className="font-semibold text-gray-800">Imagem do Banner/Cartaz da Página do Evento</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Tamanho máximo: 550x730px. Formatos: jpg, jpeg, gif, png.
            </p>
            <label className="block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-[#0C3049]">
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <FiUpload />
                <span className="text-sm">Clique para enviar a imagem</span>
              </div>
              <input type="file" accept="image/*" onChange={(e) => onSelectImage(e, 'banner')} className="hidden" />
            </label>
            {banner.preview && (
              <div className="mt-3">
                <img src={banner.preview} alt="Banner preview" className="rounded-lg border" />
              </div>
            )}
            {banner.error && <p className="mt-2 text-xs text-red-600">{banner.error}</p>}
          </div>

          {/* Destaque */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiImage className="text-primary-red" />
              <h3 className="font-semibold text-gray-800">Imagem Destaque do Evento</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Tamanho máximo: 520x421px. Formatos: jpg, jpeg, gif, png.
            </p>
            <label className="block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-[#0C3049]">
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <FiUpload />
                <span className="text-sm">Clique para enviar a imagem</span>
              </div>
              <input type="file" accept="image/*" onChange={(e) => onSelectImage(e, 'destaque')} className="hidden" />
            </label>
            {destaque.preview && (
              <div className="mt-3">
                <img src={destaque.preview} alt="Destaque preview" className="rounded-lg border" />
              </div>
            )}
            {destaque.error && <p className="mt-2 text-xs text-red-600">{destaque.error}</p>}
          </div>
        </div>

        {/* Seções (Accordion/Tabs) */}
        <div className="mt-8 grid gap-4">
          <SectionHeader icon={FiInfo} title="Sobre o Evento" id="sobre" />
          {activeSection === 'sobre' && (
            <div className="grid gap-4 rounded-lg border border-gray-200 p-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Apresentação do Evento</label>
                <textarea value={form.apresentacao} onChange={(e) => handleTextChange('apresentacao', e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Texto institucional do evento..." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Informações sobre as Categorias</label>
                  <textarea value={form.infoCategorias} onChange={(e) => handleTextChange('infoCategorias', e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Critérios oficiais de idade e peso (CBJJE)..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Faixas Etárias e Divisões</label>
                  <textarea value={form.faixasEtarias} onChange={(e) => handleTextChange('faixasEtarias', e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Pré-Mirim, Mirim, Infantil, Infanto-Juvenil, Juvenil..." />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Faixas</label>
                  <textarea value={form.faixasGraduacao} onChange={(e) => handleTextChange('faixasGraduacao', e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Branca/Cinza, Amarela/Laranja/Verde (Coloridas), etc." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Categorias de Peso</label>
                  <textarea value={form.categoriasPeso} onChange={(e) => handleTextChange('categoriasPeso', e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Seguem a tabela oficial CBJJE, peso com kimono..." />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Atenção (Agrupamentos e Regra de Idade)</label>
                <textarea value={form.atencaoAgrupamento} onChange={(e) => handleTextChange('atencaoAgrupamento', e.target.value)} rows={3} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Agrupamentos até 15 anos, cálculo de idade pelo ano (ex.: 2025-2016=9)..." />
              </div>
            </div>
          )}

          <SectionHeader icon={FiClipboard} title="Das Inscrições e Pagamento" id="inscricoes" />
          {activeSection === 'inscricoes' && (
            <div className="grid gap-4 rounded-lg border border-gray-200 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Informações sobre a Inscrição e Forma de Pagamento</label>
                  <textarea value={form.financeiroInfo} onChange={(e) => handleTextChange('financeiroInfo', e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Inscrições pelo site, individual/equipe, Pix ou Boleto, pagamento único, link a terceiros..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Valores das Inscrições (Página do Evento)</label>
                  <textarea value={form.valoresInscricaoEvento} onChange={(e) => handleTextChange('valoresInscricaoEvento', e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Informações para o E-mail do Atleta/Responsável (Dados Bancários)</label>
                  <textarea value={form.emailDadosBancarios} onChange={(e) => handleTextChange('emailDadosBancarios', e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Mensagem com instruções de pagamento e dados bancários..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Informações sobre o Absoluto</label>
                  <textarea value={form.infoAbsoluto} onChange={(e) => handleTextChange('infoAbsoluto', e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Critérios de participação, confirmação, divisão por faixas/idades..." />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Observações Importantes do Absoluto</label>
                <textarea value={form.obsAbsoluto} onChange={(e) => handleTextChange('obsAbsoluto', e.target.value)} rows={3} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Peso livre, premiação mínima, sem pontuação por equipe, atenção à chamada..." />
              </div>
            </div>
          )}

          <SectionHeader icon={FiCheckSquare} title="Checagem, Chaves e Pesagem" id="checagem" />
          {activeSection === 'checagem' && (
            <div className="grid gap-4 rounded-lg border border-gray-200 p-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Informações sobre a Checagem</label>
                <textarea value={form.infoChecagem} onChange={(e) => handleTextChange('infoChecagem', e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Online no site, período após inscrições, professores conferem nomes/idades/categorias..." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Desafio Kids para a Checagem</label>
                  <textarea value={form.infoChecagemDesafioKids} onChange={(e) => handleTextChange('infoChecagemDesafioKids', e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Absoluto para a Checagem</label>
                  <textarea value={form.infoChecagemAbsoluto} onChange={(e) => handleTextChange('infoChecagemAbsoluto', e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Informações sobre as Chaves</label>
                <textarea value={form.infoChaves} onChange={(e) => handleTextChange('infoChaves', e.target.value)} rows={3} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Divulgação no site após checagem, acompanhar publicação e ordem aproximada..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Informações sobre a Pesagem</label>
                <textarea value={form.infoPesagem} onChange={(e) => handleTextChange('infoPesagem', e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Documento com foto obrigatório, com kimono, 30 min antes, recomenda-se 1h antes..." />
              </div>
            </div>
          )}

          <SectionHeader icon={FiAward} title="Premiação, Regras e Termos" id="premiacao" />
          {activeSection === 'premiacao' && (
            <div className="grid gap-4 rounded-lg border border-gray-200 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Informações sobre a Premiação</label>
                  <textarea value={form.infoPremiacao} onChange={(e) => handleTextChange('infoPremiacao', e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Festival 4-7 anos medalha de ouro para todos; 8-17 anos medalhas 1º-3º; troféu equipes 1º-5º..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Sistema de Pontuação</label>
                  <textarea value={form.sistemaPontuacao} onChange={(e) => handleTextChange('sistemaPontuacao', e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Campeão 9, 2º 3, 3º 1; critério de desempate: maior nº de campeões..." />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Informações sobre a Fiscalização / Regras</label>
                <textarea value={form.regrasFiscalizacao} onChange={(e) => handleTextChange('regrasFiscalizacao', e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Kimonos em conformidade, conduta, regras CBJJ no site, desclassificação por WO..." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Integridade/Saúde do Atleta</label>
                  <textarea value={form.integridadeSaude} onChange={(e) => handleTextChange('integridadeSaude', e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Responsabilidade do professor, recomendações médicas e avaliações..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Direito de Imagem</label>
                  <textarea value={form.direitoImagem} onChange={(e) => handleTextChange('direitoImagem', e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" placeholder="Autorização de uso de imagem/voz para divulgação institucional..." />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Termo de Aceite e Responsabilidade (Atleta)</label>
                  <textarea value={form.termoAceiteAtleta} onChange={(e) => handleTextChange('termoAceiteAtleta', e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Termo de Aceite e Responsabilidade (Responsável por Atleta)</label>
                  <textarea value={form.termoAceiteResponsavel} onChange={(e) => handleTextChange('termoAceiteResponsavel', e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#0C3049] focus:ring-2 focus:ring-[#0C3049]/20" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ações Finais */}
        <div className="mt-8 flex justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-primary-red hover:text-primary-red">
            <FiX /> Cancelar
          </Link>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-[#0C3049] px-4 py-2 text-sm font-semibold text-[#0C3049] hover:bg-[#0C3049] hover:text-white">
              <FiSave /> Salvar rascunho
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              <FiSend /> Publicar
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
