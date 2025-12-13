'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CadastroPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a página de login com modo de registro
    router.replace('/login?mode=register')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="text-center">
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  )
}
