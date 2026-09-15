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
    <div className="mx-auto mb-8 flex w-full max-w-4xl flex-col gap-3 rounded-3xl border border-border/40 bg-background/80 p-4 shadow-sm backdrop-blur-sm">
      {sortedPlayers.map((player) => {
        const isMe = player.id === myPlayerId
        const percent = getProgressPercentage(player.id)
        const pProg = progress.find((p) => p.playerId === player.id)
        const wpm = pProg ? Math.round(pProg.wpm) : 0
        const isFinished = pProg?.finished

        return (
          <div
            key={player.id}
            className="relative flex h-8 w-full items-center"
          >
            {/* Player Info (Left side, absolute so it sits nicely near the bar) */}
            <div
              className={cn(
                "absolute -top-2 left-0 z-10 flex w-48 items-center gap-1.5 transition-all",
                isMe ? "opacity-100" : "opacity-80"
              )}
            >
              <span
                className="truncate text-xs font-bold"
                style={{ color: player.color }}
              >
                {player.nickname}
              </span>
              {isMe && (
                <span className="rounded bg-primary/20 px-1 text-[8px] font-bold text-primary uppercase">
                  You
                </span>
              )}
            </div>

            {/* WPM Display (Right side) */}
            <div
              className={cn(
                "absolute -top-2 right-0 z-10 flex w-24 items-center justify-end font-mono text-xs font-bold transition-colors",
                isFinished ? "text-primary" : "text-muted-foreground"
              )}
            >
              {wpm}{" "}
              <span className="mt-0.5 ml-0.5 text-[9px] opacity-60">WPM</span>
            </div>

            {/* The Track */}
            <div className="absolute top-3 right-0 left-0 h-2 overflow-hidden rounded-full border border-border/20 bg-muted/40">
              {/* The Fill — w-full is required: an empty absolute div shrink-wraps
                  to 0px wide, so scaleX never renders anything visible */}
              <motion.div
                className="absolute top-0 bottom-0 left-0 w-full origin-left rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                style={{ backgroundColor: player.color }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: percent / 100 }}
                transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>

            {/* The Car (Icon that drives along the track) */}
            <motion.div
              className="absolute top-2 left-0 z-20 flex h-4 w-4 items-center justify-center rounded-full border border-black/10 shadow-sm dark:border-white/10"
              style={{ backgroundColor: player.color }}
              initial={{ transform: "translateX(-50%)" }}
              animate={{ transform: `translateX(calc(${percent}% - 50%))` }}
              transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
            >
              {isFinished ? (
                <IconFlag2Filled
                  size={10}
                  className="text-white drop-shadow-sm"
                />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-white opacity-70" />
              )}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
