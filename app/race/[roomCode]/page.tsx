"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRaceConnection } from "@/hooks/use-race-connection"
import { RaceLobby } from "@/components/race-lobby"
import { RaceCountdown } from "@/components/race-countdown"
import { RaceProgressStrip } from "@/components/race-progress-strip"
import { RaceResults } from "@/components/race-results"
import { TypingTest } from "@/components/typing-test"
import { IconSwords, IconEye } from "@tabler/icons-react"
import { normalizeRoomCode, isValidRoomCode } from "@/lib/room-code"
import { caretWordPosition } from "@/lib/race-progress"
import { playRaceSound } from "@/lib/race-sounds"
import { useSettings } from "@/components/settings-context"
import type { OpponentCaret } from "@/components/word-item"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function RacePage({
  params,
}: {
  params: Promise<{ roomCode: string }>
}) {
  const resolvedParams = use(params)
  const rawCode = resolvedParams.roomCode
  const router = useRouter()

  const roomCode = normalizeRoomCode(rawCode)

  useEffect(() => {
    if (!roomCode || !isValidRoomCode(roomCode)) {
      toast.error("Invalid room code")
      router.replace("/")
    } else if (rawCode !== roomCode) {
      router.replace(`/race/${roomCode}`)
    }
  }, [rawCode, roomCode, router])

  if (!roomCode || !isValidRoomCode(roomCode)) {
    return null // Will redirect
  }

  return <RaceClientView roomCode={roomCode} />
}

function RaceClientView({ roomCode }: { roomCode: string }) {
  const connection = useRaceConnection(roomCode)
  const {
    connected,
    connectionState,
    error,
    roomStatus,
    players,
    myPlayerId,
    countdown,
    progress,
    words,
    raceMode,
    raceTimeOption,
    raceWordOption,
    roomConfig,
    tournament,
    sendProgress,
    sendFinish,
  } = connection

  const { soundEnabled } = useSettings()

  // Own-car local prediction: the last char offset my typing engine emitted.
  // The progress strip overrides my car's position with a percent computed
  // from this instantly, instead of waiting for the ~400ms server round-trip.
  const [myCharIndex, setMyCharIndex] = useState(0)

  // ── Race sound effects ────────────────────────────────────────────────
  // Countdown beeps on each 3-2-1 tick, a rising "go" at zero.
  const prevCountdownRef = useRef<number | null>(null)
  useEffect(() => {
    const prev = prevCountdownRef.current
    prevCountdownRef.current = countdown
    if (countdown === null || prev === countdown) return
    if (countdown > 0) playRaceSound("beep", soundEnabled)
    else if (countdown === 0) playRaceSound("go", soundEnabled)
  }, [countdown, soundEnabled])

  // Finish horn: fires once when my finished flag first appears.
  const myFinishRef = useRef(false)
  useEffect(() => {
    const mine = progress.find((p) => p.playerId === myPlayerId)
    if (mine?.finished && !myFinishRef.current) {
      myFinishRef.current = true
      playRaceSound("finish", soundEnabled)
    }
    if (!mine?.finished) myFinishRef.current = false
  }, [progress, myPlayerId, soundEnabled])

  // Overtake whoosh: when an opponent's WPM rises above mine while both of
  // us are still racing. Edge-triggered so it plays once per pass.
  const overtakeRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (roomStatus !== "racing") {
      overtakeRef.current.clear()
      return
    }
    const mine = progress.find((p) => p.playerId === myPlayerId)
    if (!mine || mine.finished) return
    for (const p of progress) {
      if (p.playerId === myPlayerId || p.finished) continue
      const alreadyAhead = overtakeRef.current.has(p.playerId)
      const nowAhead = p.wordIndex > mine.wordIndex
      if (nowAhead && !alreadyAhead) {
        playRaceSound("overtake", soundEnabled)
      }
      if (nowAhead) overtakeRef.current.add(p.playerId)
      else overtakeRef.current.delete(p.playerId)
    }
  }, [progress, myPlayerId, roomStatus, soundEnabled])

  // My car's zero-latency percent: char offset ÷ total race-text chars.
  // Time mode is excluded — it advances by elapsed seconds (server-driven).
  const myPredictedPercent = useMemo(() => {
    if (roomConfig.mode === "time" || words.length === 0) return null
    const totalChars = words.join(" ").length
    if (totalChars <= 0) return null
    return Math.max(0, Math.min(100, (myCharIndex / totalChars) * 100))
  }, [myCharIndex, words, roomConfig.mode])

  // Opponent in-text carets: map every other player's broadcast charIndex
  // onto the word it lands in. Skips finished players (their caret would sit
  // at the text end, which the flag already communicates) and spectators.
  const opponentCarets = useMemo<OpponentCaret[]>(() => {
    if (roomStatus !== "racing" || words.length === 0) return []
    const carets: OpponentCaret[] = []
    for (const p of progress) {
      if (p.playerId === myPlayerId || p.finished) continue
      const player = players.find((pl) => pl.id === p.playerId)
      if (!player) continue
      if (p.charIndex == null) continue
      const pos = caretWordPosition(words, p.charIndex)
      if (!pos) continue
      carets.push({
        playerId: p.playerId,
        nickname: player.nickname,
        color: player.color,
        wordIndex: pos.wordIndex,
        position: pos.position,
      })
    }
    return carets
  }, [progress, players, myPlayerId, words, roomStatus])

  // Tournament spectating: when a bracket match is live and I'm not one of
  // the two racers, the test engine is display-only (server ignores my input
  // anyway — this just makes the UX honest).
  const isSpectator = useMemo(() => {
    if (!tournament || tournament.champion) return false
    if (roomStatus !== "racing" && roomStatus !== "countdown") return false
    const round = tournament.rounds[tournament.currentRound]
    if (!round) return false
    const a = round.slots[tournament.nextMatchIndex * 2]
    const b = round.slots[tournament.nextMatchIndex * 2 + 1]
    return myPlayerId !== a && myPlayerId !== b
  }, [tournament, roomStatus, myPlayerId])

  // Show connection state if not connected yet
  if (!connected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconSwords size={20} className="animate-pulse" />
          <span className="animate-pulse font-medium">
            {connectionState === "reconnecting"
              ? "Reconnecting to race server..."
              : "Connecting to race server..."}
          </span>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}. Retrying automatically…
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="relative flex w-full flex-1 flex-col overflow-hidden pt-8 pb-12">
      {/* Background glow specific to race page */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[600px] w-[1000px] rounded-full bg-gradient-to-tr from-amber-500/10 via-amber-500/5 to-transparent opacity-60 mix-blend-screen blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {roomStatus === "lobby" && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.2 }}
            className="w-full flex-1"
          >
            <RaceLobby connection={connection} />
          </motion.div>
        )}

        {(roomStatus === "countdown" || roomStatus === "racing") && (
          <motion.div
            key="racing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex w-full flex-1 flex-col justify-center"
          >
            <RaceProgressStrip
              players={players}
              progress={progress}
              myPlayerId={myPlayerId}
              config={roomConfig}
              totalChars={words.join(" ").length}
              myPredictedPercent={myPredictedPercent}
            />

            <div className="relative mx-auto w-full max-w-site">
              {isSpectator && (
                <div className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold tracking-widest text-muted-foreground/70 uppercase">
                  <IconEye size={14} />
                  Spectating — tournament match in progress
                </div>
              )}
              {/* Gate on server words: before they arrive the engine would mount
                  with fallback solo words, flash the wrong text, then reset when
                  the real race words land (visible on every rejoin/refresh). */}
              {words.length > 0 && (
                <TypingTest
                  raceWords={words}
                  raceMode={raceMode || undefined}
                  raceTimeOption={raceTimeOption || undefined}
                  raceWordOption={raceWordOption || undefined}
                  hideControls={true}
                  standaloneLayout={true}
                  opponentCarets={opponentCarets}
                  disabled={roomStatus === "countdown" || isSpectator}
                  onProgressUpdate={(prog) => {
                    setMyCharIndex(prog.charIndex ?? 0)
                    sendProgress(
                      prog.wordIndex,
                      prog.totalWords,
                      prog.wpm,
                      prog.accuracy,
                      prog.charIndex
                    )
                  }}
                  onRaceFinish={(stats) => {
                    sendFinish(stats)
                  }}
                />
              )}
            </div>

            <RaceCountdown countdown={countdown} />
          </motion.div>
        )}

        {roomStatus === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full flex-1"
          >
            <RaceResults connection={connection} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
