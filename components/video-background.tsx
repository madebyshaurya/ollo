'use client'

import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

type VideoBackgroundProps = {
  src: string
  className?: string
}

export default function VideoBackground({ src, className }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const attemptPlay = () => {
      void video.play().catch(() => { })
    }

    if (video.readyState >= 2) {
      attemptPlay()
      return
    }

    const handleCanPlay = () => {
      attemptPlay()
      video.removeEventListener('canplay', handleCanPlay)
    }

    video.addEventListener('canplay', handleCanPlay)

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full object-cover',
        className
      )}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      controls={false}
      aria-hidden="true"
    />
  )
}
