"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import PartySocket from "partysocket"
import { MATCHMAKER_ROOM_ID, QUICK_MATCH_WAIT_MS, type MatchedMsg, type RoomConfig, type ServerMessage } from "@/lib/race-protocol"
import { getOrCreateColor, getOrCreateNickname, getOrCreateSessionId } from "@/lib/race-identity"

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999"

type MatchConfig = Pick<RoomConfig, "mode" | "wordOption" | "timeOption" | "difficulty">

export function useQuickMatch(onMatched: (roomCode: string, config: MatchConfig) => void) {
  const socketRef = useRef<PartySocket | null>(null)
  const [status, setStatus] = useState<"idle" | "connecting" | "searching" | "matched" | "error">("idle")
  const [waitMs, setWaitMs] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const cancel = useCallback(() => {
    clearTimer()
    socketRef.current?.send(JSON.stringify({ type: "match_cancel" }))
    socketRef.current?.close()
    socketRef.current = null
    setWaitMs(0)
    setStatus("idle")
  }, [clearTimer])

  const findMatch = useCallback((config: MatchConfig) => {
    cancel()
    setStatus("connecting")
    const socket = new PartySocket({ host: PARTYKIT_HOST, room: MATCHMAKER_ROOM_ID })
    socketRef.current = socket

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({
        type: "matchmake",
        config,
        nickname: getOrCreateNickname(),
        color: getOrCreateColor(),
        sessionId: getOrCreateSessionId(),
      }))
      setStatus("searching")
      const startedAt = performance.now()
      timerRef.current = setInterval(() => setWaitMs(Math.round(performance.now() - startedAt)), 250)
    })

    socket.addEventListener("message", (event) => {
      let message: ServerMessage
      try { message = JSON.parse(event.data as string) } catch { return }
      if (message.type === "matched") {
        clearTimer()
        setStatus("matched")
        const matched = message as MatchedMsg
        onMatched(matched.roomCode, matched.config)
        socket.close()
      }
      if (message.type === "error") {
        clearTimer()
        setStatus("error")
      }
    })

    socket.addEventListener("error", () => {
      clearTimer()
      setStatus("error")
    })
  }, [cancel, clearTimer, onMatched])

  useEffect(() => () => cancel(), [cancel])

  return { findMatch, cancel, status, waitMs, suggestedTimeoutMs: QUICK_MATCH_WAIT_MS }
}
