"use client"

// ── Race Tournament Panel ─────────────────────────────────────────────────────
// Bracket display + host controls for the single-elimination tournament.
// Rendered inside the race lobby and the race results screen; all state comes
// from the server's tournament_state broadcasts.

import { motion } from "motion/react"
import {
  IconTrophy,
  IconPlayerPlay,
  IconX,
  IconCrown,
  IconUsers,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { UseRaceConnectionReturn } from "@/hooks/use-race-connection"

/** Round heading: Final / Semis / Round n. */
function roundLabel(roundIndex: number, totalRounds: number): string {
  if (roundIndex === totalRounds - 1) return "Final"
  if (roundIndex === totalRounds - 2) return "Semis"
  return `Round ${roundIndex + 1}`
}

type BracketCellState = "winner" | "loser" | "pending" | "tbd"

function bracketCellState(
  playerId: string | null,
  winnerId: string | null
): BracketCellState {
  if (winnerId) return playerId === winnerId ? "winner" : "loser"
  return playerId ? "pending" : "tbd"
}

const BRACKET_CELL_CLASSES: Record<BracketCellState, string> = {
  winner: "font-bold text-amber-400",
  loser: "text-muted-foreground/40 line-through",
  pending: "text-foreground/80",
  tbd: "text-muted-foreground/30 italic",
}

export function RaceTournamentPanel({
  connection,
}: {
  connection: UseRaceConnectionReturn
}) {
  const {
    tournament,
    players,
    isHost,
    roomStatus,
    createTournament,
    tournamentNext,
    cancelTournament,
  } = connection

  const nickOf = (id: string | null): string => {
    if (!id) return "TBD"
    return players.find((p) => p.id === id)?.nickname ?? "Left"
  }

  // ── No tournament: offer creation (host, lobby only) ──────────────────────
  if (!tournament) {
    if (!isHost || roomStatus !== "lobby") return null
    const eligible = players.length >= 4
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={createTournament}
          disabled={!eligible}
          title={
            eligible
              ? "Single elimination — everyone races, one match at a time"
              : "Need at least 4 players"
          }
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-sm font-bold text-amber-500 transition-all hover:border-amber-500/60 hover:bg-amber-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconTrophy size={16} />
          Start Tournament
        </button>
        {!eligible && (
          <span className="text-[11px] text-muted-foreground/60">
            {players.length}/4 players — tournament unlocks at 4
          </span>
        )}
      </div>
    )
  }

  const t = tournament
  const liveRound = t.rounds[t.currentRound]
  const liveMatchA = liveRound?.slots[t.nextMatchIndex * 2] ?? null
  const liveMatchB = liveRound?.slots[t.nextMatchIndex * 2 + 1] ?? null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-amber-500/20 bg-amber-500/[0.03] p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconTrophy size={18} className="text-amber-500" />
          <span className="text-sm font-bold tracking-wider text-amber-500 uppercase">
            Tournament
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase">
            {t.config.mode} ·{" "}
            {t.config.mode === "words"
              ? t.config.wordOption
              : `${t.config.timeOption}s`}
          </span>
        </div>
        {isHost && !t.champion && roomStatus === "lobby" && (
          <button
            type="button"
            onClick={cancelTournament}
            className="flex items-center gap-1 text-[11px] font-semibold tracking-wider text-muted-foreground/60 uppercase transition-colors hover:text-destructive focus-visible:outline-none"
          >
            <IconX size={12} /> cancel
          </button>
        )}
      </div>

      {/* Champion banner */}
      {t.champion && (
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3.5">
          <IconCrown size={20} className="text-amber-400" />
          <span className="text-lg font-bold text-amber-300">
            {nickOf(t.champion)}
          </span>
          <span className="text-sm font-medium text-amber-500/80">
            wins the tournament!
          </span>
        </div>
      )}

      {/* Current match */}
      {!t.champion && liveRound && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3">
          <IconUsers size={14} className="text-muted-foreground/50" />
          <span className="text-sm">
            <span className="font-bold text-foreground">
              {nickOf(liveMatchA)}
            </span>
            <span className="mx-2 text-xs font-semibold tracking-widest text-muted-foreground/50 uppercase">
              vs
            </span>
            <span className="font-bold text-foreground">
              {nickOf(liveMatchB)}
            </span>
          </span>
          <span className="ml-2 rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-primary uppercase">
            {roomStatus === "racing" || roomStatus === "countdown"
              ? "racing now"
              : `match ${t.nextMatchIndex + 1}/${liveRound.winnerIds.length}`}
          </span>
        </div>
      )}

      {/* Bracket */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {t.rounds.map((round, ri) => (
          <div key={ri} className="flex min-w-[9rem] flex-1 flex-col gap-1.5">
            <span className="text-center text-[9px] font-bold tracking-widest text-muted-foreground/50 uppercase">
              {roundLabel(ri, t.rounds.length)}
            </span>
            {Array.from({ length: round.winnerIds.length }, (_, mi) => {
              const a = round.slots[mi * 2]
              const b = round.slots[mi * 2 + 1]
              const w = round.winnerIds[mi]
              const isLive =
                ri === t.currentRound && mi === t.nextMatchIndex && !t.champion
              return (
                <div
                  key={mi}
                  className={cn(
                    "flex flex-col gap-px rounded-lg border p-1.5",
                    isLive
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-border/40 bg-card/60"
                  )}
                >
                  {[a, b].map((id, side) => (
                    <div
                      key={side}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 font-mono text-[11px]",
                        BRACKET_CELL_CLASSES[bracketCellState(id, w)]
                      )}
                    >
                      {nickOf(id)}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Host controls */}
      {isHost &&
        !t.champion &&
        (roomStatus === "lobby" || roomStatus === "results") && (
          <button
            type="button"
            onClick={tournamentNext}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
          >
            <IconPlayerPlay size={16} fill="currentColor" />
            {roomStatus === "results" ? "Next Match" : "Start First Match"}
          </button>
        )}
      {isHost && t.champion && (
        <p className="text-center text-xs text-muted-foreground">
          Tournament complete — start a regular race or cancel to free the room.
        </p>
      )}
    </motion.div>
  )
}
