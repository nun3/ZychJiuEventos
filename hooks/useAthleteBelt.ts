'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_BELT, isDeclaredBelt, normalizeBelt, type BeltInfo } from '@/lib/athletes/belt'

/** `declared` é falso quando ninguém informou a faixa: aí `belt`/`grau` são só o valor neutro e não devem ser exibidos como dado do perfil. */
export type AthleteBeltState = BeltInfo & { declared: boolean }

/**
 * Faixa e grau da própria conta: do atleta vinculado ou, sem atleta (responsável, professor), da faixa declarada no perfil.
 * `null` enquanto carrega ou se não há sessão. Sem faixa informada, `declared` é falso.
 */
export function useAthleteBelt(enabled: boolean): AthleteBeltState | null {
  const [belt, setBelt] = useState<AthleteBeltState | null>(null)

  const [version, setVersion] = useState(0)
  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1)
    window.addEventListener('meucamp:belt-updated', refresh)
    return () => window.removeEventListener('meucamp:belt-updated', refresh)
  }, [])

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
      if (result.data) { setBelt({ ...normalizeBelt(result.data.faixa, result.data.grau), declared: isDeclaredBelt(result.data.faixa) }); return }
      // Sem atleta vinculado: vale a faixa declarada no perfil.
      const { data: profile } = await supabase.from('profiles').select('faixa, grau').eq('id', auth.user.id).maybeSingle()
      if (!active) return
      setBelt(isDeclaredBelt(profile?.faixa) ? { ...normalizeBelt(profile?.faixa, profile?.grau), declared: true } : { ...DEFAULT_BELT, declared: false })
    })()
    return () => { active = false }
  }, [enabled, version])

  return belt
}
