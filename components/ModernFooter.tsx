'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Facebook, Instagram, Youtube, Mail, Phone, MessageCircle } from 'lucide-react'

export default function ModernFooter() {
  const phoneNumber = '5541991526177'
  const message = 'Olá! Gostaria de mais informações sobre os eventos.'

  const handleWhatsApp = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <>
      <footer className="bg-gray-900 text-white mt-12 sm:mt-16 md:mt-20">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8"
          >
            {/* Sobre o Meu Camp */}
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-5">Sobre o Meu Camp</h3>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-3 sm:mb-4 md:mb-5">
                O Meu Camp é um site de Prestação de Serviços para Organização de Eventos, 
                Venda de Ingressos, Controle de Filiações e Serviços em Geral para 
                Federações, Associações e Organizadores Independentes.
              </p>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg">
                Saiba mais sobre os nossos serviços{' '}
                <Link href="/servicos" className="text-primary-blue hover:underline">
                  AQUI
                </Link>
                .
              </p>
            </div>

            {/* Navegação */}
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-5">Navegação</h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base md:text-lg">
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
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-5">Fale conosco</h3>
              <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base md:text-lg">
                <li className="flex items-center space-x-2 sm:space-x-3 text-gray-300">
                  <Phone size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-blue flex-shrink-0" />
                  <span>Suporte Operacional - (27) 99945-0345</span>
                </li>
                <li className="flex items-center space-x-2 sm:space-x-3 text-gray-300">
                  <Phone size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-blue flex-shrink-0" />
                  <span>Comercial - (27) 99660-0345</span>
                </li>
                <li className="flex items-center space-x-2 sm:space-x-3 text-gray-300">
                  <Mail size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-blue flex-shrink-0" />
                  <span>contato@meucamp.com.br</span>
                </li>
              </ul>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg mt-4 sm:mt-5 md:mt-6">
                <strong>Atendimento on-line:</strong><br />
                Acesse o ícone do WhatsApp no rodapé para falar conosco.<br />
                Horário: Seg à Sex das 09 às 19h (dias úteis)
              </p>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-5">Redes Sociais</h3>
              <div className="flex space-x-3 sm:space-x-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-blue transition-colors"
                >
                  <Facebook size={24} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-blue transition-colors"
                >
                  <Instagram size={24} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-blue transition-colors"
                >
                  <Youtube size={24} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </a>
              </div>
            </div>

            {/* Formas de Pagamento */}
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-5">Formas de Pagamento</h3>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-4 sm:mb-5">
                Boleto, Depósito Bancário ou Transferência Eletrônica
                <br />
                <span className="text-xs sm:text-sm md:text-base">(informações na página do evento)</span>
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-5">
                <div className="w-14 h-9 sm:w-16 sm:h-10 md:w-20 md:h-12 bg-white rounded flex items-center justify-center text-xs sm:text-sm md:text-base font-bold text-gray-800">
                  Visa
                </div>
                <div className="w-14 h-9 sm:w-16 sm:h-10 md:w-20 md:h-12 bg-white rounded flex items-center justify-center text-xs sm:text-sm md:text-base font-bold text-gray-800">
                  MC
                </div>
                <div className="w-14 h-9 sm:w-16 sm:h-10 md:w-20 md:h-12 bg-white rounded flex items-center justify-center text-xs sm:text-sm md:text-base font-bold text-gray-800">
                  Elo
                </div>
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-400">
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
            <div className="flex flex-col md:flex-row justify-between items-center text-sm sm:text-base md:text-lg text-gray-300">
              <p>© {new Date().getFullYear()}, Portal Meu Camp – Todos os direitos reservados.</p>
              <div className="flex space-x-4 sm:space-x-5 md:space-x-6 mt-4 md:mt-0">
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
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
      >
        {/* Efeito de pulso animado */}
        <motion.div
          className="absolute inset-0 bg-[#25D366] rounded-full"
          animate={{
            scale: [1, 1.4, 1.4],
            opacity: [0.5, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        <motion.div
          className="absolute inset-0 bg-[#25D366] rounded-full"
          animate={{
            scale: [1, 1.6, 1.6],
            opacity: [0.3, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 0.5,
          }}
        />
        
        {/* Botão principal */}
        <motion.button
          onClick={handleWhatsApp}
          className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#25D366] to-[#20BA5A] text-white rounded-full shadow-2xl flex items-center justify-center group overflow-hidden"
          aria-label="Fale conosco no WhatsApp"
          whileHover={{ scale: 1.1, boxShadow: '0 20px 40px rgba(37, 211, 102, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {/* Efeito de brilho no hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Ícone do WhatsApp */}
          <motion.div
            initial={{ rotate: 0 }}
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <MessageCircle 
              size={28} 
              className="sm:w-8 sm:h-8 md:w-10 md:h-10 relative z-10 drop-shadow-lg" 
              strokeWidth={2.5}
            />
          </motion.div>
          
          {/* Badge de notificação (opcional) */}
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200 }}
          >
            <span className="text-white text-xs font-bold">1</span>
          </motion.div>
        </motion.button>
      </motion.div>
    </>
  )
}
