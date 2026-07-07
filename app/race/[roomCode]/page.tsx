"use client"

import { use } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRaceConnection } from "@/hooks/use-race-connection"
import { RaceLobby } from "@/components/race-lobby"
import { RaceCountdown } from "@/components/race-countdown"
import { RaceProgressStrip } from "@/components/race-progress-strip"
import { RaceResults } from "@/components/race-results"
import { TypingTest } from "@/components/typing-test"
import { IconSwords } from "@tabler/icons-react"
import { normalizeRoomCode, isValidRoomCode } from "@/lib/room-code"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AppChrome } from "@/components/app-chrome"
import { toast } from "sonner"

export default function RacePage({ params }: { params: Promise<{ roomCode: string }> }) {
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
    hostId, 
    myPlayerId, 
    countdown,
    progress,
    words,
    raceMode,
    raceTimeOption,
    raceWordOption,
    roomConfig,
    sendProgress,
    sendFinish
  } = connection
  
  // Show connection state if not connected yet
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex gap-2 items-center text-muted-foreground">
          <IconSwords size={20} className="animate-pulse" />
          <span className="font-medium animate-pulse">{connectionState === "reconnecting" ? "Reconnecting to race server..." : "Connecting to race server..."}</span>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}. Retrying automatically…</p>}
      </div>
    )
  }

  // Handle typing test completion
  const handleFinished = (finished: boolean) => {
    if (finished) {
      // In a real typing test, onFinished triggers when test completes locally.
      // We rely on the local TypingTest to maintain accurate stats, then push them.
      // The push happens indirectly because we assume typing-test will call our 
      // progress updates which eventually leads to us finishing.
      // For immediate finish signal:
      // Note: TypingTest might not directly give us final stats on finished callback, 
      // but `useTypingTest` does inside. We'll handle this cleanly via onProgressUpdate in TypingTest.
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative w-full pt-8 pb-12">
      {/* Background glow specific to race page */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[600px] w-[1000px] rounded-full bg-gradient-to-tr from-amber-500/10 via-amber-500/5 to-transparent blur-3xl opacity-60 mix-blend-screen" />
      </div>

      <AnimatePresence mode="wait">
        {roomStatus === "lobby" && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full"
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
            className="flex-1 w-full flex flex-col justify-center"
          >
            <RaceProgressStrip 
              players={players} 
              progress={progress} 
              myPlayerId={myPlayerId} 
              config={roomConfig} 
            />
            
            <div className="w-full relative">
              <TypingTest 
                raceWords={words.length > 0 ? words : undefined}
                raceMode={raceMode || undefined}
                raceTimeOption={raceTimeOption || undefined}
                raceWordOption={raceWordOption || undefined}
                hideControls={true}
                onFinished={handleFinished}
                onProgressUpdate={(prog) => {
                  sendProgress(prog.wordIndex, prog.totalWords, prog.wpm, prog.accuracy)
                }}
                onRaceFinish={(stats) => {
                  sendFinish(stats)
                }}
              />
              {/* Optional overlay that blocks typing while in countdown */}
              {roomStatus === "countdown" && (
                <div className="absolute inset-0 z-30 bg-transparent cursor-not-allowed" />
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
            className="flex-1 w-full"
          >
            <RaceResults connection={connection} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
