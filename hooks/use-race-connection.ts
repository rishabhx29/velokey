"use client"

// ── Race Connection Hook ─────────────────────────────────────────────────────
// Manages the PartyKit WebSocket connection for multiplayer racing.

import { useCallback, useEffect, useRef, useState } from "react"
import PartySocket from "partysocket"
import { toast } from "sonner"
import type {
  ServerMessage,
  Player,
  RoomStatus,
  RoomConfig,
  RaceProgress,
  LeaderboardEntry,
  TournamentStateMsg,
} from "@/shared/race-protocol"
import { PROGRESS_THROTTLE_MS } from "@/shared/race-protocol"
import {
  getOrCreateNickname,
  getOrCreateColor,
  getOrCreateSessionId,
} from "@/lib/race-identity"
import { markPerformance, measurePerformance } from "@/lib/performance-metrics"
import { PARTYKIT_HOST } from "@/lib/partykit-host"

// ── Hook return type ─────────────────────────────────────────────────────────

export interface UseRaceConnectionReturn {
  // State
  connected: boolean
  players: Player[]
  roomStatus: RoomStatus
  roomConfig: RoomConfig
  /** Authoritative room code reported by the server */
  roomCode: string
  hostId: string
  isHost: boolean
  myPlayerId: string
  countdown: number | null
  words: string[]
  raceMode: "words" | "time" | null
  raceTimeOption: number | null
  raceWordOption: number | null
  progress: RaceProgress[]
  leaderboard: LeaderboardEntry[]
  error: string | null
  connectionState: "connecting" | "connected" | "reconnecting" | "disconnected"
  /** Live tournament bracket; null when no tournament is running. */
  tournament: TournamentStateMsg["tournament"]

  // Actions
  sendProgress: (
    wordIndex: number,
    totalWords: number,
    wpm: number,
    accuracy: number,
    charIndex?: number
  ) => void
  sendFinish: (stats: {
    wpm: number
    raw: number
    accuracy: number
    consistency: number
    elapsedSeconds: number
    correctChars: number
    incorrectChars: number
    wpmHistory: { second: number; wpm: number; raw: number; errors: number }[]
    wordInputs?: string[]
  }) => void
  startRace: () => void
  setReady: (ready: boolean) => void
  rematch: () => void
  disconnect: () => void
  createTournament: () => void
  tournamentNext: () => void
  cancelTournament: () => void
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRaceConnection(roomCode: string): UseRaceConnectionReturn {
  const [connected, setConnected] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [roomStatus, setRoomStatus] = useState<RoomStatus>("lobby")
  const [serverRoomCode, setServerRoomCode] = useState<string>("")
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({
    mode: "words",
    wordOption: 25,
    timeOption: 30,
    difficulty: "easy",
    isQuickMatch: false,
  })
  const [hostId, setHostId] = useState("")
  const [myPlayerId, setMyPlayerId] = useState("")
  const [countdown, setCountdown] = useState<number | null>(null)
  const [words, setWords] = useState<string[]>([])
  const [raceMode, setRaceMode] = useState<"words" | "time" | null>(null)
  const [raceTimeOption, setRaceTimeOption] = useState<number | null>(null)
  const [raceWordOption, setRaceWordOption] = useState<number | null>(null)
  const [progress, setProgress] = useState<RaceProgress[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [tournament, setTournament] =
    useState<TournamentStateMsg["tournament"]>(null)
  const [connectionState, setConnectionState] =
    useState<UseRaceConnectionReturn["connectionState"]>("connecting")

  const socketRef = useRef<PartySocket | null>(null)
  const lastProgressRef = useRef<number>(0)
  const sessionIdRef = useRef("")
  const countdownClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isHost = myPlayerId === hostId

  // ── Connect ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!roomCode) return

    sessionIdRef.current = getOrCreateSessionId()
    markPerformance("race-connect-start")

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomCode,
    })

    socketRef.current = socket

    socket.addEventListener("open", () => {
      setConnected(true)
      setConnectionState("connected")
      setError(null)
      setMyPlayerId(socket.id)
      measurePerformance("race-connect", "race-connect-start")

      // Auto-join with stored identity
      socket.send(
        JSON.stringify({
          type: "join",
          nickname: getOrCreateNickname(),
          color: getOrCreateColor(),
          sessionId: sessionIdRef.current,
        })
      )
    })

    socket.addEventListener("close", () => {
      setConnected(false)
      setConnectionState("reconnecting")
    })

    socket.addEventListener("error", () => {
      setError("Connection error")
      setConnectionState("reconnecting")
    })

    socket.addEventListener("message", (event) => {
      let msg: ServerMessage
      try {
        msg = JSON.parse(event.data as string)
      } catch {
        return
      }

      switch (msg.type) {
        case "room_state":
          setPlayers(msg.players)
          setHostId(msg.hostId)
          setRoomStatus(msg.status)
          setRoomConfig(msg.config)
          if (msg.roomCode) setServerRoomCode(msg.roomCode)
          break

        case "countdown":
          setCountdown(msg.value)
          if (msg.value <= 0) {
            // Countdown finished. Hold the value at 0 for 900ms so the GO
            // overlay renders (it is fully derived from this state), then
            // clear. Tracked so the timer cannot fire after unmount.
            if (countdownClearRef.current)
              clearTimeout(countdownClearRef.current)
            countdownClearRef.current = setTimeout(() => {
              countdownClearRef.current = null
              setCountdown(null)
            }, 900)
          }
          break

        case "words":
          setWords(msg.words)
          setRaceMode(msg.mode)
          setRaceTimeOption(msg.timeOption ?? null)
          setRaceWordOption(msg.wordOption ?? null)
          break

        case "progress_broadcast":
          setProgress(msg.progress)
          break

        case "results":
          setLeaderboard(msg.leaderboard)
          break

        case "tournament_state":
          setTournament(msg.tournament)
          break

        case "error":
          setError(msg.message)
          // Errors can arrive mid-race (room full on rejoin, rejected result,
          // min players) when the connecting-screen banner is not rendered —
          // surface them as toasts so they are never silently swallowed.
          toast.error(msg.message)
          break

        case "info":
          // Non-fatal notices (e.g. ready-check auto-start) — informational
          // toast, never the error banner.
          toast(msg.message)
          break

        case "player_joined":
          setPlayers((prev) => {
            if (prev.find((p) => p.id === msg.player.id)) return prev
            return [...prev, msg.player]
          })
          break

        case "player_left":
          setPlayers((prev) => prev.filter((p) => p.id !== msg.playerId))
          if (msg.newHostId) {
            setHostId(msg.newHostId)
          }
          break
      }
    })

    return () => {
      if (countdownClearRef.current) {
        clearTimeout(countdownClearRef.current)
        countdownClearRef.current = null
      }
      socket.close()
      socketRef.current = null
    }
  }, [roomCode])

  // ── Actions ────────────────────────────────────────────────────────────

  const send = useCallback((data: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data))
    }
  }, [])

  const sendProgress = useCallback(
    (
      wordIndex: number,
      totalWords: number,
      wpm: number,
      accuracy: number,
      charIndex?: number
    ) => {
      const now = performance.now()
      if (now - lastProgressRef.current < PROGRESS_THROTTLE_MS) return
      lastProgressRef.current = now
      send({
        type: "progress",
        wordIndex,
        totalWords,
        wpm,
        accuracy,
        charIndex,
      })
    },
    [send]
  )

  const sendFinish = useCallback(
    (stats: {
      wpm: number
      raw: number
      accuracy: number
      consistency: number
      elapsedSeconds: number
      correctChars: number
      incorrectChars: number
      wpmHistory: { second: number; wpm: number; raw: number; errors: number }[]
      wordInputs?: string[]
    }) => {
      send({ type: "finish", ...stats, wordInputs: stats.wordInputs ?? [] })
    },
    [send]
  )

  const startRace = useCallback(() => {
    send({ type: "start" })
  }, [send])

  const setReady = useCallback(
    (ready: boolean) => {
      send({ type: "ready", ready })
    },
    [send]
  )

  const rematch = useCallback(() => {
    send({ type: "rematch" })
  }, [send])

  const disconnect = useCallback(() => {
    send({ type: "leave" })
    socketRef.current?.close()
    setConnectionState("disconnected")
  }, [send])

  const createTournament = useCallback(() => {
    send({ type: "tournament_create" })
  }, [send])

  const tournamentNext = useCallback(() => {
    send({ type: "tournament_next" })
  }, [send])

  const cancelTournament = useCallback(() => {
    send({ type: "tournament_cancel" })
  }, [send])

  return {
    connected,
    players,
    roomStatus,
    roomConfig,
    roomCode: serverRoomCode || roomCode,
    hostId,
    isHost,
    myPlayerId,
    countdown,
    words,
    raceMode,
    raceTimeOption,
    raceWordOption,
    progress,
    leaderboard,
    error,
    connectionState,
    tournament,
    sendProgress,
    sendFinish,
    startRace,
    setReady,
    rematch,
    disconnect,
    createTournament,
    tournamentNext,
    cancelTournament,
  }
}
