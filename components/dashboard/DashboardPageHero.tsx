import type { ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/components/ui/utils'

export function DashboardPageHero({
  title,
  description,
  actions,
  imageSrc,
  className,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  imageSrc?: string | null
  className?: string
}) {
  const image = imageSrc?.trim() || null

  return (
    <header className={cn('relative overflow-hidden rounded-mc-large bg-mc-structure shadow-mc-subtle', className)}>
      {image ? (
        <>
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1279px) 94vw, 90vw"
            quality={60}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(7,27,46,0.94)_0%,rgba(12,48,73,0.82)_42%,rgba(18,58,86,0.5)_100%)]" aria-hidden="true" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(118deg,#071b2e_0%,#0C3049_42%,#164e73_100%)]" aria-hidden="true" />
      )}
      {image ? null : (
        <>
          <div aria-hidden="true" className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#2563eb]/20 blur-2xl" />
          <div aria-hidden="true" className="absolute bottom-0 left-1/4 h-16 w-56 rounded-full bg-[#7dd3fc]/10 blur-2xl" />
        </>
      )}
      <div className="relative flex min-h-36 flex-col justify-center gap-4 px-5 py-6 sm:min-h-40 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
        <div className="min-w-0 max-w-3xl">
          <h1 className="font-mc-display text-3xl font-semibold leading-9 text-white sm:text-4xl sm:leading-10">{title}</h1>
          {description ? <div className="mt-2 max-w-2xl font-mc-interface text-sm leading-6 text-white/80 sm:text-base">{description}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
