'use client';

import { useEffect, useRef } from 'react';

type VideoBackgroundProps = {
  src: string;
  className?: string;
};

export default function VideoBackground({ src, className }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        // Autoplay can fail on some devices if user interaction is required.
        // We silently ignore this here; the poster will stay visible.
        console.warn('Background video autoplay prevented:', error);
      }
    };

    if (video.readyState >= 2) {
      playVideo();
    } else {
      video.addEventListener('loadeddata', playVideo, { once: true });
    }

    return () => {
      video.removeEventListener('loadeddata', playVideo);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      controls={false}
      aria-hidden="true"
    />
  );
}
