import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <Link href="/" className="flex items-center space-x-4">
      <div className={`relative ${sizes[size]}`}>
        {/* Logo Clube da Luta - Usando imagem fornecida */}
        <Image
          src="/images/clube-da-luta-logo.png"
          alt="Clube da Luta - Eventos de Combate"
          fill
          className="object-contain drop-shadow-lg"
          sizes="(max-width: 768px) 48px, (max-width: 1024px) 80px, 112px"
          priority
        />
      </div>

      {showText && (
        <div className={`hidden md:block ${textSizes[size]}`}>
          <div className="flex flex-col leading-tight">
            <span className="font-black tracking-[0.2em] text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.6)]">
              CLUBE DA LUTA
            </span>
            <span className="text-xs md:text-sm font-semibold text-primary-orange mt-1 tracking-[0.16em]">
              SEU CAMPEONATO ONLINE
            </span>
          </div>
        </div>
      )}
    </Link>
  )
}

