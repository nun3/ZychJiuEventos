import { redirect } from 'next/navigation'

export default function EventsPage({
  searchParams,
}: {
  searchParams?: { q?: string | string[] }
}) {
  const rawQuery = searchParams?.q
  const initialSearch = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() || ''
  redirect(initialSearch ? `/?q=${encodeURIComponent(initialSearch)}#eventos` : '/#eventos')
}
