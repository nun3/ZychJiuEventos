'use client'

import { CSSProperties } from 'react'

interface ResponsiveIframeProps {
  src: string
  title?: string
  aspectRatio?: '16:9' | '4:3' | '21:9' | 'auto'
  height?: string | number
  className?: string
  allowFullScreen?: boolean
  style?: CSSProperties
  [key: string]: any // Para permitir outras props do iframe
}

export default function ResponsiveIframe({
  src,
  title = 'Conteúdo incorporado',
  aspectRatio = '16:9',
  height,
  className = '',
  allowFullScreen = true,
  style,
  ...props
}: ResponsiveIframeProps) {
  // Determinar a classe do container baseado no aspect ratio
  const getContainerClass = () => {
    if (height) return 'iframe-container-fixed'
    
    switch (aspectRatio) {
      case '4:3':
        return 'iframe-container iframe-container-4-3'
      case '21:9':
        return 'iframe-container iframe-container-21-9'
      case '16:9':
      default:
        return 'iframe-container iframe-container-16-9'
    }
  }

  const containerClass = getContainerClass()
  const containerStyle: CSSProperties = height 
    ? { height: typeof height === 'number' ? `${height}px` : height }
    : {}

  return (
    <div className={`${containerClass} ${className}`} style={{ ...containerStyle, ...style }}>
      <iframe
        src={src}
        title={title}
        allowFullScreen={allowFullScreen}
        style={{
          transform: 'none',
          zoom: 1,
        }}
        {...props}
      />
    </div>
  )
}

