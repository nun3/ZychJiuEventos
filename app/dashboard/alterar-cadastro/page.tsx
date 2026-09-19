import { redirect } from 'next/navigation'

export default function AlterarCadastroPage() {
  redirect('/dashboard/meu-perfil#dados-pessoais')
}
