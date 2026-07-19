"use client"

// ── Race Connection Hook ─────────────────────────────────────────────────────
// Manages the PartyKit WebSocket connection for multiplayer racing.

import { useCallback, useEffect, useRef, useState } from "react"
import PartySocket from "partysocket"
import type {
  ServerMessage,
  Player,
  RoomStatus,
  RoomConfig,
  RaceProgress,
  LeaderboardEntry,
} from "@/shared/race-protocol"
import { PROGRESS_THROTTLE_MS } from "@/shared/race-protocol"
import { getOrCreateNickname, getOrCreateColor, getOrCreateSessionId } from "@/lib/race-identity"
import { markPerformance, measurePerformance } from "@/lib/performance-metrics"

// ── PartyKit host — configure via env or fallback ────────────────────────────
const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999"

// ── Hook return type ─────────────────────────────────────────────────────────

export interface UseRaceConnectionReturn {
  // State
  connected: boolean
  players: Player[]
  roomStatus: RoomStatus
  roomConfig: RoomConfig
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

  // Actions
  sendProgress: (wordIndex: number, totalWords: number, wpm: number, accuracy: number) => void
  sendFinish: (stats: {
    wpm: number
    accuracy: number
    consistency: number
    elapsedSeconds: number
    correctChars: number
    incorrectChars: number
    wpmHistory: { second: number; wpm: number; raw: number; errors: number }[]
    wordInputs: string[]
  }) => void
  startRace: () => void
  setReady: (ready: boolean) => void
  rematch: () => void
  disconnect: () => void
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRaceConnection(roomCode: string): UseRaceConnectionReturn {
  const [connected, setConnected] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [roomStatus, setRoomStatus] = useState<RoomStatus>("lobby")
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
  const [connectionState, setConnectionState] = useState<UseRaceConnectionReturn["connectionState"]>("connecting")

  const socketRef = useRef<PartySocket | null>(null)
  const lastProgressRef = useRef<number>(0)
  const sessionIdRef = useRef("")

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
        }),
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
          break

        case "countdown":
          setCountdown(msg.value)
          if (msg.value <= 0) {
            // Countdown finished, clear after a brief delay
            setTimeout(() => setCountdown(null), 600)
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

        case "error":
          setError(msg.message)
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
    (wordIndex: number, totalWords: number, wpm: number, accuracy: number) => {
      const now = performance.now()
      if (now - lastProgressRef.current < PROGRESS_THROTTLE_MS) return
      lastProgressRef.current = now
      send({ type: "progress", wordIndex, totalWords, wpm, accuracy })
    },
    [send],
  )

  const sendFinish = useCallback(
    (stats: {
      wpm: number
      accuracy: number
      consistency: number
      elapsedSeconds: number
      correctChars: number
      incorrectChars: number
      wpmHistory: { second: number; wpm: number; raw: number; errors: number }[]
      wordInputs: string[]
    }) => {
      send({ type: "finish", ...stats })
    },
    [send],
  )

  const startRace = useCallback(() => {
    send({ type: "start" })
  }, [send])

  const setReady = useCallback(
    (ready: boolean) => {
      send({ type: "ready", ready })
    },
    [send],
  )

  const rematch = useCallback(() => {
    send({ type: "rematch" })
  }, [send])

  const disconnect = useCallback(() => {
    send({ type: "leave" })
    socketRef.current?.close()
    setConnectionState("disconnected")
  }, [send])

  return {
    connected,
    players,
    roomStatus,
    roomConfig,
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
    sendProgress,
    sendFinish,
    startRace,
    setReady,
    rematch,
    disconnect,
  }
}
