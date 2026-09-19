import { redirect } from 'next/navigation'

export default function SecretariaPrototypeRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/eventos/${params.id}/checagem`)
}
