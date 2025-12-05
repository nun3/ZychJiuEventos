'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Facebook, Instagram, Youtube, Mail, Phone, MessageCircle } from 'lucide-react'

export default function ModernFooter() {
  const phoneNumber = '5527999450345'
  const message = 'Olá! Gostaria de mais informações sobre os eventos.'

  const handleWhatsApp = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <>
      <footer className="bg-gray-900 text-white mt-20">
        <div className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8"
          >
            {/* Sobre o Meu Camp */}
            <div>
              <h3 className="text-xl font-bold mb-4">Sobre o Meu Camp</h3>
              <p className="text-gray-300 text-sm mb-4">
                O Meu Camp é um site de Prestação de Serviços para Organização de Eventos, 
                Venda de Ingressos, Controle de Filiações e Serviços em Geral para 
                Federações, Associações e Organizadores Independentes.
              </p>
              <p className="text-gray-300 text-sm">
                Saiba mais sobre os nossos serviços{' '}
                <Link href="/servicos" className="text-primary-blue hover:underline">
                  AQUI
                </Link>
                .
              </p>
            </div>

            {/* Navegação */}
            <div>
              <h3 className="text-xl font-bold mb-4">Navegação</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/academias" className="text-gray-300 hover:text-primary-blue transition-colors">
                    Para Organizadores de Eventos
                  </Link>
                </li>
                <li>
                  <Link href="/sistema" className="text-gray-300 hover:text-primary-blue transition-colors">
                    Sistema de Gestão de Academia
                  </Link>
                </li>
                <li>
                  <Link href="/quem-somos" className="text-gray-300 hover:text-primary-blue transition-colors">
                    Quem Somos
                  </Link>
                </li>
                <li>
                  <Link href="#eventos" className="text-gray-300 hover:text-primary-blue transition-colors">
                    Nossos Eventos
                  </Link>
                </li>
                <li>
                  <Link href="/cadastro" className="text-gray-300 hover:text-primary-blue transition-colors">
                    Cadastre-se
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-gray-300 hover:text-primary-blue transition-colors">
                    Acessar Conta
                  </Link>
                </li>
              </ul>
            </div>

            {/* Fale conosco */}
            <div>
              <h3 className="text-xl font-bold mb-4">Fale conosco</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2 text-gray-300">
                  <Phone size={18} className="text-primary-blue" />
                  <span>Suporte Operacional - (27) 99945-0345</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-300">
                  <Phone size={18} className="text-primary-blue" />
                  <span>Comercial - (27) 99660-0345</span>
                </li>
                <li className="flex items-center space-x-2 text-gray-300">
                  <Mail size={18} className="text-primary-blue" />
                  <span>contato@meucamp.com.br</span>
                </li>
              </ul>
              <p className="text-gray-300 text-xs mt-4">
                <strong>Atendimento on-line:</strong><br />
                Acesse o ícone do WhatsApp no rodapé para falar conosco.<br />
                Horário: Seg à Sex das 09 às 19h (dias úteis)
              </p>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-xl font-bold mb-4">Redes Sociais</h3>
              <div className="flex space-x-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-blue transition-colors"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-blue transition-colors"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-blue transition-colors"
                >
                  <Youtube size={20} />
                </a>
              </div>
            </div>

            {/* Formas de Pagamento */}
            <div>
              <h3 className="text-xl font-bold mb-4">Formas de Pagamento</h3>
              <p className="text-gray-300 text-sm mb-4">
                Boleto, Depósito Bancário ou Transferência Eletrônica
                <br />
                <span className="text-xs">(informações na página do evento)</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center text-xs font-bold text-gray-800">
                  Visa
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center text-xs font-bold text-gray-800">
                  MC
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center text-xs font-bold text-gray-800">
                  Elo
                </div>
              </div>
              <div className="text-xs text-gray-400">
                <p>Portal Meu Camp tem Certificado de Segurança, para proteger os dados dos atletas e dos organizadores</p>
              </div>
            </div>
          </motion.div>

          {/* Links Legais */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="border-t border-white/20 mt-8 pt-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-300">
              <p>© {new Date().getFullYear()}, Portal Meu Camp – Todos os direitos reservados.</p>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <Link href="/termos" className="hover:text-primary-blue transition-colors">
                  Termos de Uso
                </Link>
                <span>|</span>
                <Link href="/privacidade" className="hover:text-primary-blue transition-colors">
                  Política de Privacidade
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>

      {/* WhatsApp Widget */}
      <motion.button
        onClick={handleWhatsApp}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#20BA5A] transition-all duration-300 flex items-center justify-center z-40 hover:scale-110"
        aria-label="Fale conosco no WhatsApp"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle size={28} />
      </motion.button>
    </>
  )
}
