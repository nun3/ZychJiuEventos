import { redirect } from 'next/navigation'

export default function EventManagementRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/eventos/${params.id}/configuracao`)
}
