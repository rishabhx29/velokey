"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import type { Player, RaceProgress, RoomConfig } from "@/lib/race-protocol"
import { IconFlag2Filled } from "@tabler/icons-react"

interface RaceProgressStripProps {
  players: Player[]
  progress: RaceProgress[]
  myPlayerId: string
  config: RoomConfig
}

export function RaceProgressStrip({ players, progress, myPlayerId, config }: RaceProgressStripProps) {
  // Sort players: 'me' first, then others by ID for stability
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === myPlayerId) return -1
    if (b.id === myPlayerId) return 1
    return a.id.localeCompare(b.id)
  })

  // Calculate target for progress bar (words mode = total words, time mode = timeOption)
  // We use the first progress report's totalWords if in words mode, else we fallback to a safe max.
  const getTarget = (pId: string) => {
    if (config.mode === "time") return config.timeOption
    const pProg = progress.find(p => p.playerId === pId)
    return pProg?.totalWords || config.wordOption || 1
  }

  const getProgressPercentage = (pId: string) => {
    const pProg = progress.find(p => p.playerId === pId)
    if (!pProg) return 0
    if (pProg.finished) return 100
    
    const target = getTarget(pId)
    const current = config.mode === "time" ? pProg.elapsedSeconds : pProg.wordIndex
    
    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, (current / target) * 100))
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-3 mb-8 bg-background/80 backdrop-blur-sm p-4 rounded-3xl border border-border/40 shadow-sm">
      {sortedPlayers.map((player) => {
        const isMe = player.id === myPlayerId
        const percent = getProgressPercentage(player.id)
        const pProg = progress.find(p => p.playerId === player.id)
        const wpm = pProg ? Math.round(pProg.wpm) : 0
        const isFinished = pProg?.finished

        return (
          <div key={player.id} className="relative flex items-center h-8 w-full">
            {/* Player Info (Left side, absolute so it sits nicely near the bar) */}
            <div className={cn(
              "absolute left-0 -top-2 flex items-center gap-1.5 z-10 w-48 transition-all",
              isMe ? "opacity-100" : "opacity-80"
            )}>
              <span className="font-bold text-xs truncate" style={{ color: player.color }}>
                {player.nickname}
              </span>
              {isMe && <span className="text-[8px] font-bold uppercase bg-primary/20 text-primary px-1 rounded">You</span>}
            </div>

            {/* WPM Display (Right side) */}
            <div className={cn(
              "absolute right-0 -top-2 flex items-center justify-end z-10 w-24 font-mono font-bold text-xs transition-colors",
              isFinished ? "text-primary" : "text-muted-foreground"
            )}>
              {wpm} <span className="text-[9px] opacity-60 ml-0.5 mt-0.5">WPM</span>
            </div>

            {/* The Track */}
            <div className="absolute top-3 left-0 right-0 h-2 bg-muted/40 rounded-full overflow-hidden border border-border/20">
              {/* The Fill */}
              <motion.div
                className="absolute left-0 top-0 bottom-0 origin-left rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
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
                <IconFlag2Filled size={10} className="text-white drop-shadow-sm" />
              ) : (
                <div className="w-1.5 h-1.5 bg-white rounded-full opacity-70" />
              )}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
