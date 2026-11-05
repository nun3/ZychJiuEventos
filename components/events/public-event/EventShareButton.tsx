'use client'

import { useEffect, useState } from 'react'
import { Check, Share2 } from 'lucide-react'

export default function EventShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const share = async () => {
    const url = window.location.href
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, url, text: title })
        return
      }
    } catch {
      // user cancelled or share failed — fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-12 items-center gap-2 bg-white px-5 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-200 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-nav-dark"
    >
      {copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
      {copied ? 'Link copiado' : 'Compartilhar'}
    </button>
  )
}
