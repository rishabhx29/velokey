// ── Weekly Leaderboard (server-side) ──────────────────────────────────────────
// Server-only helpers for the weekly global leaderboard, backed by Upstash
// Redis sorted sets. Used by /api/leaderboard only.
//
// Data model:
//   velokey:lb:{weekKey}:{mode} → ZSET  member = "{playerId}|{nickname}"
//                                       score  = wpm
//   velokey:lb:wins:{weekKey}   → ZSET  member = playerId, score = win count
//
// Weekly key = ISO week (e.g. "2026W38"), so the board resets naturally every
// Monday. playerIds are random per-browser tokens (lib/race-identity), not
// account IDs — this is an arcade board, not auth.

import { sanitizeNickname } from "@/shared/race-protocol"
import { upstashPipeline, upstashCommand } from "@/lib/upstash"

/** Leaderboard modes — mirrors the race modes players actually compete in. */
export const LEADERBOARD_MODES = ["words", "time"] as const
export type LeaderboardMode = (typeof LEADERBOARD_MODES)[number]

export interface LeaderboardRow {
  rank: number
  playerId: string
  nickname: string
  wpm: number
  accuracy: number
  mode: LeaderboardMode
  weekKey: string
}

export interface WeeklyWinsRow {
  rank: number
  playerId: string
  nickname: string
  wins: number
}

// ── Week key ──────────────────────────────────────────────────────────────────

/** ISO-8601 week key like "2026W38" for the week containing `date`. */
export function isoWeekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  // Thursday decides the ISO week.
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const year = d.getUTCFullYear()
  const yearStart = Date.UTC(year, 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7)
  return `${year}W${String(week).padStart(2, "0")}`
}

export function currentWeekKey(): string {
  return isoWeekKey(new Date())
}

// ── Keys ──────────────────────────────────────────────────────────────────────

function boardKey(mode: LeaderboardMode, weekKey: string): string {
  return `velokey:lb:${weekKey}:${mode}`
}

function winsKey(weekKey: string): string {
  return `velokey:lb:wins:${weekKey}`
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface SubmitScoreInput {
  playerId: string
  nickname: string
  wpm: number
  accuracy: number
  mode: LeaderboardMode
}

export type SubmitScoreResult =
  { ok: true; rank: number } | { ok: false; reason: string }

/**
 * Validate and persist a score. `wpm` must already have passed
 * validateResultStats on the caller side — this is a second belt of input
 * bounds, not the anti-cheat layer.
 */
export async function submitScore(
  input: SubmitScoreInput
): Promise<SubmitScoreResult> {
  const playerId =
    typeof input.playerId === "string" ? input.playerId.trim().slice(0, 64) : ""
  const nickname = sanitizeNickname(input.nickname)
  const { wpm, accuracy, mode } = input

  if (!playerId) return { ok: false, reason: "invalid_player_id" }
  if (!nickname) return { ok: false, reason: "invalid_nickname" }
  if (!Number.isFinite(wpm) || wpm <= 0 || wpm > 300)
    return { ok: false, reason: "invalid_wpm" }
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100)
    return { ok: false, reason: "invalid_accuracy" }
  if (!(LEADERBOARD_MODES as readonly string[]).includes(mode))
    return { ok: false, reason: "invalid_mode" }

  const weekKey = currentWeekKey()
  const member = `${playerId}|${nickname}`

  // Composite integer score: wpm*100 + accuracy%. Breaks ties by accuracy
  // (cleaner run wins) while decoding back to exact display values.
  const score = Math.round(wpm) * 100 + Math.round(accuracy)

  const results = await upstashPipeline<string | number | null>([
    ["ZADD", boardKey(mode, weekKey), "GT", score, member],
    ["EXPIRE", boardKey(mode, weekKey), 60 * 60 * 24 * 8],
    ["ZREVRANK", boardKey(mode, weekKey), member],
  ])
  if (!results) return { ok: false, reason: "storage_unavailable" }

  const rank0 = results[2]
  if (typeof rank0 !== "number") return { ok: false, reason: "storage_error" }

  return { ok: true, rank: rank0 + 1 }
}

/** Record a race win for the weekly wins board (called after a 1st-place race). */
export async function recordWeeklyWin(
  playerId: string,
  nickname: string
): Promise<void> {
  const id = playerId.trim().slice(0, 64)
  const nick = sanitizeNickname(nickname)
  if (!id || !nick) return
  const weekKey = currentWeekKey()
  await upstashPipeline([
    ["ZINCRBY", winsKey(weekKey), 1, `${id}|${nick}`],
    ["EXPIRE", winsKey(weekKey), 60 * 60 * 24 * 8],
  ])
}

// ── Reads ─────────────────────────────────────────────────────────────────────

interface RawScoreRow {
  member: unknown
  score: unknown
}

function parseMember(member: unknown): { playerId: string; nickname: string } {
  const raw = typeof member === "string" ? member : ""
  const idx = raw.indexOf("|")
  if (idx === -1) return { playerId: raw, nickname: raw }
  return { playerId: raw.slice(0, idx), nickname: raw.slice(idx + 1) }
}

/** Top scores for a mode in the given (default: current) week. */
export async function getTopScores(
  mode: LeaderboardMode,
  weekKey = currentWeekKey(),
  count = 20
): Promise<LeaderboardRow[]> {
  if (!(LEADERBOARD_MODES as readonly string[]).includes(mode)) return []
  const rows = await upstashCommand<RawScoreRow[]>([
    "ZRANGE",
    boardKey(mode, weekKey),
    0,
    count - 1,
    "WITHSCORES",
    "REV",
  ])
  if (!rows) return []

  // Upstash returns a flat array [member, score, member, score, ...].
  const flat = Array.isArray(rows) ? rows : []
  const out: LeaderboardRow[] = []
  for (let i = 0; i + 1 < flat.length; i += 2) {
    const entry = flat[i] as RawScoreRow | null
    const score = Number(flat[i + 1])
    if (!entry || !Number.isFinite(score)) continue
    const { playerId, nickname } = parseMember(
      typeof entry.member === "string" ? entry.member : entry
    )
    out.push({
      rank: out.length + 1,
      playerId,
      nickname,
      // Decode the composite score (wpm*100 + accuracy%).
      wpm: Math.floor(score / 100),
      accuracy: Math.round(score % 100),
      mode,
      weekKey,
    })
  }
  return out
}

/** Top weekly win counts. */
export async function getTopWins(
  weekKey = currentWeekKey(),
  count = 10
): Promise<WeeklyWinsRow[]> {
  const rows = await upstashCommand<RawScoreRow[]>([
    "ZRANGE",
    winsKey(weekKey),
    0,
    count - 1,
    "WITHSCORES",
    "REV",
  ])
  if (!rows) return []

  const flat = Array.isArray(rows) ? rows : []
  const out: WeeklyWinsRow[] = []
  for (let i = 0; i + 1 < flat.length; i += 2) {
    const entry = flat[i] as RawScoreRow | null
    const wins = Number(flat[i + 1])
    if (!entry || !Number.isFinite(wins)) continue
    const { playerId, nickname } = parseMember(
      typeof entry.member === "string" ? entry.member : entry
    )
    out.push({ rank: out.length + 1, playerId, nickname, wins })
  }
  return out
}
