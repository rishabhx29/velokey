"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import {
  IconCopy,
  IconCheck,
  IconCrown,
  IconLogout,
  IconSwords,
  IconPlayerPlay,
  IconUserCheck,
  IconUser,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { UseRaceConnectionReturn } from "@/hooks/use-race-connection"
import { RaceTournamentPanel } from "@/components/race-tournament-panel"
import {
  extractCodeSuffix,
  isValidRoomCode,
  normalizeRoomCode,
} from "@/lib/room-code"
import { toast } from "sonner"
import { MAX_PLAYERS } from "@/shared/race-protocol"

interface RaceLobbyProps {
  connection: UseRaceConnectionReturn
}

/** Prefer the authoritative room code from the server; fall back to the URL. */
function resolveRoomCode(roomCode: string): string | null {
  if (isValidRoomCode(roomCode)) return roomCode
  return normalizeRoomCode(window.location.pathname.split("/").pop() ?? "")
}

/** Copyable invite-code card; falls back to the URL slug when unknown yet. */
function RoomCodeDisplay({ roomCode }: { roomCode: string }) {
  const [copied, setCopied] = useState(false)

  const displayCode = resolveRoomCode(roomCode) ?? roomCode

  const handleCopyCode = () => {
    const code = resolveRoomCode(roomCode)
    const url = code
      ? `${window.location.origin}/race/${code}`
      : `${window.location.origin}${window.location.pathname}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Invite link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <span className="text-sm font-medium text-muted-foreground">
        Share this code to invite friends
      </span>
      <button
        onClick={handleCopyCode}
        className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border/60 bg-muted/30 px-6 py-3 transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-95"
      >
        <span className="font-mono text-2xl font-bold tracking-[0.2em]">
          {extractCodeSuffix(displayCode)}
        </span>
        {copied ? (
          <IconCheck className="text-green-500" />
        ) : (
          <IconCopy className="text-muted-foreground transition-colors group-hover:text-primary" />
        )}
      </button>
    </>
  )
}

export function RaceLobby({ connection }: RaceLobbyProps) {
  const router = useRouter()
  const {
    roomConfig,
    players,
    myPlayerId,
    isHost,
    roomCode,
    startRace,
    setReady,
    disconnect,
  } = connection

  const me = players.find((p) => p.id === myPlayerId)
  const allReady =
    players.length >= 1 && players.every((p) => p.ready || p.isHost) // Host is implicit ready for themselves
  const canStart = isHost && players.length >= 1 && allReady // Allow 1 player for testing/solo-race
  // While a tournament bracket is running, its controls replace start/ready.
  const tournamentActive =
    connection.tournament != null && !connection.tournament.champion

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col items-center justify-center gap-8 px-6">
      {/* Header / Room Code */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
          <IconSwords size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Race Lobby</h1>

        {!roomConfig.isQuickMatch ? (
          <div className="mt-2 flex flex-col items-center gap-2">
            <RoomCodeDisplay roomCode={roomCode} />
          </div>
        ) : (
          <div className="mt-2 flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Quick Match — Waiting for players...
            </span>
            <div className="flex gap-2">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
            </div>
          </div>
        )}

        <div className="mt-2 flex gap-4">
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            <span className="tracking-wider uppercase">Mode</span>
            <span className="text-foreground">
              {roomConfig.mode} (
              {roomConfig.mode === "words"
                ? roomConfig.wordOption
                : `${roomConfig.timeOption}s`}
              )
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            <span className="tracking-wider uppercase">Difficulty</span>
            <span className="text-foreground capitalize">
              {roomConfig.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Tournament bracket (when active) or create button */}
      <RaceTournamentPanel connection={connection} />

      {/* Players List */}
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/40 bg-card p-2 shadow-sm">
        <div className="mb-2 flex items-center justify-between border-b border-border/40 px-4 py-3">
          <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Players ({players.length}/{MAX_PLAYERS})
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
          {players.map((p) => {
            const isMe = p.id === myPlayerId
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 transition-all",
                  isMe
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/40 bg-muted/20"
                )}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 shadow-sm dark:border-white/10"
                  style={{ backgroundColor: p.color }}
                >
                  <span className="text-lg font-bold text-white drop-shadow-md">
                    {p.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold text-foreground">
                      {p.nickname}
                    </span>
                    {isMe && (
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">
                        You
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {p.isHost ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase">
                        <IconCrown size={12} /> Host
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-[10px] font-bold uppercase transition-colors",
                          p.ready ? "text-green-500" : "text-muted-foreground"
                        )}
                      >
                        {p.ready ? (
                          <IconUserCheck size={12} />
                        ) : (
                          <IconUser size={12} />
                        )}
                        {p.ready ? "Ready" : "Not Ready"}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            disconnect()
            router.push("/")
          }}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-destructive/20 px-5 py-3 text-sm font-semibold text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
        >
          <IconLogout size={16} />
          Leave
        </button>

        {/* Tournament in progress: bracket controls replace start/ready */}
        {!tournamentActive &&
          (isHost ? (
            <button
              onClick={startRace}
              disabled={!canStart}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconPlayerPlay size={18} fill="currentColor" />
              Start Race
            </button>
          ) : (
            <button
              onClick={() => setReady(!me?.ready)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl px-8 py-3 font-bold shadow-sm transition-all active:scale-95",
                me?.ready
                  ? "border border-border/60 bg-muted text-foreground hover:bg-muted/80"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {me?.ready ? <IconUser size={18} /> : <IconUserCheck size={18} />}
              {me?.ready ? "Cancel Ready" : "I'm Ready!"}
            </button>
          ))}
      </div>
    </div>
  )
}
