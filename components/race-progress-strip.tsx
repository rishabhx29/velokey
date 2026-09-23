"use client"

import { useEffect, useState } from "react"
import { motion, useSpring, useTransform } from "motion/react"
import { cn } from "@/lib/utils"
import { getRaceProgressPercent } from "@/lib/race-progress"
import type { Player, RaceProgress, RoomConfig } from "@/shared/race-protocol"
import { IconFlag2Filled } from "@tabler/icons-react"

interface RaceProgressStripProps {
  players: Player[]
  progress: RaceProgress[]
  myPlayerId: string
  config: RoomConfig
  /**
   * Flattened race-text length (words joined by single spaces). When known,
   * per-player broadcast charIndex drives the percent so every row advances
   * with each typed character instead of jumping word-by-word.
   */
  totalChars?: number
  /**
   * Zero-latency percent for my own car, computed locally from my latest
   * typed char offset. Overrides my row's position between server broadcasts
   * so my car moves the instant I type instead of hopping every ~400ms.
   */
  myPredictedPercent?: number | null
}

/** Diameter of the moving car marker, in px. */
const CAR_SIZE_PX = 18

/**
 * Spring chase tuning: settles in roughly a broadcast interval (~200ms) and,
 * crucially, retargets smoothly from its current position — so the car flows
 * through updates instead of finishing a 100ms transition and visibly
 * waiting for the next one (the old step-by-step feel).
 */
const SPRING_CONFIG = { stiffness: 170, damping: 26, mass: 0.6 }
/** Near-instant for reduced-motion users. */
const REDUCED_SPRING_CONFIG = { stiffness: 800, damping: 60 }

/**
 * One player's smoothed track. A single spring chases the latest percent and
 * drives both the fill (scaleX) and the car (left) from the same motion
 * value, so the whole row moves as one continuously gliding unit.
 */
function SmoothTrack({
  percent,
  color,
  isFinished,
}: {
  percent: number
  color: string
  isFinished: boolean
}) {
  const [springConfig] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? REDUCED_SPRING_CONFIG
      : SPRING_CONFIG
  )
  const spring = useSpring(percent, springConfig)

  useEffect(() => {
    spring.set(percent)
  }, [percent, spring])

  const fillScale = useTransform(spring, (v) =>
    Math.max(0, Math.min(1, v / 100))
  )
  const carLeft = useTransform(
    spring,
    (v) => `${Math.max(0, Math.min(100, v))}%`
  )

  return (
    <div className="relative h-4">
      {/* The Track */}
      <div className="absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-muted/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
        {/* The Fill — w-full + scaleX is required: an empty absolute
            div shrink-wraps to 0px wide, so nothing would render */}
        <motion.div
          className="absolute top-0 bottom-0 left-0 w-full origin-left rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}66`,
            scaleX: fillScale,
          }}
        />
      </div>

      {/* Finish flag at the right end */}
      <IconFlag2Filled
        size={12}
        className="absolute top-1/2 right-0 z-10 -translate-y-1/2 text-muted-foreground/50"
      />

      {/* The Car — position driven by the spring so it glides between
          updates. It sits inside an inset rail (rail width = track − car
          width) so percent-based `left` keeps the car fully within the track
          at 0% and 100%, matching the original geometry. */}
      <div
        aria-hidden
        className="absolute top-1/2 left-0 h-0"
        style={{ right: CAR_SIZE_PX }}
      >
        <motion.div
          className="absolute"
          style={{ left: carLeft, top: -CAR_SIZE_PX / 2 }}
        >
          <div
            className="absolute flex -translate-x-1/2 items-center justify-center rounded-full border border-black/10 shadow-md dark:border-white/20"
            style={{
              backgroundColor: color,
              width: CAR_SIZE_PX,
              height: CAR_SIZE_PX,
            }}
          >
            {isFinished ? (
              <IconFlag2Filled
                size={10}
                className="text-white drop-shadow-sm"
              />
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-white opacity-70" />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export function RaceProgressStrip({
  players,
  progress,
  myPlayerId,
  config,
  totalChars,
  myPredictedPercent,
}: RaceProgressStripProps) {
  // Sort players: 'me' first, then others by ID for stability
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === myPlayerId) return -1
    if (b.id === myPlayerId) return 1
    return a.id.localeCompare(b.id)
  })

  return (
    <div className="mx-auto mb-10 flex w-full max-w-4xl flex-col gap-5 rounded-2xl border border-border/40 bg-background/80 p-5 shadow-sm backdrop-blur-sm">
      {sortedPlayers.map((player) => {
        const isMe = player.id === myPlayerId
        const pProg = progress.find((p) => p.playerId === player.id)
        const isFinished = pProg?.finished ?? false
        const serverPercent = pProg
          ? getRaceProgressPercent(config, pProg, totalChars)
          : 0
        // My row: blend in the locally predicted position so my car reacts
        // per keystroke. max() keeps it monotonic between server syncs.
        const percent =
          isMe && myPredictedPercent != null && !isFinished
            ? Math.max(serverPercent, myPredictedPercent)
            : serverPercent
        const wpm = pProg ? Math.round(pProg.wpm) : 0

        return (
          <div
            key={player.id}
            className="flex flex-col gap-1.5"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
            aria-label={`${player.nickname} progress`}
          >
            {/* Row 1 — color dot, nickname, YOU/Finished badges, live WPM */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full ring-2 ring-black/10 dark:ring-white/10"
                  style={{ backgroundColor: player.color }}
                />
                <span
                  className={cn(
                    "truncate text-xs font-bold",
                    isMe ? "opacity-100" : "opacity-80"
                  )}
                  style={{ color: player.color }}
                >
                  {player.nickname}
                </span>
                {isMe && (
                  <span className="rounded bg-primary/20 px-1 text-[8px] font-bold text-primary uppercase">
                    You
                  </span>
                )}
                {isFinished && (
                  <span className="rounded bg-primary/15 px-1.5 py-px text-[8px] font-bold text-primary uppercase">
                    Finished
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "shrink-0 font-mono text-xs font-bold tabular-nums transition-colors",
                  isFinished ? "text-primary" : "text-muted-foreground"
                )}
              >
                {wpm}
                <span className="ml-0.5 text-[9px] opacity-60">WPM</span>
              </div>
            </div>

            {/* Row 2 — spring-smoothed track with fill and car marker */}
            <SmoothTrack
              percent={percent}
              color={player.color}
              isFinished={isFinished}
            />
          </div>
        )
      })}
    </div>
  )
}
