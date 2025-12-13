'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para detectar se a viewport corresponde a uma media query específica
 * @param query - Media query string (ex: '(max-width: 768px)')
 * @returns boolean - true se a media query corresponde
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Verificar se estamos no cliente (não no servidor)
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(query)
    
    // Definir o valor inicial
    setMatches(mediaQuery.matches)

    // Criar um listener para mudanças
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Adicionar listener (usando addEventListener se disponível, senão addListener para compatibilidade)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
    } else {
      // Fallback para navegadores mais antigos
      mediaQuery.addListener(handler)
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler)
      } else {
        // Fallback para navegadores mais antigos
        mediaQuery.removeListener(handler)
      }
    }
  }, [query])

  return matches
}

