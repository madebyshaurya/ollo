"use client"

import { motion } from "motion/react"

import { LayoutTextFlip } from "@/components/ui/layout-text-flip"

export function LayoutTextFlipText() {
  return (
    <motion.div className="relative mx-auto flex max-w-4xl flex-row items-center justify-center gap-4 text-center font-editorial-new text-4xl font-light tracking-tight text-white/90 sm:text-5xl md:text-6xl">
      <LayoutTextFlip
        text="Now it's not so"
        words={["hard", "frustrating", "lonely", "time taking", "complicated"]}
      />
    </motion.div>
  )
}
