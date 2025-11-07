'use client'

import { FiMessageCircle } from 'react-icons/fi'

export default function WhatsAppWidget() {
  const phoneNumber = '5527999450345' // Formato internacional
  const message = 'Olá! Gostaria de mais informações sobre os eventos.'

  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-16 h-16 bg-primary-green text-white rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 flex items-center justify-center z-40 hover:scale-110"
      aria-label="Fale conosco no WhatsApp"
    >
      <FiMessageCircle size={28} />
    </button>
  )
}

