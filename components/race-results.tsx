"use client"

import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import {
  IconTrophy,
  IconRefresh,
  IconLogout,
  IconMedal,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { UseRaceConnectionReturn } from "@/hooks/use-race-connection"
import { saveTestToHistory } from "@/lib/test-history"
import { submitRaceWin } from "@/lib/leaderboard-client"
import { getNickname } from "@/lib/race-identity"
import { ScreenshotButton } from "@/components/shareable-result-card"
import { RaceTournamentPanel } from "@/components/race-tournament-panel"
import { useEffect, useRef, useMemo } from "react"

interface RaceResultsProps {
  connection: UseRaceConnectionReturn
}

const PLACEMENT_MESSAGES: Record<number, string> = {
  1: "You won! Incredible typing speed.",
  2: "So close! 2nd place.",
  3: "Podium finish! 3rd place.",
}

function PlacementBadge({ placement }: { placement: number }) {
  if (placement === 1) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/20 text-amber-500">
        <IconTrophy size={16} />
      </div>
    )
  }
  if (placement === 2) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/30 bg-slate-300/20 text-slate-400">
        <IconMedal size={16} />
      </div>
    )
  }
  if (placement === 3) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-700/30 bg-amber-700/20 text-amber-700">
        <IconMedal size={16} />
      </div>
    )
  }
  return (
    <span className="font-mono font-bold text-muted-foreground/60">
      {placement}
    </span>
  )
}

export function RaceResults({ connection }: RaceResultsProps) {
  const router = useRouter()
  const {
    leaderboard,
    myPlayerId,
    isHost,
    rematch,
    disconnect,
    roomConfig,
    roomCode,
  } = connection

  const savedRef = useRef(false)
  const myEntry = leaderboard.find((e) => e.player.id === myPlayerId)

  const myStats = useMemo(
    () =>
      myEntry
        ? {
            wpm: myEntry.wpm,
            accuracy: myEntry.accuracy,
            raw: myEntry.raw,
            correctChars: myEntry.correctChars,
            incorrectChars: myEntry.incorrectChars,
            extraChars: 0,
            missedChars: 0,
            consistency: myEntry.consistency,
            elapsedSeconds: Math.round(myEntry.elapsedSeconds),
            correctedErrors: 0,
            mode: `race_${roomConfig.mode}`,
            modeDetail: String(roomConfig.wordOption || ""),
            language: `race_${roomConfig.difficulty}`,
            wpmHistory: [] as {
              second: number
              wpm: number
              raw: number
              errors: number
            }[],
          }
        : null,
    [myEntry, roomConfig]
  )

  const podium = useMemo(
    () =>
      leaderboard.map((e) => ({
        nickname: e.player.nickname,
        color: e.player.color,
        placement: e.placement,
        wpm: e.wpm,
        accuracy: e.accuracy,
        isMe: e.player.id === myPlayerId,
      })),
    [leaderboard, myPlayerId]
  )

  // Save race result to local history once
  useEffect(() => {
    if (!savedRef.current && myEntry) {
      savedRef.current = true

      const stats = {
        wpm: myEntry.wpm,
        accuracy: myEntry.accuracy,
        raw: myEntry.raw, // now broadcast by the server from the finish message
        correctChars: myEntry.correctChars,
        incorrectChars: myEntry.incorrectChars,
        extraChars: 0,
        missedChars: 0,
        mode: `race_${roomConfig.mode}`,
        duration: myEntry.elapsedSeconds,
        wordCount: roomConfig.wordOption || 0,
        language: `race_${roomConfig.difficulty}`,
        difficulty: roomConfig.difficulty,
        consistency: myEntry.consistency,
        charErrors: {},
        charAttempts: {},
      }

      saveTestToHistory(stats)

      // Weekly wins board — a 1st-place finish in any multiplayer race.
      // Fire-and-forget; silently ignored when the board is unconfigured.
      if (myEntry.placement === 1) {
        void submitRaceWin(getNickname() || myEntry.player.nickname)
      }
    }
  }, [myEntry, roomConfig])

  if (!leaderboard.length) return null

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col items-center justify-center gap-8 px-6 py-10">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-sm">
          <IconTrophy size={40} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Race Complete</h1>
        <p className="mt-1 font-medium text-muted-foreground">
          {(myEntry && PLACEMENT_MESSAGES[myEntry.placement]) ||
            "Good effort! Keep practicing."}
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-border/50 bg-card p-2 shadow-xl">
        {/* Table Header */}
        <div className="grid grid-cols-[3rem_1fr_6rem_6rem_6rem] items-center gap-2 border-b border-border/40 px-4 py-3 text-xs font-bold tracking-wider text-muted-foreground uppercase sm:grid-cols-[4rem_1fr_8rem_6rem_6rem_6rem]">
          <div className="text-center">#</div>
          <div>Player</div>
          <div className="text-right">WPM</div>
          <div className="hidden text-right sm:block">Raw</div>
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
                transition={{
                  delay: idx * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className={cn(
                  "grid grid-cols-[3rem_1fr_6rem_6rem_6rem] items-center gap-2 rounded-2xl px-4 py-3.5 transition-all sm:grid-cols-[4rem_1fr_8rem_6rem_6rem_6rem]",
                  isMe
                    ? "border-2 border-primary/20 bg-primary/10 shadow-sm"
                    : "border border-transparent bg-muted/10 hover:bg-muted/20"
                )}
              >
                {/* Placement Badge */}
                <div className="flex justify-center">
                  <PlacementBadge placement={entry.placement} />
                </div>

                {/* Player Identity */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
                    style={{ backgroundColor: entry.player.color }}
                  >
                    <span className="text-sm font-bold text-white drop-shadow-md">
                      {entry.player.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col truncate">
                    <span
                      className={cn(
                        "truncate text-sm font-bold",
                        isMe ? "text-primary" : "text-foreground"
                      )}
                    >
                      {entry.player.nickname}
                    </span>
                    {isMe && (
                      <span className="mt-0.5 text-[9px] font-bold tracking-widest text-primary/70 uppercase">
                        You
                      </span>
                    )}
                  </div>
                </div>

                {/* WPM */}
                <div className="flex flex-col items-end justify-center">
                  <span
                    className={cn(
                      "font-mono text-xl leading-none font-bold",
                      isMe ? "text-primary" : "text-foreground"
                    )}
                  >
                    {Math.round(entry.wpm)}
                  </span>
                </div>

                {/* Raw WPM (Hidden on small screens) */}
                <div className="hidden flex-col items-end justify-center sm:flex">
                  <span className="font-mono text-base leading-none font-bold text-muted-foreground">
                    {Math.round(entry.raw)}
                  </span>
                </div>

                {/* Accuracy */}
                <div className="flex flex-col items-end justify-center">
                  <span className="font-mono text-base leading-none font-bold">
                    {Math.round(entry.accuracy)}%
                  </span>
                </div>

                {/* Elapsed Time */}
                <div className="flex flex-col items-end justify-center">
                  <span className="font-mono text-sm leading-none font-bold text-muted-foreground">
                    {entry.elapsedSeconds.toFixed(1)}s
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Tournament bracket + host "Next Match" control */}
      <RaceTournamentPanel connection={connection} />

      {/* Action Buttons */}
      <div className="mt-4 flex items-center gap-4">
        {myStats && podium.length > 0 && (
          <ScreenshotButton
            stats={myStats}
            race={{ roomCode, players: podium }}
          />
        )}
        <button
          onClick={() => {
            disconnect()
            router.push("/")
          }}
          className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-border/60 bg-muted/30 px-6 py-3.5 text-sm font-bold text-foreground transition-colors hover:border-border hover:bg-muted/50 active:scale-95"
        >
          <IconLogout size={18} />
          Leave Room
        </button>

        <button
          onClick={rematch}
          title={
            isHost
              ? "Take everyone back to the lobby"
              : "Ask everyone to race again"
          }
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          <IconRefresh size={20} />
          Race Again
        </button>
      </div>
    </div>
  )
}
