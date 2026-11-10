import { redirect } from 'next/navigation'

// A tela inicial é a de eventos. A experiência coreografada fica em /experiencia (acesso pela faixa no menu).
export default function Home({ searchParams }: { searchParams?: { q?: string | string[] } }) {
  const q = Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q
  redirect(q ? `/eventos?q=${encodeURIComponent(q)}` : '/eventos')
}
