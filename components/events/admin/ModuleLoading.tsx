import { LoadingState } from '@/components/ui/LoadingState'

export function ModuleLoading() {
  return <LoadingState skeleton text="Carregando módulo" className="mt-4" />
}
