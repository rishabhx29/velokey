"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { getRaceProgressPercent } from "@/lib/race-progress"
import type { Player, RaceProgress, RoomConfig } from "@/shared/race-protocol"
import { IconFlag2Filled } from "@tabler/icons-react"

interface RaceProgressStripProps {
  players: Player[]
  progress: RaceProgress[]
  myPlayerId: string
  config: RoomConfig
}

/** Diameter of the moving car marker, in px. */
const CAR_SIZE_PX = 18

export function RaceProgressStrip({
  players,
  progress,
  myPlayerId,
  config,
}: RaceProgressStripProps) {
  // Sort players: 'me' first, then others by ID for stability
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === myPlayerId) return -1
    if (b.id === myPlayerId) return 1
    return a.id.localeCompare(b.id)
  })

  const getProgressPercentage = (pId: string) => {
    const pProg = progress.find((p) => p.playerId === pId)
    if (!pProg) return 0
    return getRaceProgressPercent(config, pProg)
  }

  return (
    <div className="mx-auto mb-10 flex w-full max-w-4xl flex-col gap-5 rounded-2xl border border-border/40 bg-background/80 p-5 shadow-sm backdrop-blur-sm">
      {sortedPlayers.map((player) => {
        const isMe = player.id === myPlayerId
        const percent = getProgressPercentage(player.id)
        const pProg = progress.find((p) => p.playerId === player.id)
        const wpm = pProg ? Math.round(pProg.wpm) : 0
        const isFinished = pProg?.finished

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

            {/* Row 2 — track with fill and car marker */}
            <div className="relative h-4">
              {/* The Track */}
              <div className="absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-muted/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
                {/* The Fill — w-full + scaleX is required: an empty absolute
                    div shrink-wraps to 0px wide, so nothing would render */}
                <motion.div
                  className="absolute top-0 bottom-0 left-0 w-full origin-left rounded-full"
                  style={{
                    backgroundColor: player.color,
                    boxShadow: `0 0 8px ${player.color}66`,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: percent / 100 }}
                  transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                />
              </div>

              {/* Finish flag at the right end */}
              <IconFlag2Filled
                size={12}
                className="absolute top-1/2 right-0 z-10 -translate-y-1/2 text-muted-foreground/50"
              />

              {/* The Car (marker that drives along the track).
                  It is positioned inside an inset rail so percent-based `left`
                  keeps the car fully within the track at 0% and 100%:
                  left % resolves against the rail width (track − car width). */}
              <div
                aria-hidden
                className="absolute top-1/2 left-0 h-0"
                style={{ right: CAR_SIZE_PX }}
              >
                <div
                  className="absolute flex items-center justify-center rounded-full border border-black/10 shadow-md transition-[left] duration-100 ease-out dark:border-white/20"
                  style={{
                    backgroundColor: player.color,
                    width: CAR_SIZE_PX,
                    height: CAR_SIZE_PX,
                    top: -CAR_SIZE_PX / 2,
                    left: `${percent}%`,
                    transform: "translateX(-50%)",
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
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
