"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

type LayoutTextFlipProps = {
  text?: string
  words?: string[]
  duration?: number
}

export function LayoutTextFlip({
  text = "Build Amazing",
  words = ["Landing Pages", "Component Blocks", "Page Sections", "3D Shaders"],
  duration = 3000,
}: LayoutTextFlipProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, duration)

    return () => clearInterval(interval)
  }, [duration, words.length])

  return (
    <>
      <motion.span
        layoutId="subtext"
        className="font-editorial-new whitespace-nowrap text-4xl font-light tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl"
      >
        {text}
      </motion.span>

      <motion.span
        layout
        className="relative inline-flex w-fit items-center justify-center overflow-hidden rounded-sm border border-white/50 bg-white/90 text-3xl font-light tracking-tight text-black shadow-lg shadow-black/20 sm:px-6 sm:py-3 sm:text-4xl md:text-5xl"
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: -40, filter: "blur(10px)", opacity: 0 }}
            animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
            exit={{ y: 50, filter: "blur(10px)", opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "inline-block whitespace-nowrap px-4 py-2 font-light italic",
              "font-editorial-new bg-gradient-to-b from-black via-black to-white/85 bg-clip-text text-transparent"
            )}
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </>
  )
}
