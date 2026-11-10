import InternalNavigation from '@/components/InternalNavigation'
import RouteSkeleton from '@/components/navigation/RouteSkeleton'

// A navbar desta área é renderizada dentro de cada página; aqui ela é mantida na tela enquanto a página carrega.
export default function Loading() {
  return (
    <div className="min-h-screen bg-mc-background">
      <InternalNavigation remembered fluid />
      <RouteSkeleton />
    </div>
  )
}
