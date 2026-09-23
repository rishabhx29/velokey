// ── Race Protocol ─────────────────────────────────────────────────────────────
// Shared types for multiplayer typing races.
// Used by both the client (hooks/use-race-connection.ts) and the
// PartyKit server (realtime/race-room.ts).

// ── Enums & Constants ────────────────────────────────────────────────────────

export type RaceMode = "words" | "time"
export type RoomStatus = "lobby" | "countdown" | "racing" | "results"

export const MAX_PLAYERS = 8
export const MIN_PLAYERS = 2
export const COUNTDOWN_SECONDS = 3
export const ROOM_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes
export const QUICK_MATCH_WAIT_MS = 15 * 1000 // 15 seconds before auto-start
// Client→server progress send throttle. 200ms keeps the live bar responsive
// (worst-case visual latency ≈ 200ms send + 250ms server broadcast) while
// still capping traffic at 5 msg/s per player.
export const PROGRESS_THROTTLE_MS = 200
export const PROGRESS_BROADCAST_MS = 200
export const DISCONNECT_GRACE_MS = 10 * 1000
// Ready-check auto-start: grace period between "everyone ready" and the
// countdown firing, giving a last-second cancel a window to land.
export const READY_AUTO_START_MS = 1500
export const MATCHMAKER_ROOM_ID = "__velokey_matchmaker__"
// Quick-match batching: instead of pairing players 1:1 into separate rooms,
// the matchmaker collects players into batches to form fuller rooms.
export const MATCH_BATCH_SIZE = 8 // target players per quick-match room (MAX_PLAYERS)
export const MATCH_BATCH_WINDOW_MS = 3 * 1000 // wait up to this long to fill a batch
export const MATCH_BATCH_MIN_SIZE = 2 // start a room once at least this many players are batched

// ── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string
  nickname: string
  color: string
  isHost: boolean
  ready: boolean
  connected: boolean
}

// ── Room Config ──────────────────────────────────────────────────────────────

export interface RoomConfig {
  mode: RaceMode
  wordOption: number // e.g. 25, 50, 100 (used when mode === "words")
  timeOption: number // e.g. 15, 30, 60 (used when mode === "time")
  difficulty: "easy" | "medium" | "hard"
  isQuickMatch: boolean
}

// ── Race Progress ────────────────────────────────────────────────────────────

export interface RaceProgress {
  playerId: string
  wordIndex: number
  totalWords: number
  wpm: number
  accuracy: number
  finished: boolean
  elapsedSeconds: number
  /** Character offset into the flattened race text (words joined by spaces).
   *  Optional so older clients/records without it remain valid. */
  charIndex?: number
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  player: Player
  placement: number // 1, 2, 3, ...
  wpm: number
  raw: number
  accuracy: number
  consistency: number
  elapsedSeconds: number
  correctChars: number
  incorrectChars: number
}

// ── Client → Server Messages ─────────────────────────────────────────────────

export interface JoinMsg {
  type: "join"
  nickname: string
  color: string
  sessionId: string
}

export interface ReadyMsg {
  type: "ready"
  ready: boolean
}

export interface StartMsg {
  type: "start"
}

export interface ProgressMsg {
  type: "progress"
  wordIndex: number
  totalWords: number
  wpm: number
  accuracy: number
  /** Character offset for opponent in-text carets (clamped server-side). */
  charIndex?: number
}

export interface FinishMsg {
  type: "finish"
  wpm: number
  /** Raw WPM (all typed chars incl. errors ÷ 5 ÷ minutes) — broadcast back on the leaderboard. */
  raw: number
  accuracy: number
  consistency: number
  elapsedSeconds: number
  correctChars: number
  incorrectChars: number
  wpmHistory: { second: number; wpm: number; raw: number; errors: number }[]
  wordInputs: string[]
}

export interface LeaveMsg {
  type: "leave"
}

export interface RematchMsg {
  type: "rematch"
}

// ── Tournament (host-driven single elimination) ─────────────────────────────

export interface TournamentCreateMsg {
  type: "tournament_create"
}

export interface TournamentNextMsg {
  type: "tournament_next"
}

export interface TournamentCancelMsg {
  type: "tournament_cancel"
}

/** Full bracket state broadcast whenever it changes (host applies results). */
export interface TournamentStateMsg {
  type: "tournament_state"
  tournament: {
    players: string[]
    rounds: {
      slots: (string | null)[]
      winnerIds: (string | null)[]
    }[]
    currentRound: number
    nextMatchIndex: number
    config: {
      mode: RaceMode
      wordOption: number
      timeOption: number
      difficulty: string
    }
    champion: string | null
  } | null
}

export interface MatchmakeMsg {
  type: "matchmake"
  config: Pick<RoomConfig, "mode" | "wordOption" | "timeOption" | "difficulty">
  nickname: string
  color: string
  sessionId: string
}

export interface MatchCancelMsg {
  type: "match_cancel"
}

export type ClientMessage =
  | JoinMsg
  | ReadyMsg
  | StartMsg
  | ProgressMsg
  | FinishMsg
  | LeaveMsg
  | RematchMsg
  | MatchmakeMsg
  | MatchCancelMsg
  | TournamentCreateMsg
  | TournamentNextMsg
  | TournamentCancelMsg

// ── Server → Client Messages ─────────────────────────────────────────────────

export interface RoomStateMsg {
  type: "room_state"
  roomCode: string
  players: Player[]
  hostId: string
  status: RoomStatus
  config: RoomConfig
}

export interface CountdownMsg {
  type: "countdown"
  value: number // 3, 2, 1, 0 (0 = GO)
}

export interface WordsMsg {
  type: "words"
  words: string[]
  mode: RaceMode
  timeOption?: number
  wordOption?: number
}

export interface ProgressBroadcastMsg {
  type: "progress_broadcast"
  progress: RaceProgress[]
}

export interface ResultsMsg {
  type: "results"
  leaderboard: LeaderboardEntry[]
}

export interface ErrorMsg {
  type: "error"
  message: string
}

/** Non-fatal notice (e.g. ready-check auto-start) — surfaced as info, not error. */
export interface InfoMsg {
  type: "info"
  message: string
}

export interface PlayerJoinedMsg {
  type: "player_joined"
  player: Player
}

export interface PlayerLeftMsg {
  type: "player_left"
  playerId: string
  newHostId?: string
}

export interface QueueStatusMsg {
  type: "queue_status"
  position: number
  waitMs: number
}

export interface MatchedMsg {
  type: "matched"
  roomCode: string
  config: RoomConfig
  /** Number of players placed into this room by the matchmaker. */
  players: number
}

export type ServerMessage =
  | RoomStateMsg
  | CountdownMsg
  | WordsMsg
  | ProgressBroadcastMsg
  | ResultsMsg
  | ErrorMsg
  | InfoMsg
  | PlayerJoinedMsg
  | PlayerLeftMsg
  | QueueStatusMsg
  | MatchedMsg
  | TournamentStateMsg

// ── Untrusted input sanitization ─────────────────────────────────────────────
// Every client-supplied value that reaches room state must pass through one of
// these helpers first. Values come from untrusted JSON (WebSocket messages and
// the HTTP room-config endpoint), so bounds are enforced server-side rather
// than trusting the UI's own limits.

export const WORD_OPTIONS = [10, 25, 50, 100] as const
export const TIME_OPTIONS = [15, 30, 60, 120] as const
export const DIFFICULTIES = ["easy", "medium", "hard"] as const
export const RACE_MODES = ["words", "time"] as const
export const MAX_NICKNAME_LENGTH = 20

export type Difficulty = (typeof DIFFICULTIES)[number]

// Curated palette — high contrast on both light and dark backgrounds.
// Defined here (not lib/race-identity.ts) so both the client identity module
// and the runtime-neutral sanitizers below can use it.
export const PLAYER_COLORS = [
  "#22d3ee", // cyan
  "#f472b6", // pink
  "#a78bfa", // violet
  "#fb923c", // orange
  "#4ade80", // green
  "#f87171", // red
  "#facc15", // yellow
  "#60a5fa", // blue
] as const

/** Sanitize a client-supplied player color, falling back to the first palette color. */
export function sanitizeColor(color: unknown): string {
  if (typeof color === "string") {
    const normalized = color.trim().toLowerCase()
    if ((PLAYER_COLORS as readonly string[]).includes(normalized))
      return normalized
  }
  return PLAYER_COLORS[0]
}

/**
 * Sanitize a client-supplied nickname. Returns null when nothing usable
 * remains (callers decide whether to reject or substitute a default).
 */
export function sanitizeNickname(nickname: unknown): string | null {
  if (typeof nickname !== "string") return null
  // Strip control characters and ANSI escapes so no player can inject
  // terminal/rendering control sequences into other clients. Scans code
  // points directly instead of using a control-character regex (which
  // static analyzers flag as "Remove this control character"), and the
  // single-pass filter cannot backtrack.
  const cleaned = Array.from(nickname)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0
      return code > 0x1f && code !== 0x7f
    })
    .join("")
    .trim()
    .slice(0, MAX_NICKNAME_LENGTH)
  return cleaned.length > 0 ? cleaned : null
}

/** Sanitize a client-supplied race mode, returning null when invalid. */
export function sanitizeMode(mode: unknown): RaceMode | null {
  return (RACE_MODES as readonly string[]).includes(mode as string)
    ? (mode as RaceMode)
    : null
}

/**
 * Sanitize a client-supplied character offset for opponent carets. Must be a
 * non-negative integer clamped to the race text length; anything else falls
 * back to the nearest valid value so a malformed client can't corrupt the
 * broadcast for everyone else.
 */
export function sanitizeCharIndex(value: unknown, max: number): number {
  const bound = Math.max(0, Math.floor(max))
  if (typeof value !== "number" || !Number.isFinite(value)) return 0
  const n = Math.floor(value)
  return Math.min(Math.max(n, 0), bound)
}

/** Sanitize a client-supplied difficulty, returning null when invalid. */
export function sanitizeDifficulty(difficulty: unknown): Difficulty | null {
  return (DIFFICULTIES as readonly string[]).includes(difficulty as string)
    ? (difficulty as Difficulty)
    : null
}

/**
 * Sanitize a client-supplied word/time option. Accepts the UI's exact option
 * values, or any integer within the supported range (the options lists are a
 * product decision; the range is the security boundary).
 */
export function sanitizeOption(
  value: unknown,
  allowed: readonly number[],
  min: number,
  max: number
): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null
  if (value < min || value > max) return null
  return value
}
