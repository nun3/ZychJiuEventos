import { redirect } from 'next/navigation'

export default function PesagemPrototypeRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/eventos/${params.id}/resultados`)
}
