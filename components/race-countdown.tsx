"use client"

import { motion, AnimatePresence } from "motion/react"

interface RaceCountdownProps {
  countdown: number | null
}

/**
 * Fully derived from the hook's countdown state — no internal timers.
 *
 * The connection hook sets `countdown` to 3, 2, 1, then 0, and nulls it
 * ~900ms after reaching 0 (tracked timeout). So: numbers render while
 * counting down, GO renders while the value is 0, and the overlay
 * disappears the moment the hook clears the value. A stuck "GO!" screen
 * (the overlay used to hide itself with its own setTimeout, which could
 * be cancelled mid-flight) is structurally impossible now.
 */
export function RaceCountdown({ countdown }: RaceCountdownProps) {
  const showNumber = countdown !== null && countdown > 0
  const showGo = countdown === 0
  if (!showNumber && !showGo) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm transition-all">
      <AnimatePresence mode="wait">
        {showNumber ? (
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
        ) : (
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
        )}
      </AnimatePresence>
    </div>
  )
}
