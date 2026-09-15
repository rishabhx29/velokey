"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"

interface RaceCountdownProps {
  countdown: number | null
}

export function RaceCountdown({ countdown }: RaceCountdownProps) {
  const [showGo, setShowGo] = useState(false)

  useEffect(() => {
    if (countdown === 0) {
      queueMicrotask(() => setShowGo(true))
      const t = setTimeout(() => setShowGo(false), 800)
      return () => clearTimeout(t)
    }
  }, [countdown])

  // Don't render anything if there's no active countdown or GO message
  if (countdown === null && !showGo) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm transition-all">
      <AnimatePresence mode="wait">
        {countdown !== null && countdown > 0 ? (
          <motion.div
            key={`count-${countdown}`}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="font-mono text-[15rem] leading-none font-bold text-primary tabular-nums drop-shadow-2xl"
          >
            {countdown}
          </motion.div>
        ) : showGo ? (
          <motion.div
            key="go"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 2, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="font-mono text-[12rem] leading-none font-bold tracking-tighter text-green-500 uppercase italic drop-shadow-2xl"
          >
            GO!
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
