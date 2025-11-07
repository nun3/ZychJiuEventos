import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <Link href="/" className="flex items-center space-x-3">
      <div className={`relative ${sizes[size]}`}>
        {/* Logo Zych Jiu-Jitsu - Usando imagem */}
        <Image
          src="/images/logo.png"
          alt="Zych Jiu-Jitsu Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      
      {showText && (
        <div className={`hidden md:block ${textSizes[size]}`}>
          <div className="flex items-center">
            <div className="bg-brand-red text-white px-3 py-1 font-bold">
              ZYCH
            </div>
            <div className="w-1 h-8 bg-white" />
            <div className="bg-brand-black text-white px-3 py-1 font-bold">
              JIU-JITSU
            </div>
          </div>
        </div>
      )}
    </Link>
  )
}

