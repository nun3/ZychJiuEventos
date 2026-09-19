import { redirect } from 'next/navigation'

export default function TarefasPrototypeRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/eventos/${params.id}/programacao`)
}
