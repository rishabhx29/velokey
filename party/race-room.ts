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
} from "../lib/race-protocol"
import {
  MAX_PLAYERS,
  COUNTDOWN_SECONDS,
  ROOM_TIMEOUT_MS,
  DISCONNECT_GRACE_MS,
  MATCHMAKER_ROOM_ID,
  PROGRESS_BROADCAST_MS,
} from "../lib/race-protocol"

// ── Word generation (server-side, simplified) ────────────────────────────────
// We can't import `random-words` npm package in PartyKit edge runtime easily,
// so we use a built-in word list for races.

const EASY_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
  "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
  "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
  "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know",
  "take", "come", "could", "than", "look", "day", "had", "use", "find",
  "here", "give", "many", "well", "also", "new", "way", "may", "then",
  "some", "good", "them", "see", "other", "now", "only", "tell", "very",
  "even", "back", "any", "work", "first", "hand", "keep", "eye", "last",
  "long", "great", "old", "big", "high", "put", "end", "why", "ask",
  "men", "run", "small", "home", "read", "own", "door", "sure", "such",
  "try", "us", "again", "name", "play", "life", "few", "much", "set",
  "turn", "real", "leave", "off", "same", "help", "line", "city", "move",
  "live", "world", "next", "still", "late", "miss", "idea", "head", "need",
  "land", "best", "room", "part", "body", "air", "walk", "face", "book",
  "hear", "food", "sit", "tree", "stay", "dark", "full", "plan", "deep",
  "done", "call", "watch", "month", "side", "talk", "kind", "fact",
]

const MEDIUM_WORDS = [
  "number", "people", "water", "after", "before", "always", "should",
  "between", "change", "house", "never", "start", "school", "every",
  "begin", "light", "think", "place", "might", "point", "close", "night",
  "story", "child", "young", "group", "learn", "order", "under", "while",
  "answer", "paper", "music", "money", "serve", "thing", "study", "power",
  "letter", "mother", "father", "friend", "second", "follow", "carry",
  "system", "wonder", "state", "earth", "animal", "write", "stand",
  "cover", "river", "field", "force", "level", "sound", "above", "model",
  "along", "watch", "sense", "build", "plain", "share", "board", "class",
  "voice", "heart", "reach", "round", "dream", "table", "short", "raise",
  "cross", "break", "dance", "plant", "smile", "shape", "drive", "catch",
  "piece", "clear", "quite", "those", "image", "human", "least", "prove",
  "bring", "teach", "often", "cause", "ready", "since", "party", "train",
  "store", "offer", "total", "basic", "doing", "front", "value", "local",
]

const HARD_WORDS = [
  "absolute", "abstract", "academic", "accepted", "accident", "accurate",
  "achieved", "acquired", "activity", "actually", "addition", "adequate",
  "adjusted", "advanced", "affected", "afforded", "although", "analysis",
  "announce", "anything", "anywhere", "apparent", "appendix", "appetite",
  "applause", "approach", "approval", "argument", "arranged", "assembly",
  "assuming", "attached", "Atlantic", "autonomy", "bachelor", "backward",
  "balanced", "baseball", "bathroom", "becoming", "behavior", "believed",
  "benjamin", "billions", "blankets", "boarding", "borrowed", "boundary",
  "building", "bulletin", "campaign", "cardinal", "carrying", "casualty",
  "catalyst", "category", "cautious", "ceremony", "chairman", "chambers",
  "champion", "changing", "chapters", "chemical", "children", "choosing",
  "chronic", "circular", "civilian", "climbing", "clinical", "clothing",
  "coaching", "collapse", "colonial", "combined", "comeback", "commerce",
  "commonly", "communal", "compared", "compiler", "complete", "composed",
  "compound", "computer", "conclude", "concrete", "conflict", "congress",
  "conjunct", "conquest", "consider", "constant", "consumer", "contains",
  "contents", "continue", "contract", "contrary", "contrast", "controls",
]

function generateRaceWords(count: number, difficulty: "easy" | "medium" | "hard"): string[] {
  const pool = difficulty === "hard" ? HARD_WORDS : difficulty === "medium" ? MEDIUM_WORDS : EASY_WORDS
  const words: string[] = []
  const shuffled = [...pool]
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  let idx = 0
  while (words.length < count) {
    if (idx >= shuffled.length) idx = 0
    words.push(shuffled[idx])
    idx++
  }
  return words
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
  inactivityTimer: ReturnType<typeof setTimeout> | null
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>
  progressBroadcastTimer: ReturnType<typeof setTimeout> | null
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

// ── Server ───────────────────────────────────────────────────────────────────

export default class RaceRoom implements Party.Server {
  state: RoomState
  private readonly isMatchmaker: boolean
  private matchQueue = new Map<string, MatchQueueEntry>()

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
      raceStartTime: 0,
      inactivityTimer: null,
      disconnectTimers: new Map(),
      progressBroadcastTimer: null,
    }
    this.resetInactivityTimer()
  }

  // ── HTTP API for Room Configuration ───────────────────────────────────────
  
  static async onBeforeRequest(req: Party.Request) {
    return req
  }

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
      try {
        const config = (await req.json()) as Partial<RoomConfig>
        if (config.mode) this.state.config.mode = config.mode
        if (config.wordOption) this.state.config.wordOption = config.wordOption
        if (config.timeOption) this.state.config.timeOption = config.timeOption
        if (config.difficulty) this.state.config.difficulty = config.difficulty
        if (config.isQuickMatch !== undefined) this.state.config.isQuickMatch = config.isQuickMatch
        
        return new Response(JSON.stringify({ ok: true, config: this.state.config }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        })
      } catch (e) {
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
        },
      )
    }
    
    return new Response("Not Found", { status: 404 })
  }

  // ── Connection lifecycle ─────────────────────────────────────────────────

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Don't auto-add — wait for "join" message with nickname/color
    this.resetInactivityTimer()
  }

  onClose(conn: Party.Connection) {
    if (this.isMatchmaker) {
      this.removeFromMatchQueue(conn.id)
      return
    }
    this.handleDisconnect(conn.id)
  }

  onError(conn: Party.Connection) {
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
        this.handleJoin(sender, msg.nickname, msg.color, msg.sessionId)
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
    }
  }

  // ── Join ──────────────────────────────────────────────────────────────────

  private handleJoin(conn: Party.Connection, nickname: string, color: string, sessionId: string) {
    const previous = Array.from(this.state.players.values()).find((player) => player.sessionId === sessionId)
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
      nickname: nickname.slice(0, 20),
      color,
      isHost,
      ready: false,
      connected: true,
    }

    if (isHost) {
      this.state.hostId = conn.id
    }

    this.state.players.set(conn.id, player)

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
  }

  // ── Start ────────────────────────────────────────────────────────────────

  private handleStart(connectionId: string) {
    if (connectionId !== this.state.hostId) return
    if (this.state.status !== "lobby") return
    if (this.state.players.size < 1) return // Allow solo for testing; enforce MIN_PLAYERS in production

    // Generate words
    const wordCount = this.state.config.mode === "words"
      ? this.state.config.wordOption
      : 200 // For time mode, generate plenty of words
    this.state.words = generateRaceWords(wordCount, this.state.config.difficulty)

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
    for (const [id] of this.state.players) {
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

        // For time mode, set a timer to auto-end the race
        if (this.state.config.mode === "time") {
          setTimeout(() => {
            if (this.state.status === "racing") {
              this.endRace()
            }
          }, (this.state.config.timeOption + 1) * 1000)
        }
      }
      this.state.countdownValue--
    }, 1000)
  }

  // ── Progress ─────────────────────────────────────────────────────────────

  private handleProgress(connectionId: string, msg: { wordIndex: number; totalWords: number; wpm: number; accuracy: number }) {
    if (this.state.status !== "racing") return
    const existing = this.state.progress.get(connectionId)
    if (!existing || existing.finished) return

    existing.wordIndex = msg.wordIndex
    existing.totalWords = msg.totalWords
    existing.wpm = msg.wpm
    existing.accuracy = msg.accuracy
    existing.elapsedSeconds = (Date.now() - this.state.raceStartTime) / 1000

    this.scheduleProgressBroadcast()
  }

  // ── Finish ───────────────────────────────────────────────────────────────

  private handleFinish(connectionId: string, msg: FinishMsg) {
    if (this.state.status !== "racing") return
    const progress = this.state.progress.get(connectionId)
    if (!progress || progress.finished) return

    progress.finished = true
    progress.wpm = msg.wpm
    progress.accuracy = msg.accuracy
    progress.elapsedSeconds = msg.elapsedSeconds
    this.state.finishData.set(connectionId, msg)

    this.flushProgressBroadcast()

    // Check if all players finished
    const allFinished = Array.from(this.state.progress.values()).every(p => p.finished)
    if (allFinished) {
      this.endRace()
    }
  }

  // ── End Race ─────────────────────────────────────────────────────────────

  private endRace() {
    this.state.status = "results"
    if (this.state.countdownTimer) {
      clearInterval(this.state.countdownTimer)
      this.state.countdownTimer = null
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
        accuracy: finish?.accuracy ?? progress?.accuracy ?? 100,
        consistency: finish?.consistency ?? 0,
        elapsedSeconds: finish?.elapsedSeconds ?? progress?.elapsedSeconds ?? 0,
        correctChars: finish?.correctChars ?? 0,
        incorrectChars: finish?.incorrectChars ?? 0,
      })
    }

    // Sort by WPM descending
    entries.sort((a, b) => b.wpm - a.wpm)
    entries.forEach((e, i) => { e.placement = i + 1 })

    this.broadcast({ type: "results", leaderboard: entries })
    this.broadcastRoomState()
  }

  // ── Rematch ──────────────────────────────────────────────────────────────

  private handleRematch(connectionId: string) {
    if (connectionId !== this.state.hostId) return
    if (this.state.status !== "results") return

    // Reset to lobby
    this.state.status = "lobby"
    this.state.words = []
    this.state.progress.clear()
    this.state.finishData.clear()
    for (const [, player] of this.state.players) {
      player.ready = false
    }
    this.broadcastRoomState()
  }

  // ── Disconnect ───────────────────────────────────────────────────────────

  private handleDisconnect(connectionId: string, immediate = false) {
    const player = this.state.players.get(connectionId)
    if (!player) return

    if (!immediate) {
      player.connected = false
      this.broadcastRoomState()
      const existingTimer = this.state.disconnectTimers.get(connectionId)
      if (existingTimer) clearTimeout(existingTimer)
      this.state.disconnectTimers.set(connectionId, setTimeout(() => {
        this.state.disconnectTimers.delete(connectionId)
        this.handleDisconnect(connectionId, true)
      }, DISCONNECT_GRACE_MS))
      return
    }

    this.state.players.delete(connectionId)
    this.state.progress.delete(connectionId)
    this.state.finishData.delete(connectionId)
    const disconnectTimer = this.state.disconnectTimers.get(connectionId)
    if (disconnectTimer) clearTimeout(disconnectTimer)
    this.state.disconnectTimers.delete(connectionId)

    // Host migration
    let newHostId: string | undefined
    if (connectionId === this.state.hostId && this.state.players.size > 0) {
      const firstPlayer = this.state.players.entries().next().value
      if (firstPlayer) {
        const [id, p] = firstPlayer
        p.isHost = true
        this.state.hostId = id
        newHostId = id
      }
    }

    this.broadcast({
      type: "player_left",
      playerId: connectionId,
      newHostId,
    })
    this.broadcastRoomState()

    // If mid-race, check if all remaining players finished
    if (this.state.status === "racing" && this.state.players.size > 0) {
      const allFinished = Array.from(this.state.progress.values()).every(p => p.finished)
      if (allFinished) {
        this.endRace()
      }
    }

    // If room is empty, it will be cleaned up by inactivity timer
  }

  // ── Quick matchmaking (the dedicated coordinator room) ──────────────────

  private handleMatchmakerMessage(msg: ClientMessage, sender: Party.Connection) {
    if (msg.type === "match_cancel") {
      this.removeFromMatchQueue(sender.id)
      return
    }
    if (msg.type !== "matchmake") return

    this.removeFromMatchQueue(sender.id)
    const entry: MatchQueueEntry = {
      connection: sender,
      connectionId: sender.id,
      sessionId: msg.sessionId,
      nickname: msg.nickname.slice(0, 20),
      color: msg.color,
      config: msg.config,
      joinedAt: Date.now(),
    }
    const match = Array.from(this.matchQueue.values()).find((candidate) => this.sameMatchConfig(candidate.config, entry.config))
    if (!match) {
      this.matchQueue.set(sender.id, entry)
      this.broadcastQueueStatus()
      return
    }

    this.matchQueue.delete(match.connectionId)
    const roomCode = this.generateMatchRoomCode()
    const config: RoomConfig = { ...entry.config, isQuickMatch: true }
    this.send(match.connection, { type: "matched", roomCode, config })
    this.send(sender, { type: "matched", roomCode, config })
    this.broadcastQueueStatus()
  }

  private removeFromMatchQueue(connectionId: string) {
    if (!this.matchQueue.delete(connectionId)) return
    this.broadcastQueueStatus()
  }

  private broadcastQueueStatus() {
    const now = Date.now()
    let position = 0
    for (const entry of this.matchQueue.values()) {
      position += 1
      this.send(entry.connection, { type: "queue_status", position, waitMs: now - entry.joinedAt })
    }
  }

  private sameMatchConfig(a: MatchQueueEntry["config"], b: MatchQueueEntry["config"]) {
    return a.mode === b.mode && a.wordOption === b.wordOption && a.timeOption === b.timeOption && a.difficulty === b.difficulty
  }

  private generateMatchRoomCode() {
    const characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    let suffix = ""
    for (let index = 0; index < 4; index += 1) suffix += characters[Math.floor(Math.random() * characters.length)]
    return `VELO-${suffix}`
  }



  // ── Helpers ──────────────────────────────────────────────────────────────

  private send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg))
  }

  private broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg))
  }

  private broadcastRoomState() {
    const players = Array.from(this.state.players.values()).map(p => this.stripConnectionId(p))
    this.broadcast({
      type: "room_state",
      roomCode: this.room.id,
      players,
      hostId: this.state.hostId,
      status: this.state.status,
      config: this.state.config,
    })
  }

  private stripConnectionId(player: Player & { connectionId: string; sessionId: string }): Player {
    const { connectionId, sessionId, ...rest } = player
    return rest
  }

  private scheduleProgressBroadcast() {
    if (this.state.progressBroadcastTimer) return
    this.state.progressBroadcastTimer = setTimeout(() => this.flushProgressBroadcast(), PROGRESS_BROADCAST_MS)
  }

  private flushProgressBroadcast() {
    if (this.state.progressBroadcastTimer) clearTimeout(this.state.progressBroadcastTimer)
    this.state.progressBroadcastTimer = null
    this.broadcast({ type: "progress_broadcast", progress: Array.from(this.state.progress.values()) })
  }

  private resetInactivityTimer() {
    if (this.state.inactivityTimer) clearTimeout(this.state.inactivityTimer)
    this.state.inactivityTimer = setTimeout(() => {
      // Auto-close room after inactivity
      this.broadcast({ type: "error", message: "Room closed due to inactivity" })
      // PartyKit will garbage collect the room
    }, ROOM_TIMEOUT_MS)
  }
}

// PartyKit requires this export shape
RaceRoom satisfies Party.Worker
