// ── PartyKit Race Room Server ─────────────────────────────────────────────────
// Manages the lifecycle of a multiplayer typing race room.
// Runs on PartyKit's edge runtime — one instance per room.

import type * as Party from "partykit/server"
import type {
  ClientMessage,
  ServerMessage,
  Player,
  RoomConfig,
  RoomStatus,
  RaceProgress,
  LeaderboardEntry,
  FinishMsg,
  MatchmakeMsg,
  TournamentStateMsg,
} from "../shared/race-protocol"
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  COUNTDOWN_SECONDS,
  ROOM_TIMEOUT_MS,
  DISCONNECT_GRACE_MS,
  MATCHMAKER_ROOM_ID,
  PROGRESS_BROADCAST_MS,
  MATCH_BATCH_SIZE,
  MATCH_BATCH_WINDOW_MS,
  MATCH_BATCH_MIN_SIZE,
  READY_AUTO_START_MS,
} from "../shared/race-protocol"
import { validateResultStats } from "../shared/result-validation"
import { generateRaceWords } from "../shared/race-words"
import { rankLeaderboard } from "../shared/race-standings"
import {
  createTournament,
  applyMatchResult,
  nextMatchup,
  type TournamentState,
} from "../lib/tournament"
import { randomPick } from "../lib/secure-random"
import {
  TIME_OPTIONS,
  WORD_OPTIONS,
  sanitizeColor,
  sanitizeDifficulty,
  sanitizeMode,
  sanitizeNickname,
  sanitizeOption,
  sanitizeCharIndex,
} from "../shared/race-protocol"

// Time mode generates this many words up front so nobody runs out mid-race.
const TIME_MODE_GENERATED_WORDS = 200

/** Better-placed of the two match players, or the survivor on walkover. */
function raceWinnerId(
  entries: LeaderboardEntry[],
  idA: string,
  idB: string
): string | null {
  const entryA = entries.find((e) => e.player.id === idA)
  const entryB = entries.find((e) => e.player.id === idB)
  if (entryA && entryB) return entryA.placement < entryB.placement ? idA : idB
  return entryA?.player.id ?? entryB?.player.id ?? null
}

/** If one pairing member left, the other wins by walkover; null = both gone. */
function walkoverSurvivor(
  alive: { has(id: string): boolean },
  idA: string,
  idB: string
): string | null {
  if (alive.has(idA)) return idA
  if (alive.has(idB)) return idB
  return null
}

/**
 * Whitelist-sanitize a room-config payload from the HTTP endpoint or a
 * matchmake message. Returns only the fields that are valid; invalid or
 * missing fields are omitted so existing state is kept.
 */
export function sanitizeRoomConfig(
  config: Partial<RoomConfig> | Record<string, unknown>
): Partial<RoomConfig> {
  const out: Partial<RoomConfig> = {}
  const mode = sanitizeMode(config.mode)
  if (mode) out.mode = mode
  const wordOption = sanitizeOption(config.wordOption, WORD_OPTIONS, 1, 1000)
  if (wordOption !== null) out.wordOption = wordOption
  const timeOption = sanitizeOption(config.timeOption, TIME_OPTIONS, 1, 3600)
  if (timeOption !== null) out.timeOption = timeOption
  const difficulty = sanitizeDifficulty(config.difficulty)
  if (difficulty) out.difficulty = difficulty
  if (typeof config.isQuickMatch === "boolean")
    out.isQuickMatch = config.isQuickMatch
  return out
}

// ── Room State ───────────────────────────────────────────────────────────────

interface RoomState {
  players: Map<string, Player & { connectionId: string; sessionId: string }>
  status: RoomStatus
  config: RoomConfig
  hostId: string
  words: string[]
  progress: Map<string, RaceProgress>
  finishData: Map<string, FinishMsg>
  countdownTimer: ReturnType<typeof setInterval> | null
  countdownValue: number
  raceStartTime: number
  /** Auto-end timer for time mode — must be cleared on early end/rematch. */
  raceEndTimer: ReturnType<typeof setTimeout> | null
  inactivityTimer: ReturnType<typeof setTimeout> | null
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>
  progressBroadcastTimer: ReturnType<typeof setTimeout> | null
  /** Active single-elimination tournament; null when none is running. */
  tournament: TournamentState | null
  /** Auto-start timer armed when every non-host player is ready. */
  readyCheckTimer: ReturnType<typeof setTimeout> | null
  /** Whether an auto-start countdown was already fired this lobby. */
  autoStartFired: boolean
  /** Player ID reserved to play the current tournament match.
  /// The other live pairing member is still allowed in as spectator. */
  tournamentMatchA: string | null
  tournamentMatchB: string | null
}

interface MatchQueueEntry {
  connection: Party.Connection
  connectionId: string
  sessionId: string
  nickname: string
  color: string
  config: Pick<RoomConfig, "mode" | "wordOption" | "timeOption" | "difficulty">
  joinedAt: number
}

/** A batch of queued players waiting to be placed into a shared room. */
interface MatchBatch {
  config: MatchQueueEntry["config"]
  entries: MatchQueueEntry[]
  /** Earliest time the batch may be flushed. */
  flushAt: number
  timer: ReturnType<typeof setTimeout>
}

// ── Server ───────────────────────────────────────────────────────────────────

export default class RaceRoom implements Party.Server {
  state: RoomState
  private readonly isMatchmaker: boolean
  private matchQueue = new Map<string, MatchQueueEntry>()
  /** Quick-match batches keyed by config signature. */
  private matchBatches = new Map<string, MatchBatch>()
  /** Serialized last progress payload — dirty-flag for S3 broadcast skip. */
  private lastProgressSnapshot = ""

  constructor(readonly room: Party.Room) {
    this.isMatchmaker = room.id === MATCHMAKER_ROOM_ID
    this.state = {
      players: new Map(),
      status: "lobby",
      config: {
        mode: "words",
        wordOption: 25,
        timeOption: 30,
        difficulty: "easy",
        isQuickMatch: false,
      },
      hostId: "",
      words: [],
      progress: new Map(),
      finishData: new Map(),
      countdownTimer: null,
      countdownValue: COUNTDOWN_SECONDS,
      readyCheckTimer: null,
      autoStartFired: false,
      raceStartTime: 0,
      raceEndTimer: null,
      inactivityTimer: null,
      disconnectTimers: new Map(),
      progressBroadcastTimer: null,
      tournament: null,
      tournamentMatchA: null,
      tournamentMatchB: null,
    }
    this.resetInactivityTimer()
  }

  // ── HTTP API for Room Configuration ───────────────────────────────────────

  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      })
    }

    if (req.method === "POST") {
      // S8 hardening: when an allowlist is configured, only accept room
      // configuration from those origins. PartyKit env vars support a
      // comma-separated list, e.g. ALLOWED_ORIGINS="https://velokey.app".
      const allowed = String(this.room.env.ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
      const origin = req.headers.get("origin")
      if (allowed.length > 0 && (!origin || !allowed.includes(origin))) {
        return new Response("Forbidden", { status: 403 })
      }
      try {
        const config = (await req.json()) as Partial<RoomConfig>
        const sanitized = sanitizeRoomConfig(config)
        this.state.config = { ...this.state.config, ...sanitized }

        return new Response(
          JSON.stringify({ ok: true, config: this.state.config }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        )
      } catch {
        return new Response("Bad Request", { status: 400 })
      }
    }

    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          status: this.state.status,
          playerCount: this.state.players.size,
          config: this.state.config,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    return new Response("Not Found", { status: 404 })
  }

  // ── Connection lifecycle ─────────────────────────────────────────────────

  onConnect(_conn: Party.Connection, _ctx: Party.ConnectionContext) {
    // Don't auto-add — wait for "join" message with nickname/color
    this.resetInactivityTimer()
  }

  onClose(conn: Party.Connection) {
    this.handleConnectionLost(conn)
  }

  onError(conn: Party.Connection) {
    this.handleConnectionLost(conn)
  }

  private handleConnectionLost(conn: Party.Connection) {
    if (this.isMatchmaker) {
      this.removeFromMatchQueue(conn.id)
      return
    }
    this.handleDisconnect(conn.id)
  }

  // ── Message handling ─────────────────────────────────────────────────────

  onMessage(message: string, sender: Party.Connection) {
    this.resetInactivityTimer()
    let msg: ClientMessage
    try {
      msg = JSON.parse(message)
    } catch {
      return
    }

    if (this.isMatchmaker) {
      this.handleMatchmakerMessage(msg, sender)
      return
    }

    switch (msg.type) {
      case "join":
        this.handleJoin(
          sender,
          sanitizeNickname(msg.nickname),
          sanitizeColor(msg.color),
          sanitizeNickname(msg.sessionId) // opaque token, same charset rules apply
        )
        break
      case "ready":
        this.handleReady(sender.id, msg.ready)
        break
      case "start":
        this.handleStart(sender.id)
        break
      case "progress":
        this.handleProgress(sender.id, msg)
        break
      case "finish":
        this.handleFinish(sender.id, msg)
        break
      case "leave":
        this.handleDisconnect(sender.id, true)
        break
      case "rematch":
        this.handleRematch(sender.id)
        break
      case "tournament_create":
        this.handleTournamentCreate(sender.id)
        break
      case "tournament_next":
        this.handleTournamentNext(sender.id)
        break
      case "tournament_cancel":
        this.handleTournamentCancel(sender.id)
        break
    }
  }

  // ── Join ──────────────────────────────────────────────────────────────────

  private handleJoin(
    conn: Party.Connection,
    nickname: string | null,
    color: string,
    sessionId: string | null
  ) {
    const previous = Array.from(this.state.players.values()).find(
      (player) => player.sessionId === sessionId
    )
    if (previous) {
      const oldConnectionId = previous.connectionId
      const disconnectTimer = this.state.disconnectTimers.get(oldConnectionId)
      if (disconnectTimer) clearTimeout(disconnectTimer)
      this.state.disconnectTimers.delete(oldConnectionId)
      this.state.players.delete(oldConnectionId)
      previous.id = conn.id
      previous.connectionId = conn.id
      previous.connected = true
      this.state.players.set(conn.id, previous)
      if (this.state.hostId === oldConnectionId) this.state.hostId = conn.id

      const progress = this.state.progress.get(oldConnectionId)
      if (progress) {
        this.state.progress.delete(oldConnectionId)
        progress.playerId = conn.id
        this.state.progress.set(conn.id, progress)
      }
      const finish = this.state.finishData.get(oldConnectionId)
      if (finish) {
        this.state.finishData.delete(oldConnectionId)
        this.state.finishData.set(conn.id, finish)
      }
      this.broadcastRoomState()
      if (this.state.status === "countdown" || this.state.status === "racing") {
        this.send(conn, {
          type: "words",
          words: this.state.words,
          mode: this.state.config.mode,
          timeOption: this.state.config.timeOption,
          wordOption: this.state.config.wordOption,
        })
      }
      return
    }
    if (!nickname || !sessionId) {
      this.send(conn, { type: "error", message: "Invalid join payload" })
      return
    }
    if (this.state.status !== "lobby") {
      this.send(conn, { type: "error", message: "Race already in progress" })
      return
    }
    if (this.state.players.size >= MAX_PLAYERS) {
      this.send(conn, { type: "error", message: "Room is full" })
      return
    }

    const isHost = this.state.players.size === 0
    const player: Player & { connectionId: string; sessionId: string } = {
      id: conn.id,
      connectionId: conn.id,
      sessionId,
      nickname,
      color,
      isHost,
      ready: false,
      connected: true,
    }

    if (isHost) {
      this.state.hostId = conn.id
    }

    this.state.players.set(conn.id, player)

    // A fresh join is never ready — cancel any pending ready-check
    // auto-start so the countdown doesn't fire under the newcomer.
    this.evaluateReadyAutoStart()

    // Broadcast to everyone
    this.broadcastRoomState()
    this.broadcast({
      type: "player_joined",
      player: this.stripConnectionId(player),
    })
  }

  // ── Ready ────────────────────────────────────────────────────────────────

  private handleReady(connectionId: string, ready: boolean) {
    const player = this.state.players.get(connectionId)
    if (!player) return
    player.ready = ready
    this.broadcastRoomState()
    this.evaluateReadyAutoStart()
  }

  /**
   * Ready-check auto-start: when every non-host player is ready, start the
   * countdown automatically after a short grace period so nobody has to sit
   * waiting for the host to click. Any un-ready or newly joined player
   * cancels the pending auto-start. Host-only manual start still works.
   */
  private evaluateReadyAutoStart() {
    if (this.state.status !== "lobby") return
    if (this.state.config.isQuickMatch) return
    // Tournament brackets advance via the host's "Next Match" control —
    // never auto-start a plain race under an active bracket.
    if (this.state.tournament) return
    const nonHosts = [...this.state.players.values()].filter(
      (p) => p.connectionId !== this.state.hostId
    )
    const allReady =
      nonHosts.length > 0 && nonHosts.every((p) => p.ready && p.connected)
    if (allReady && !this.state.autoStartFired) {
      this.state.autoStartFired = true
      this.broadcast({
        type: "info",
        message: "All players ready — starting automatically…",
      })
      this.state.readyCheckTimer = setTimeout(() => {
        this.state.readyCheckTimer = null
        if (this.state.status === "lobby" && this.allNonHostsStillReady()) {
          this.beginRaceCountdown()
        } else {
          this.state.autoStartFired = false
        }
      }, READY_AUTO_START_MS)
    } else if (!allReady && this.state.readyCheckTimer) {
      clearTimeout(this.state.readyCheckTimer)
      this.state.readyCheckTimer = null
      this.state.autoStartFired = false
    }
  }

  private allNonHostsStillReady(): boolean {
    const nonHosts = [...this.state.players.values()].filter(
      (p) => p.connectionId !== this.state.hostId
    )
    return nonHosts.length > 0 && nonHosts.every((p) => p.ready && p.connected)
  }

  /** Cancel any pending ready-check auto-start (status left the lobby). */
  private cancelReadyAutoStart() {
    if (this.state.readyCheckTimer) {
      clearTimeout(this.state.readyCheckTimer)
      this.state.readyCheckTimer = null
    }
    this.state.autoStartFired = false
  }

  // ── Start ────────────────────────────────────────────────────────────────

  private handleStart(connectionId: string) {
    if (connectionId !== this.state.hostId) return
    if (this.state.status !== "lobby") return
    // Custom rooms allow solo racing (practice), but quick-match rooms exist
    // only to race others: require the minimum configured player count.
    if (
      this.state.config.isQuickMatch &&
      this.state.players.size < MIN_PLAYERS
    ) {
      const starter = this.room.getConnection<unknown>(connectionId)
      if (starter)
        this.send(starter, {
          type: "error",
          message: `Waiting for at least ${MIN_PLAYERS} players`,
        })
      return
    }

    this.beginRaceCountdown()
  }

  /**
   * Shared by host-start and the ready-check auto-start: generate the race
   * text, reset progress, and run the 3-2-1 countdown. Must only be called
   * while status === "lobby" (callers guard this).
   */
  private beginRaceCountdown() {
    this.cancelReadyAutoStart()

    // Generate words. For time mode generate plenty so nobody runs out.
    const wordCount =
      this.state.config.mode === "time"
        ? TIME_MODE_GENERATED_WORDS
        : this.state.config.wordOption
    this.state.words = generateRaceWords(
      wordCount,
      this.state.config.difficulty
    )

    // Deliver the text before the countdown so every client can render and focus
    // without racing the first keystroke against a network message.
    this.broadcast({
      type: "words",
      words: this.state.words,
      mode: this.state.config.mode,
      timeOption: this.state.config.timeOption,
      wordOption: this.state.config.wordOption,
    })

    // Reset progress
    this.state.progress.clear()
    this.state.finishData.clear()
    this.lastProgressSnapshot = "" // force a fresh broadcast for the new race
    const matchA = this.state.tournamentMatchA
    const matchB = this.state.tournamentMatchB
    const tournamentMatchLive = matchA != null && matchB != null
    for (const [id] of this.state.players) {
      // Tournament match: only the two pairing members race — everyone else
      // is a spectator (no progress entry ⇒ their input is ignored server-side
      // and they don't block checkRaceEnd).
      if (tournamentMatchLive && id !== matchA && id !== matchB) continue
      this.state.progress.set(id, {
        playerId: id,
        wordIndex: 0,
        totalWords: this.state.words.length,
        wpm: 0,
        accuracy: 100,
        finished: false,
        elapsedSeconds: 0,
      })
    }

    // Start countdown
    this.state.status = "countdown"
    this.state.countdownValue = COUNTDOWN_SECONDS
    this.broadcastRoomState()

    this.state.countdownTimer = setInterval(() => {
      this.broadcast({ type: "countdown", value: this.state.countdownValue })
      if (this.state.countdownValue <= 0) {
        if (this.state.countdownTimer) clearInterval(this.state.countdownTimer)
        this.state.countdownTimer = null
        this.state.status = "racing"
        this.state.raceStartTime = Date.now()

        this.broadcastRoomState()

        // For time mode, set a timer to auto-end the race. Stored so an
        // early end or rematch clears it — a stale timer would otherwise
        // kill a freshly restarted race.
        if (this.state.config.mode === "time") {
          if (this.state.raceEndTimer) clearTimeout(this.state.raceEndTimer)
          this.state.raceEndTimer = setTimeout(
            () => {
              this.state.raceEndTimer = null
              if (this.state.status === "racing") {
                this.endRace()
              }
            },
            (this.state.config.timeOption + 1) * 1000
          )
        }
      }
      this.state.countdownValue--
    }, 1000)
  }

  // ── Progress ─────────────────────────────────────────────────────────────

  private handleProgress(
    connectionId: string,
    msg: {
      wordIndex: number
      totalWords: number
      wpm: number
      accuracy: number
      charIndex?: number
    }
  ) {
    if (this.state.status !== "racing") return
    const existing = this.state.progress.get(connectionId)
    if (!existing || existing.finished) return

    existing.wordIndex = msg.wordIndex
    existing.totalWords = msg.totalWords
    existing.wpm = msg.wpm
    existing.accuracy = msg.accuracy
    existing.charIndex = sanitizeCharIndex(
      msg.charIndex,
      this.state.words.join(" ").length
    )
    existing.elapsedSeconds = (Date.now() - this.state.raceStartTime) / 1000

    this.scheduleProgressBroadcast()
  }

  // ── Finish ───────────────────────────────────────────────────────────────

  private handleFinish(connectionId: string, msg: FinishMsg) {
    if (this.state.status !== "racing") return
    const progress = this.state.progress.get(connectionId)
    if (!progress || progress.finished) return

    // Server-side anti-cheat: the client's numbers are a claim, not truth.
    // Run the same heuristics the web client uses (shared/result-validation)
    // and reject impossible/spoofed results before they reach the leaderboard.
    const validation = validateResultStats(
      {
        wpm: msg.wpm,
        raw: msg.raw,
        accuracy: msg.accuracy,
        correctChars: msg.correctChars,
        incorrectChars: msg.incorrectChars,
        extraChars: 0,
        elapsedSeconds: msg.elapsedSeconds,
        wpmHistory: msg.wpmHistory,
      },
      msg.consistency
    )
    const sender = this.room.getConnection<unknown>(connectionId)
    if (!validation.valid) {
      if (sender)
        this.send(sender, {
          type: "error",
          message: `Result rejected by server validation (${validation.reason})`,
        })
      // Count as finished with zeroed stats so the race can still end.
      progress.finished = true
      progress.wpm = 0
      progress.accuracy = 0
      progress.elapsedSeconds = 0
      this.flushProgressBroadcast()
      this.checkRaceEnd()
      return
    }

    // Trust the server clock, not the client's, for elapsed time.
    const serverElapsedSeconds = (Date.now() - this.state.raceStartTime) / 1000

    progress.finished = true
    progress.wpm = msg.wpm
    progress.accuracy = msg.accuracy
    progress.elapsedSeconds = serverElapsedSeconds
    this.state.finishData.set(connectionId, {
      ...msg,
      elapsedSeconds: serverElapsedSeconds,
    })

    this.flushProgressBroadcast()

    this.checkRaceEnd()
  }

  /** Ends the race when every tracked player has finished. */
  private checkRaceEnd() {
    const allFinished = Array.from(this.state.progress.values()).every(
      (p) => p.finished
    )
    if (allFinished) {
      this.endRace()
    }
  }

  // ── End Race ─────────────────────────────────────────────────────────────

  private endRace() {
    this.state.status = "results"
    this.cancelReadyAutoStart()
    if (this.state.countdownTimer) {
      clearInterval(this.state.countdownTimer)
      this.state.countdownTimer = null
    }
    if (this.state.raceEndTimer) {
      clearTimeout(this.state.raceEndTimer)
      this.state.raceEndTimer = null
    }

    // Build leaderboard
    const entries: LeaderboardEntry[] = []
    for (const [id, player] of this.state.players) {
      const progress = this.state.progress.get(id)
      const finish = this.state.finishData.get(id)

      entries.push({
        player: this.stripConnectionId(player),
        placement: 0, // assigned below
        wpm: finish?.wpm ?? progress?.wpm ?? 0,
        raw: finish?.raw ?? 0,
        accuracy: finish?.accuracy ?? progress?.accuracy ?? 100,
        consistency: finish?.consistency ?? 0,
        elapsedSeconds: finish?.elapsedSeconds ?? progress?.elapsedSeconds ?? 0,
        correctChars: finish?.correctChars ?? 0,
        incorrectChars: finish?.incorrectChars ?? 0,
      })
    }
    rankLeaderboard(entries, this.state.config.mode)

    // Tournament match just finished? Feed the winner into the bracket.
    this.settleTournamentMatch(entries)

    this.broadcast({ type: "results", leaderboard: entries })
    this.broadcastRoomState()
  }

  /**
   * A tournament match just finished: record the winner in the bracket.
   * Winner = better-placed of the two match players (walkover when one is
   * missing); the results screen stays up and the bracket updates live.
   */
  private settleTournamentMatch(entries: LeaderboardEntry[]) {
    const tournament = this.state.tournament
    if (!tournament || tournament.champion) return
    const idA = this.state.tournamentMatchA
    const idB = this.state.tournamentMatchB
    if (idA && idB) {
      const winnerId = raceWinnerId(entries, idA, idB)
      if (winnerId) applyMatchResult(tournament, winnerId)
    }
    this.state.tournamentMatchA = null
    this.state.tournamentMatchB = null
    this.broadcastTournamentState()
  }

  // ── Rematch ──────────────────────────────────────────────────────────────

  private handleRematch(connectionId: string) {
    // Any player can take everyone back to the lobby for another race —
    // waiting on the host alone left losers stranded on the results screen.
    const player = this.state.players.get(connectionId)
    if (!player) return
    if (this.state.status !== "results") return
    this.resetToLobby()
  }

  /** Reset a finished race back to the lobby (rematch + tournament flow). */
  private resetToLobby() {
    // Reset to lobby
    this.state.status = "lobby"
    this.state.words = []
    this.state.progress.clear()
    this.state.finishData.clear()
    if (this.state.raceEndTimer) {
      clearTimeout(this.state.raceEndTimer)
      this.state.raceEndTimer = null
    }
    this.state.raceStartTime = 0
    for (const [, player] of this.state.players) {
      player.ready = false
    }
    // Allow the ready-check to arm again for the next round.
    this.cancelReadyAutoStart()
    this.broadcastRoomState()
  }

  // ── Disconnect ───────────────────────────────────────────────────────────

  private handleDisconnect(connectionId: string, immediate = false) {
    const player = this.state.players.get(connectionId)
    if (!player) return

    if (!immediate) {
      this.startDisconnectGracePeriod(player, connectionId)
      return
    }

    this.removePlayer(connectionId)
  }

  /** Mark the player as disconnected and schedule hard removal after the grace window. */
  private startDisconnectGracePeriod(player: Player, connectionId: string) {
    player.connected = false
    this.broadcastRoomState()
    // A disconnected player can no longer be "ready" — cancel a pending
    // ready-check auto-start so the countdown doesn't fire without them.
    this.evaluateReadyAutoStart()
    const existingTimer = this.state.disconnectTimers.get(connectionId)
    if (existingTimer) clearTimeout(existingTimer)
    this.state.disconnectTimers.set(
      connectionId,
      setTimeout(() => {
        this.state.disconnectTimers.delete(connectionId)
        this.handleDisconnect(connectionId, true)
      }, DISCONNECT_GRACE_MS)
    )
  }

  /** Hard-remove a disconnected player, migrating host and resetting an empty room. */
  private removePlayer(connectionId: string) {
    this.state.players.delete(connectionId)
    this.state.progress.delete(connectionId)
    this.state.finishData.delete(connectionId)
    const disconnectTimer = this.state.disconnectTimers.get(connectionId)
    if (disconnectTimer) clearTimeout(disconnectTimer)
    this.state.disconnectTimers.delete(connectionId)

    const newHostId = this.migrateHostIfNeeded(connectionId)

    this.broadcast({
      type: "player_left",
      playerId: connectionId,
      newHostId,
    })
    this.broadcastRoomState()

    // If mid-race, check if all remaining players finished
    if (this.state.status === "racing" && this.state.players.size > 0) {
      this.checkRaceEnd()
    }

    // When the last player leaves mid-race, reset the room so a fresh join
    // doesn't hit "Race already in progress" on a zombie room.
    if (this.state.players.size === 0 && this.state.status !== "lobby") {
      this.resetEmptyRoom()
    }
  }

  /** Promote the first remaining player to host when the host leaves. */
  private migrateHostIfNeeded(leavingConnectionId: string): string | undefined {
    if (
      leavingConnectionId !== this.state.hostId ||
      this.state.players.size === 0
    )
      return undefined
    const firstPlayer = this.state.players.entries().next().value
    if (!firstPlayer) return undefined
    const [id, p] = firstPlayer
    p.isHost = true
    this.state.hostId = id
    return id
  }

  /** Reset a room abandoned mid-race so a fresh join doesn't hit a zombie room. */
  private resetEmptyRoom() {
    this.state.status = "lobby"
    this.state.words = []
    this.state.progress.clear()
    this.state.finishData.clear()
    this.state.tournament = null
    this.state.tournamentMatchA = null
    this.state.tournamentMatchB = null
    this.cancelReadyAutoStart()
    if (this.state.countdownTimer) {
      clearInterval(this.state.countdownTimer)
      this.state.countdownTimer = null
    }
    if (this.state.raceEndTimer) {
      clearTimeout(this.state.raceEndTimer)
      this.state.raceEndTimer = null
    }
    this.state.raceStartTime = 0
  }

  // ── Tournament (host-driven single elimination) ───────────────────────

  private handleTournamentCreate(connectionId: string) {
    if (connectionId !== this.state.hostId) return
    if (this.state.status !== "lobby") return
    if (this.state.tournament) return

    const playerIds = Array.from(this.state.players.keys())
    try {
      this.state.tournament = createTournament(
        playerIds,
        this.state.config.mode,
        this.state.config.wordOption,
        this.state.config.timeOption,
        this.state.config.difficulty
      )
    } catch {
      const host = this.room.getConnection<unknown>(connectionId)
      if (host)
        this.send(host, {
          type: "error",
          message: "Tournament needs at least 4 players",
        })
      return
    }

    this.broadcastTournamentState()
    // Jump straight into the first match.
    this.handleTournamentNext(connectionId)
  }

  /**
   * Start the next tournament match as a normal race between the two live
   * pairing members (everyone else stays in the room as a spectator). The
   * race ends via the standard flow; endRace() detects tournament mode and
   * applies the result instead of finishing the tournament.
   */
  private handleTournamentNext(connectionId: string) {
    if (connectionId !== this.state.hostId) return
    // Accept "results" (previous match just ended) and reset to lobby first.
    if (this.state.status === "results") {
      this.resetToLobby()
    }
    if (this.state.status !== "lobby") return
    const tournament = this.state.tournament
    if (!tournament || tournament.champion) return

    const matchup = nextMatchup(tournament)
    if (!matchup) {
      this.notifyNoPendingMatch(connectionId)
      return
    }

    // Guard against players who left mid-tournament: their opponent wins by
    // walkover and we keep advancing until a real pairing is found.
    const bothAlive =
      this.state.players.has(matchup.a) && this.state.players.has(matchup.b)
    if (
      !bothAlive &&
      this.resolveTournamentWalkover(connectionId, tournament, matchup)
    ) {
      return
    }

    this.state.tournamentMatchA = matchup.a
    this.state.tournamentMatchB = matchup.b
    this.handleStart(connectionId)
  }

  private notifyNoPendingMatch(connectionId: string) {
    const host = this.room.getConnection<unknown>(connectionId)
    if (host)
      this.send(host, {
        type: "error",
        message: "No pending tournament match",
      })
  }

  /**
   * A pairing member left: award the walkover (or cancel on double absence)
   * and keep advancing. Returns true when the situation was handled and the
   * caller should stop (champion crowned or tournament cancelled).
   */
  private resolveTournamentWalkover(
    connectionId: string,
    tournament: TournamentState,
    matchup: { a: string; b: string }
  ): boolean {
    const survivor = walkoverSurvivor(this.state.players, matchup.a, matchup.b)
    if (survivor) {
      applyMatchResult(tournament, survivor)
      this.broadcastTournamentState()
      if (tournament.champion) return true
      this.handleTournamentNext(connectionId)
      return true
    }
    // Both gone — cancel rather than deadlock.
    this.state.tournament = null
    this.broadcastTournamentState()
    return true
  }

  private handleTournamentCancel(connectionId: string) {
    if (connectionId !== this.state.hostId) return
    if (!this.state.tournament) return
    this.state.tournament = null
    this.state.tournamentMatchA = null
    this.state.tournamentMatchB = null
    this.broadcastTournamentState()
  }

  private broadcastTournamentState() {
    const t = this.state.tournament
    const msg: TournamentStateMsg = {
      type: "tournament_state",
      tournament: t
        ? {
            players: t.players,
            rounds: t.rounds,
            currentRound: t.currentRound,
            nextMatchIndex: t.nextMatchIndex,
            config: {
              mode: t.config.mode as RoomConfig["mode"],
              wordOption: t.config.wordOption,
              timeOption: t.config.timeOption,
              difficulty: t.config.difficulty,
            },
            champion: t.champion,
          }
        : null,
    }
    this.broadcast(msg)
  }

  // ── Quick matchmaking (the dedicated coordinator room) ──────────────────

  private handleMatchmakerMessage(
    msg: ClientMessage,
    sender: Party.Connection
  ) {
    if (msg.type === "match_cancel") {
      this.removeFromMatchQueue(sender.id)
      return
    }
    if (msg.type !== "matchmake") return

    this.removeFromMatchQueue(sender.id)
    const entry = this.buildMatchQueueEntry(msg, sender)
    if (!entry) return

    // Batch matchmaking: instead of pairing the first compatible queued
    // player 1:1 (one Durable Object per pair), collect players into a
    // batch and place them together in a single room once the batch is
    // full or the window expires. Fuller rooms, fewer rooms.
    const key = this.matchConfigKey(entry.config)
    const batch = this.acquireMatchBatch(key, entry.config)
    batch.entries.push(entry)

    if (batch.entries.length >= MATCH_BATCH_SIZE) {
      clearTimeout(batch.timer)
      this.placeBatch(key)
      return
    }

    this.broadcastQueueStatus()
  }

  private buildMatchQueueEntry(
    msg: MatchmakeMsg,
    sender: Party.Connection
  ): MatchQueueEntry | null {
    const nickname = sanitizeNickname(msg.nickname)
    const sessionId = sanitizeNickname(msg.sessionId)
    if (!nickname || !sessionId) return null
    return {
      connection: sender,
      connectionId: sender.id,
      sessionId,
      nickname,
      color: sanitizeColor(msg.color),
      config: {
        ...sanitizeRoomConfig(msg.config),
        mode: sanitizeMode(msg.config.mode) ?? "words",
        wordOption:
          sanitizeOption(msg.config.wordOption, WORD_OPTIONS, 1, 1000) ?? 25,
        timeOption:
          sanitizeOption(msg.config.timeOption, TIME_OPTIONS, 1, 3600) ?? 30,
        difficulty: sanitizeDifficulty(msg.config.difficulty) ?? "easy",
      },
      joinedAt: Date.now(),
    }
  }

  /**
   * Return the pending batch for `key`, creating it — seeded with compatible
   * players still waiting in the queue from a previous under-minimum flush,
   * so they are not orphaned — when none exists yet.
   */
  private acquireMatchBatch(
    key: string,
    config: MatchQueueEntry["config"]
  ): MatchBatch {
    const existing = this.matchBatches.get(key)
    if (existing) return existing

    const waiting = Array.from(this.matchQueue.values()).filter(
      (e) => this.matchConfigKey(e.config) === key
    )
    for (const e of waiting) this.matchQueue.delete(e.connectionId)
    const timer = setTimeout(
      () => this.flushMatchBatch(key),
      MATCH_BATCH_WINDOW_MS
    )
    const batch: MatchBatch = {
      config,
      entries: waiting,
      flushAt: Date.now() + MATCH_BATCH_WINDOW_MS,
      timer,
    }
    this.matchBatches.set(key, batch)
    return batch
  }

  private matchConfigKey(config: MatchQueueEntry["config"]): string {
    return `${config.mode}:${config.wordOption}:${config.timeOption}:${config.difficulty}`
  }

  /** Flush a batch whose window expired, placing whatever players it holds. */
  private flushMatchBatch(key: string) {
    const batch = this.matchBatches.get(key)
    if (!batch) return
    this.matchBatches.delete(key)
    if (batch.entries.length >= MATCH_BATCH_MIN_SIZE) {
      this.placeEntries(batch.entries, batch.config)
    } else {
      // Too few players to start a fair race: return them to the queue so
      // the next compatible join can pair with them.
      for (const entry of batch.entries) {
        if (entry.connection.readyState === 1)
          this.matchQueue.set(entry.connectionId, entry)
      }
      this.broadcastQueueStatus()
    }
  }

  /** Remove a full batch from tracking and place its players in one room. */
  private placeBatch(key: string) {
    const batch = this.matchBatches.get(key)
    if (!batch) return
    this.matchBatches.delete(key)
    this.placeEntries(batch.entries, batch.config)
  }

  /**
   * Assign a room code and notify every entry in the batch. Codes are
   * probed for emptiness first (S7) so a colliding code can never drop
   * players into a stranger's live room.
   */
  private async placeEntries(
    entries: MatchQueueEntry[],
    config: MatchQueueEntry["config"]
  ) {
    if (entries.length === 0) return
    const roomCode = await this.generateMatchRoomCode()
    const roomConfig: RoomConfig = { ...config, isQuickMatch: true }
    for (const entry of entries) {
      if (entry.connection.readyState === 1) {
        this.send(entry.connection, {
          type: "matched",
          roomCode,
          config: roomConfig,
          players: entries.length,
        })
      }
    }
    this.broadcastQueueStatus()
  }

  private removeFromMatchQueue(connectionId: string) {
    const wasQueued = this.matchQueue.delete(connectionId)
    // Also drop the player from any pending match batch they sit in.
    let wasBatched = false
    for (const [key, batch] of this.matchBatches) {
      const before = batch.entries.length
      batch.entries = batch.entries.filter(
        (e) => e.connectionId !== connectionId
      )
      if (batch.entries.length !== before) wasBatched = true
      // A batch that fell below the minimum will be flushed by its timer
      // into the queue; nothing else to do here.
      if (batch.entries.length === 0) {
        clearTimeout(batch.timer)
        this.matchBatches.delete(key)
      }
    }
    if (wasQueued || wasBatched) this.broadcastQueueStatus()
  }

  private broadcastQueueStatus() {
    const now = Date.now()
    let position = 0
    for (const entry of this.matchQueue.values()) {
      position += 1
      this.send(entry.connection, {
        type: "queue_status",
        position,
        waitMs: now - entry.joinedAt,
      })
    }
    // Batched players also want progress feedback while their window runs.
    for (const batch of this.matchBatches.values()) {
      for (const entry of batch.entries) {
        position += 1
        this.send(entry.connection, {
          type: "queue_status",
          position,
          waitMs: now - entry.joinedAt,
        })
      }
    }
  }

  /**
   * Generate a room code, verifying with an HTTP probe that the target room
   * does not already hold players (S7 collision guard). Retries a few times
   * before settling on the last candidate.
   */
  private async generateMatchRoomCode(): Promise<string> {
    const characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    const randomSuffix = () =>
      Array.from({ length: 4 }, () => randomPick([...characters])).join("")

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `VELO-${randomSuffix()}`
      if (candidate === this.room.id) continue // that's us (matchmaker)
      try {
        const stub = this.room.context.parties.main.get(candidate)
        const res = await stub.fetch("/")
        const info = (await res.json()) as { playerCount?: number }
        if ((info.playerCount ?? 0) === 0) return candidate
      } catch {
        // Probe failed — assume the room is unusable and retry.
        continue
      }
    }
    return `VELO-${randomSuffix()}`
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg))
  }

  private broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg))
  }

  private broadcastRoomState() {
    const players = Array.from(this.state.players.values()).map((p) =>
      this.stripConnectionId(p)
    )
    this.broadcast({
      type: "room_state",
      roomCode: this.room.id,
      players,
      hostId: this.state.hostId,
      status: this.state.status,
      config: this.state.config,
    })
  }

  private stripConnectionId(
    player: Player & { connectionId: string; sessionId: string }
  ): Player {
    // Public view: omit the server-only fields (never serialize them).
    return {
      id: player.id,
      nickname: player.nickname,
      color: player.color,
      isHost: player.isHost,
      ready: player.ready,
      connected: player.connected,
    }
  }

  private scheduleProgressBroadcast() {
    if (this.state.progressBroadcastTimer) return
    this.state.progressBroadcastTimer = setTimeout(
      () => this.flushProgressBroadcast(),
      PROGRESS_BROADCAST_MS
    )
  }

  private flushProgressBroadcast() {
    if (this.state.progressBroadcastTimer)
      clearTimeout(this.state.progressBroadcastTimer)
    this.state.progressBroadcastTimer = null
    // S3: skip the broadcast entirely when nothing visibly changed since
    // the last one. Idle observers no longer receive 8 msgs/sec of noise.
    const snapshot = JSON.stringify(Array.from(this.state.progress.values()))
    if (snapshot === this.lastProgressSnapshot) return
    this.lastProgressSnapshot = snapshot
    this.broadcast({
      type: "progress_broadcast",
      progress: Array.from(this.state.progress.values()),
    })
  }

  private resetInactivityTimer() {
    if (this.state.inactivityTimer) clearTimeout(this.state.inactivityTimer)
    this.state.inactivityTimer = setTimeout(() => {
      // Auto-close room after inactivity: notify any lingering sockets and
      // clear all state so the room returns to PartyKit's garbage collector.
      this.broadcast({
        type: "error",
        message: "Room closed due to inactivity",
      })
      this.state.players.clear()
      this.state.progress.clear()
      this.state.finishData.clear()
      this.state.tournament = null
      this.state.tournamentMatchA = null
      this.state.tournamentMatchB = null
      this.matchQueue.clear()
      for (const batch of this.matchBatches.values()) clearTimeout(batch.timer)
      this.matchBatches.clear()
      if (this.state.countdownTimer) {
        clearInterval(this.state.countdownTimer)
        this.state.countdownTimer = null
      }
      if (this.state.progressBroadcastTimer) {
        clearTimeout(this.state.progressBroadcastTimer)
        this.state.progressBroadcastTimer = null
      }
      this.cancelReadyAutoStart()
      for (const timer of this.state.disconnectTimers.values())
        clearTimeout(timer)
      this.state.disconnectTimers.clear()
      this.state.status = "lobby"
    }, ROOM_TIMEOUT_MS)
  }
}

// PartyKit requires this export shape
RaceRoom satisfies Party.Worker
