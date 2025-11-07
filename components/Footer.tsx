import Link from 'next/link'
import { FiFacebook, FiInstagram, FiYoutube, FiMail, FiPhone } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Sobre o Zych */}
          <div>
            <h3 className="text-xl font-bold mb-4">Sobre o Zych</h3>
            <p className="text-gray-300 text-sm mb-4">
              O Zych é um site de Prestação de Serviços para Organização de Eventos, 
              Venda de Ingressos, Controle de Filiações e Serviços em Geral para 
              Federações, Associações e Organizadores Independentes.
            </p>
            <p className="text-gray-300 text-sm">
              Saiba mais sobre os nossos serviços{' '}
              <Link href="/servicos" className="text-primary-orange hover:underline">
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
                <Link href="/academias" className="text-gray-300 hover:text-primary-orange">
                  Para Organizadores de Eventos
                </Link>
              </li>
              <li>
                <Link href="/sistema" className="text-gray-300 hover:text-primary-orange">
                  Sistema de Gestão de Academia
                </Link>
              </li>
              <li>
                <Link href="/quem-somos" className="text-gray-300 hover:text-primary-orange">
                  Quem Somos
                </Link>
              </li>
              <li>
                <Link href="/eventos" className="text-gray-300 hover:text-primary-orange">
                  Nossos Eventos
                </Link>
              </li>
              <li>
                <Link href="/cadastro" className="text-gray-300 hover:text-primary-orange">
                  Cadastre-se
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-300 hover:text-primary-orange">
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
                <FiPhone className="text-primary-orange" />
                <span>Suporte Operacional - (27) 99945-0345</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300">
                <FiPhone className="text-primary-orange" />
                <span>Comercial - (27) 99660-0345</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300">
                <FiMail className="text-primary-orange" />
                <span>contato@zych.com.br</span>
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
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-orange transition"
              >
                <FiFacebook size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-orange transition"
              >
                <FiInstagram size={20} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary-orange transition"
              >
                <FiYoutube size={20} />
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
              <p>Portal Zych tem Certificado de Segurança, para proteger os dados dos atletas e dos organizadores</p>
            </div>
          </div>
        </div>

        {/* Links Legais */}
        <div className="border-t border-white/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-300">
            <p>© 2024, Portal Zych – Todos os direitos reservados.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/termos" className="hover:text-primary-orange">
                Termos de Uso
              </Link>
              <span>|</span>
              <Link href="/privacidade" className="hover:text-primary-orange">
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

