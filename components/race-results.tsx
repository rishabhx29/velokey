"use client"

import { motion } from "motion/react"
import { 
  IconTrophy, 
  IconRefresh, 
  IconLogout, 
  IconMedal, 
  IconFlame, 
  IconTargetArrow, 
  IconClock 
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { UseRaceConnectionReturn } from "@/hooks/use-race-connection"
import { saveTestToHistory } from "@/lib/test-history"
import { useEffect, useRef } from "react"
import type { ResultStats } from "@/components/results-screen"

interface RaceResultsProps {
  connection: UseRaceConnectionReturn
}

export function RaceResults({ connection }: RaceResultsProps) {
  const { leaderboard, myPlayerId, isHost, rematch, disconnect, roomConfig } = connection
  
  const savedRef = useRef(false)
  const myEntry = leaderboard.find(e => e.player.id === myPlayerId)

  // Save race result to local history once
  useEffect(() => {
    if (!savedRef.current && myEntry) {
      savedRef.current = true
      
      const stats = {
        wpm: myEntry.wpm,
        accuracy: myEntry.accuracy,
        raw: myEntry.wpm, // Fallback, real raw was sent but we don't broadcast it to save bytes
        correctChars: myEntry.correctChars,
        incorrectChars: myEntry.incorrectChars,
        extraChars: 0,
        missedChars: 0,
        mode: `race_${roomConfig.mode}`,
        duration: myEntry.elapsedSeconds,
        wordCount: roomConfig.wordOption || 0,
        language: "english",
        difficulty: roomConfig.difficulty,
        charErrors: {},
        charAttempts: {},
      }
      
      saveTestToHistory(stats)
    }
  }, [myEntry, roomConfig])

  if (!leaderboard.length) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-6 w-full max-w-4xl mx-auto py-10">
      
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 mb-4 shadow-sm border border-amber-500/20">
          <IconTrophy size={40} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Race Complete</h1>
        <p className="text-muted-foreground font-medium mt-1">
          {myEntry?.placement === 1 
            ? "You won! Incredible typing speed." 
            : myEntry?.placement === 2 
              ? "So close! 2nd place." 
              : myEntry?.placement === 3 
                ? "Podium finish! 3rd place." 
                : "Good effort! Keep practicing."}
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className="w-full max-w-3xl bg-card rounded-[2rem] border border-border/50 shadow-xl overflow-hidden p-2 flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-[3rem_1fr_6rem_6rem_6rem] sm:grid-cols-[4rem_1fr_8rem_6rem_6rem_6rem] gap-2 items-center px-4 py-3 border-b border-border/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <div className="text-center">#</div>
          <div>Player</div>
          <div className="text-right">WPM</div>
          <div className="text-right hidden sm:block">Raw</div>
          <div className="text-right">Accuracy</div>
          <div className="text-right">Time</div>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-1.5 p-2">
          {leaderboard.map((entry, idx) => {
            const isMe = entry.player.id === myPlayerId
            
            return (
              <motion.div
                key={entry.player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "grid grid-cols-[3rem_1fr_6rem_6rem_6rem] sm:grid-cols-[4rem_1fr_8rem_6rem_6rem_6rem] gap-2 items-center px-4 py-3.5 rounded-2xl transition-all",
                  isMe 
                    ? "bg-primary/10 border-2 border-primary/20 shadow-sm" 
                    : "bg-muted/10 border border-transparent hover:bg-muted/20"
                )}
              >
                {/* Placement Badge */}
                <div className="flex justify-center">
                  {entry.placement === 1 ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      <IconTrophy size={16} />
                    </div>
                  ) : entry.placement === 2 ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/20 text-slate-400 border border-slate-300/30">
                      <IconMedal size={16} />
                    </div>
                  ) : entry.placement === 3 ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-700 border border-amber-700/30">
                      <IconMedal size={16} />
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-muted-foreground/60">{entry.placement}</span>
                  )}
                </div>

                {/* Player Identity */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: entry.player.color }}
                  >
                    <span className="text-white font-bold text-sm drop-shadow-md">{entry.player.nickname.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col truncate">
                    <span className={cn("font-bold truncate text-sm", isMe ? "text-primary" : "text-foreground")}>
                      {entry.player.nickname}
                    </span>
                    {isMe && <span className="text-[9px] font-bold uppercase text-primary/70 tracking-widest mt-0.5">You</span>}
                  </div>
                </div>

                {/* WPM */}
                <div className="flex flex-col items-end justify-center">
                  <span className={cn("font-mono font-bold text-xl leading-none", isMe ? "text-primary" : "text-foreground")}>
                    {Math.round(entry.wpm)}
                  </span>
                </div>

                {/* Raw WPM (Hidden on small screens) */}
                <div className="flex-col items-end justify-center hidden sm:flex">
                  <span className="font-mono font-bold text-base text-muted-foreground leading-none">
                    {Math.round(entry.wpm)} {/* Server only holds best WPM for now, proxying raw to WPM visually */}
                  </span>
                </div>

                {/* Accuracy */}
                <div className="flex flex-col items-end justify-center">
                  <span className="font-mono font-bold text-base leading-none">
                    {Math.round(entry.accuracy)}%
                  </span>
                </div>

                {/* Elapsed Time */}
                <div className="flex flex-col items-end justify-center">
                  <span className="font-mono font-bold text-sm text-muted-foreground leading-none">
                    {entry.elapsedSeconds.toFixed(1)}s
                  </span>
                </div>
                
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 items-center mt-4">
        <button
          onClick={() => {
            disconnect()
            window.location.href = "/" 
          }}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-border/60 bg-muted/30 hover:border-border hover:bg-muted/50 transition-colors text-sm font-bold cursor-pointer active:scale-95 text-foreground"
        >
          <IconLogout size={18} />
          Leave Room
        </button>

        {isHost && (
          <button
            onClick={rematch}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer active:scale-95"
          >
            <IconRefresh size={20} />
            Race Again
          </button>
        )}
      </div>

    </div>
  )
}
