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
export const PROGRESS_THROTTLE_MS = 500
export const PROGRESS_BROADCAST_MS = 125
export const DISCONNECT_GRACE_MS = 10 * 1000
export const MATCHMAKER_ROOM_ID = "__velokey_matchmaker__"

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
  wordOption: number    // e.g. 25, 50, 100 (used when mode === "words")
  timeOption: number    // e.g. 15, 30, 60 (used when mode === "time")
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
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  player: Player
  placement: number // 1, 2, 3, ...
  wpm: number
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
}

export interface FinishMsg {
  type: "finish"
  wpm: number
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
}

export type ServerMessage =
  | RoomStateMsg
  | CountdownMsg
  | WordsMsg
  | ProgressBroadcastMsg
  | ResultsMsg
  | ErrorMsg
  | PlayerJoinedMsg
  | PlayerLeftMsg
  | QueueStatusMsg
  | MatchedMsg
