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
      setShowGo(true)
      const t = setTimeout(() => setShowGo(false), 800)
      return () => clearTimeout(t)
    }
  }, [countdown])

  // Don't render anything if there's no active countdown or GO message
  if (countdown === null && !showGo) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-background/40 backdrop-blur-sm transition-all">
      <AnimatePresence mode="wait">
        {countdown !== null && countdown > 0 ? (
          <motion.div
            key={`count-${countdown}`}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="text-[15rem] font-bold text-primary font-mono tabular-nums leading-none drop-shadow-2xl"
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
            className="text-[12rem] font-bold text-green-500 font-mono italic leading-none drop-shadow-2xl uppercase tracking-tighter"
          >
            GO!
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
