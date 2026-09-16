export function getSupabaseConfig() {
  // O Next.js substitui variaveis NEXT_PUBLIC_* no bundle do navegador apenas
  // quando cada propriedade e acessada estaticamente.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const missing = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL',
    !publishableKey && 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  ].filter(Boolean)

  if (missing.length > 0) {
    throw new Error(
      `Configuracao do Supabase ausente: ${missing.join(', ')}. ` +
        'Copie .env.example para .env.local e preencha os valores publicos.',
    )
  }

  return {
    url: url as string,
    publishableKey: publishableKey as string,
  }
}
