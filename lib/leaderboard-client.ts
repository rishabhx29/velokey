"use client"

// ── Leaderboard Client ────────────────────────────────────────────────────────
// Browser-side helpers for the weekly global leaderboard. All calls degrade
// silently: when the server reports the board is unconfigured (no Upstash
// creds yet) every function no-ops, so the UI simply hides leaderboard UI.

import type {
  LeaderboardMode,
  LeaderboardRow,
  WeeklyWinsRow,
} from "@/lib/leaderboard"
import { getOrCreatePlayerId, getNickname } from "@/lib/race-identity"

export interface LeaderboardGetResponse {
  configured: boolean
  weekKey: string
  top: LeaderboardRow[]
  wins: WeeklyWinsRow[]
}

export interface SubmitScoreResponse {
  ok: boolean
  rank?: number
  reason?: string
}

export async function fetchLeaderboard(
  mode: LeaderboardMode
): Promise<LeaderboardGetResponse> {
  try {
    const res = await fetch(`/api/leaderboard?mode=${mode}`, {
      cache: "no-store",
    })
    if (!res.ok) throw new Error(String(res.status))
    return (await res.json()) as LeaderboardGetResponse
  } catch {
    return { configured: false, weekKey: "", top: [], wins: [] }
  }
}

export interface SubmitableRun {
  wpm: number
  raw: number
  accuracy: number
  consistency: number
  correctChars: number
  incorrectChars: number
  extraChars: number
  elapsedSeconds: number
  wpmHistory: { second: number; wpm: number; raw: number; errors: number }[]
}

/**
 * Submit a solo run to the weekly board. Fire-and-forget by design — a
 * leaderboard outage must never disturb the results screen.
 */
export async function submitScoreToLeaderboard(
  run: SubmitableRun,
  mode: LeaderboardMode
): Promise<SubmitScoreResponse | null> {
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "score",
        playerId: getOrCreatePlayerId(),
        nickname: getNickname() || "Anon",
        mode,
        ...run,
      }),
    })
    if (!res.ok) return null
    return (await res.json()) as SubmitScoreResponse
  } catch {
    return null
  }
}

/** Record a 1st-place race finish on the weekly wins board. Fire-and-forget. */
export async function submitRaceWin(nickname: string): Promise<void> {
  try {
    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "win",
        playerId: getOrCreatePlayerId(),
        nickname,
      }),
    })
  } catch {
    // ignore — wins are best-effort
  }
}
