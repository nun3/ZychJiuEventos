'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CurrentUser = { name: string; initial: string; avatarUrl: string | null } | null

/**
 * Usuário da sessão atual (nome, inicial e avatar), atualizado por login/logout e pelo evento `meucamp:avatar-updated`.
 * `null` = deslogado ou ainda carregando; `checked` diz se a primeira leitura já terminou.
 */
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true
    const applyUser = async (user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user) {
        if (active) { setCurrentUser(null); setChecked(true) }
        return
      }
      const metadataName = typeof user.user_metadata?.nome_completo === 'string' ? user.user_metadata.nome_completo.trim() : ''
      const name = metadataName || user.email?.split('@')[0] || 'Usuário'
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
      if (!active) return
      const metadataAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
      const avatar = profile?.avatar_url || metadataAvatar
      setCurrentUser({ name, initial: name.charAt(0).toUpperCase(), avatarUrl: typeof avatar === 'string' ? avatar : null })
      setChecked(true)
    }
    void supabase.auth.getUser().then(({ data }) => applyUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user ?? null))
    const syncProfileAvatar = () => { void supabase.auth.getUser().then(({ data }) => applyUser(data.user)) }
    window.addEventListener('meucamp:avatar-updated', syncProfileAvatar)
    return () => {
      active = false
      listener.subscription.unsubscribe()
      window.removeEventListener('meucamp:avatar-updated', syncProfileAvatar)
    }
  }, [])

  return { currentUser, checked, isLoggedIn: currentUser !== null }
}
