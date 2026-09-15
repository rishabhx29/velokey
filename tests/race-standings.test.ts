import { describe, expect, it } from "vitest"
import { rankLeaderboard, finishedBefore } from "@/shared/race-standings"
import type { LeaderboardEntry } from "@/shared/race-protocol"

function entry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    player: {
      id: "p",
      nickname: "P",
      color: "#fff",
      isHost: false,
      ready: true,
      connected: true,
    },
    placement: 0,
    wpm: 80,
    raw: 90,
    accuracy: 95,
    consistency: 70,
    elapsedSeconds: 30,
    correctChars: 200,
    incorrectChars: 10,
    ...overrides,
  }
}

describe("finishedBefore", () => {
  it("ranks finishers before DNFs", () => {
    expect(finishedBefore(entry({ elapsedSeconds: 1 }))).toBe(0)
    expect(finishedBefore(entry({ elapsedSeconds: 0 }))).toBe(1)
  })
})

describe("rankLeaderboard — words mode (first to finish wins)", () => {
  it("orders by elapsed time, not WPM", () => {
    const board = [
      entry({
        player: {
          id: "slow",
          nickname: "S",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 120,
        elapsedSeconds: 40,
      }),
      entry({
        player: {
          id: "fast",
          nickname: "F",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 70,
        elapsedSeconds: 25,
      }),
    ]
    const ranked = rankLeaderboard(board, "words")
    expect(ranked[0].player.id).toBe("fast")
    expect(ranked[0].placement).toBe(1)
    expect(ranked[1].placement).toBe(2)
  })

  it("places DNFs after all finishers, best WPM first among DNFs", () => {
    const board = [
      entry({
        player: {
          id: "dnf-high",
          nickname: "A",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 140,
        elapsedSeconds: 0,
      }),
      entry({
        player: {
          id: "finisher",
          nickname: "B",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 60,
        elapsedSeconds: 30,
      }),
      entry({
        player: {
          id: "dnf-low",
          nickname: "C",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 90,
        elapsedSeconds: 0,
      }),
    ]
    const ranked = rankLeaderboard(board, "words")
    expect(ranked.map((e) => e.player.id)).toEqual([
      "finisher",
      "dnf-high",
      "dnf-low",
    ])
  })

  it("breaks finish-time ties by WPM", () => {
    const board = [
      entry({
        player: {
          id: "b",
          nickname: "B",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 85,
        elapsedSeconds: 30,
      }),
      entry({
        player: {
          id: "a",
          nickname: "A",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 95,
        elapsedSeconds: 30,
      }),
    ]
    const ranked = rankLeaderboard(board, "words")
    expect(ranked[0].player.id).toBe("a")
  })
})

describe("rankLeaderboard — time mode (highest WPM wins)", () => {
  it("orders by WPM even when elapsed differs", () => {
    const board = [
      entry({
        player: {
          id: "slowtyper",
          nickname: "S",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 60,
        elapsedSeconds: 15,
      }),
      entry({
        player: {
          id: "speedster",
          nickname: "Q",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 110,
        elapsedSeconds: 60,
      }),
    ]
    const ranked = rankLeaderboard(board, "time")
    expect(ranked[0].player.id).toBe("speedster")
  })

  it("breaks WPM ties by accuracy then time", () => {
    const board = [
      entry({
        player: {
          id: "low-acc",
          nickname: "A",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 90,
        accuracy: 92,
        elapsedSeconds: 30,
      }),
      entry({
        player: {
          id: "high-acc",
          nickname: "B",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 90,
        accuracy: 98,
        elapsedSeconds: 35,
      }),
      entry({
        player: {
          id: "tie-acc-fast",
          nickname: "C",
          color: "#fff",
          isHost: false,
          ready: true,
          connected: true,
        },
        wpm: 90,
        accuracy: 98,
        elapsedSeconds: 30,
      }),
    ]
    const ranked = rankLeaderboard(board, "time")
    expect(ranked.map((e) => e.player.id)).toEqual([
      "tie-acc-fast",
      "high-acc",
      "low-acc",
    ])
  })
})

describe("rankLeaderboard — placements are 1-based and complete", () => {
  it("assigns sequential placements", () => {
    const board = [entry(), entry(), entry(), entry()]
    const ranked = rankLeaderboard(board, "time")
    expect(ranked.map((e) => e.placement)).toEqual([1, 2, 3, 4])
  })
})
