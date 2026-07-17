"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { IconCopy, IconCheck, IconCrown, IconLogout, IconSwords, IconPlayerPlay, IconUserCheck, IconUser } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { UseRaceConnectionReturn } from "@/hooks/use-race-connection"
import { extractCodeSuffix } from "@/lib/room-code"
import { toast } from "sonner"
import { MAX_PLAYERS } from "@/lib/race-protocol"

interface RaceLobbyProps {
  connection: UseRaceConnectionReturn
}

export function RaceLobby({ connection }: RaceLobbyProps) {
  const { roomConfig, players, hostId, myPlayerId, isHost, startRace, setReady, disconnect } = connection
  const [copied, setCopied] = useState(false)

  const me = players.find(p => p.id === myPlayerId)
  const allReady = players.length >= 1 && players.every(p => p.ready || p.isHost) // Host is implicit ready for themselves
  const canStart = isHost && players.length >= 1 && allReady // Allow 1 player for testing/solo-race

  const handleCopyCode = () => {
    // Assuming room url is /race/VELO-XXXX
    const url = `${window.location.origin}${window.location.pathname}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Invite link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-6 w-full max-w-4xl mx-auto">
      {/* Header / Room Code */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2 shadow-sm border border-primary/20">
          <IconSwords size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Race Lobby</h1>
        
        {!roomConfig.isQuickMatch ? (
          <div className="flex flex-col items-center gap-2 mt-2">
            <span className="text-sm font-medium text-muted-foreground">Share this code to invite friends</span>
            <button
              onClick={handleCopyCode}
              className="group flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-border/60 bg-muted/30 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer active:scale-95"
            >
              <span className="text-2xl font-mono font-bold tracking-[0.2em]">{extractCodeSuffix(window.location.pathname.split('/').pop() || "")}</span>
              {copied ? <IconCheck className="text-green-500" /> : <IconCopy className="text-muted-foreground group-hover:text-primary transition-colors" />}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 mt-2">
            <span className="text-sm font-medium text-muted-foreground">Quick Match — Waiting for players...</span>
            <div className="flex gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            <span className="uppercase tracking-wider">Mode</span>
            <span className="text-foreground">{roomConfig.mode} ({roomConfig.mode === "words" ? roomConfig.wordOption : `${roomConfig.timeOption}s`})</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            <span className="uppercase tracking-wider">Difficulty</span>
            <span className="text-foreground capitalize">{roomConfig.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="w-full max-w-2xl bg-card rounded-3xl border border-border/40 shadow-sm overflow-hidden flex flex-col p-2">
        <div className="flex justify-between items-center px-4 py-3 border-b border-border/40 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Players ({players.length}/{MAX_PLAYERS})</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
          {players.map((p) => {
            const isMe = p.id === myPlayerId
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                  isMe ? "border-primary/30 bg-primary/5" : "border-border/40 bg-muted/20"
                )}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-black/10 dark:border-white/10"
                  style={{ backgroundColor: p.color }}
                >
                  <span className="text-white font-bold text-lg drop-shadow-md">{p.nickname.charAt(0).toUpperCase()}</span>
                </div>
                
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate text-foreground">{p.nickname}</span>
                    {isMe && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary">You</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {p.isHost ? (
                      <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold uppercase">
                        <IconCrown size={12} /> Host
                      </div>
                    ) : (
                      <div className={cn(
                        "flex items-center gap-1 text-[10px] font-bold uppercase transition-colors",
                        p.ready ? "text-green-500" : "text-muted-foreground"
                      )}>
                        {p.ready ? <IconUserCheck size={12} /> : <IconUser size={12} />}
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
      <div className="flex gap-4 items-center">
        <button
          onClick={() => {
            disconnect()
            window.location.href = "/" // hard redirect to root
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-destructive/20 text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors text-sm font-semibold cursor-pointer active:scale-95"
        >
          <IconLogout size={16} />
          Leave
        </button>

        {isHost ? (
          <button
            onClick={startRace}
            disabled={!canStart}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <IconPlayerPlay size={18} fill="currentColor" />
            Start Race
          </button>
        ) : (
          <button
            onClick={() => setReady(!me?.ready)}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-sm transition-all cursor-pointer active:scale-95",
              me?.ready 
                ? "bg-muted text-foreground border border-border/60 hover:bg-muted/80" 
                : "bg-primary text-primary-foreground hover:opacity-90"
            )}
          >
            {me?.ready ? <IconUser size={18} /> : <IconUserCheck size={18} />}
            {me?.ready ? "Cancel Ready" : "I'm Ready!"}
          </button>
        )}
      </div>
    </div>
  )
}
