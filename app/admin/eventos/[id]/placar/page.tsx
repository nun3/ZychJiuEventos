import { redirect } from 'next/navigation'

export default function PlacarRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/eventos/${params.id}/operacao`)
}
