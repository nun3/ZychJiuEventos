import { redirect } from 'next/navigation'

export default function RegulamentoPrototypeRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/eventos/${params.id}/configuracao`)
}
