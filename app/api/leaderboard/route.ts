import { NextResponse } from "next/server"
import { validateResultStats } from "@/shared/result-validation"
import {
  submitScore,
  recordWeeklyWin,
  getTopScores,
  getTopWins,
  currentWeekKey,
  LEADERBOARD_MODES,
  type LeaderboardMode,
} from "@/lib/leaderboard"
import { upstashConfigured } from "@/lib/upstash"

export const dynamic = "force-dynamic"

function isLeaderboardMode(value: unknown): value is LeaderboardMode {
  return (
    typeof value === "string" &&
    (LEADERBOARD_MODES as readonly string[]).includes(value)
  )
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const modeParam = url.searchParams.get("mode")
  const mode = isLeaderboardMode(modeParam) ? modeParam : "words"

  if (!upstashConfigured()) {
    return NextResponse.json({
      configured: false,
      weekKey: currentWeekKey(),
      top: [],
      wins: [],
    })
  }

  const [top, wins] = await Promise.all([getTopScores(mode), getTopWins()])
  return NextResponse.json({
    configured: true,
    weekKey: currentWeekKey(),
    top,
    wins,
  })
}

interface ScoreSubmitBody {
  type?: "score"
  playerId?: unknown
  nickname?: unknown
  wpm?: unknown
  raw?: unknown
  accuracy?: unknown
  consistency?: unknown
  correctChars?: unknown
  incorrectChars?: unknown
  extraChars?: unknown
  elapsedSeconds?: unknown
  mode?: unknown
  wpmHistory?: unknown
}

interface WinSubmitBody {
  type?: "win"
  playerId?: unknown
  nickname?: unknown
}

export async function POST(req: Request) {
  let body: ScoreSubmitBody | WinSubmitBody
  try {
    body = (await req.json()) as ScoreSubmitBody | WinSubmitBody
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid_json" },
      { status: 400 }
    )
  }

  if (!upstashConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "storage_unavailable" },
      { status: 503 }
    )
  }

  if (body.type === "win") {
    const { playerId, nickname } = body as WinSubmitBody
    if (typeof playerId !== "string" || typeof nickname !== "string") {
      return NextResponse.json(
        { ok: false, reason: "invalid_payload" },
        { status: 400 }
      )
    }
    await recordWeeklyWin(playerId, nickname)
    return NextResponse.json({ ok: true })
  }

  const b = body as ScoreSubmitBody
  const mode = isLeaderboardMode(b.mode) ? b.mode : null
  const wpm = Number(b.wpm)
  const raw = Number(b.raw)
  const accuracy = Number(b.accuracy)
  const consistency = Number(b.consistency ?? 0)
  const correctChars = Number(b.correctChars)
  const incorrectChars = Number(b.incorrectChars)
  const extraChars = Number(b.extraChars ?? 0)
  const elapsedSeconds = Number(b.elapsedSeconds)

  if (
    !mode ||
    typeof b.playerId !== "string" ||
    typeof b.nickname !== "string"
  ) {
    return NextResponse.json(
      { ok: false, reason: "invalid_payload" },
      { status: 400 }
    )
  }

  // Server-side anti-cheat: same heuristics the race room applies. A spoofed
  // curl can still send a *plausible* run, but impossible numbers never land.
  const validation = validateResultStats(
    {
      wpm,
      raw,
      accuracy,
      correctChars,
      incorrectChars,
      extraChars,
      elapsedSeconds,
      wpmHistory: Array.isArray(b.wpmHistory) ? (b.wpmHistory as []) : [],
    },
    consistency
  )
  if (!validation.valid) {
    return NextResponse.json(
      { ok: false, reason: `invalid_result:${validation.reason}` },
      { status: 422 }
    )
  }

  const result = await submitScore({
    playerId: b.playerId,
    nickname: b.nickname,
    wpm,
    accuracy,
    mode,
  })
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 })
  }
  return NextResponse.json(result)
}
