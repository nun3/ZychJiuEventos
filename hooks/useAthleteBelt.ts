'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_BELT, normalizeBelt, type BeltInfo } from '@/lib/athletes/belt'

/**
 * Faixa e grau do atleta da própria conta. Sem atleta vinculado (responsável, professor) vale faixa branca sem graus.
 * `null` enquanto carrega ou se não há sessão.
 */
export function useAthleteBelt(enabled: boolean): BeltInfo | null {
  const [belt, setBelt] = useState<BeltInfo | null>(null)

  useEffect(() => {
    if (!enabled) { setBelt(null); return }
    let active = true
    const supabase = createClient()
    void (async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      // `grau` só existe depois da migration; se a coluna faltar, cai para a leitura só da faixa.
      let result = await supabase.from('athletes').select('faixa, grau').eq('user_id', auth.user.id).maybeSingle()
      if (result.error) {
        const fallback = await supabase.from('athletes').select('faixa').eq('user_id', auth.user.id).maybeSingle()
        result = { ...fallback, data: fallback.data ? { ...fallback.data, grau: 0 } : null } as typeof result
      }
      if (!active) return
      setBelt(result.data ? normalizeBelt(result.data.faixa, result.data.grau) : DEFAULT_BELT)
    })()
    return () => { active = false }
  }, [enabled])

  return belt
}
