'use client'

import { useState } from 'react'
import Image from 'next/image'

export function EventCover({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false)
  const image = src?.trim() || ''
  const visible = Boolean(image) && !failed

  return (
    <div className="relative h-32 overflow-hidden bg-mc-structure">
      {visible ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, 33vw"
          quality={55}
          className="object-cover object-center"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 bg-[linear-gradient(160deg,#071b2e_0%,#0C3049_58%,#164e73_100%)]"
          aria-hidden="true"
        />
      )}
      {visible ? <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-mc-text-primary/70 via-transparent to-transparent" /> : null}
      {visible ? null : (
        <p className="absolute inset-x-3 bottom-3 line-clamp-3 font-mc-display text-sm font-semibold leading-5 text-white">
          {name}
        </p>
      )}
    </div>
  )
}
