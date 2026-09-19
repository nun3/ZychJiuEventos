import { redirect } from 'next/navigation'

export default function PlacarPrototypeRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/eventos/${params.id}/programacao`)
}
