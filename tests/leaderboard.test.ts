import { describe, it, expect } from "vitest"
import {
  isoWeekKey,
  LEADERBOARD_MODES,
  type LeaderboardRow,
} from "@/lib/leaderboard"

describe("isoWeekKey", () => {
  it("formats as {year}W{week}", () => {
    expect(isoWeekKey(new Date(Date.UTC(2026, 8, 22)))).toMatch(/^\d{4}W\d{2}$/)
  })

  it("is stable across days of the same ISO week", () => {
    // 2026-01-01 is a Thursday → ISO week 1 spans Dec 29 2025 – Jan 4 2026.
    const keys = [
      isoWeekKey(new Date(Date.UTC(2025, 11, 29))),
      isoWeekKey(new Date(Date.UTC(2026, 0, 1))),
      isoWeekKey(new Date(Date.UTC(2026, 0, 4))),
    ]
    expect(new Set(keys).size).toBe(1)
  })

  it("rolls over between Sundays and Mondays", () => {
    expect(isoWeekKey(new Date(Date.UTC(2026, 8, 20)))) // Sunday
    expect(isoWeekKey(new Date(Date.UTC(2026, 8, 21)))) // Monday
    const sun = isoWeekKey(new Date(Date.UTC(2026, 8, 20)))
    const mon = isoWeekKey(new Date(Date.UTC(2026, 8, 21)))
    expect(sun).not.toBe(mon)
  })

  it("handles year boundaries (ISO week 53)", () => {
    // 2020-12-31 belongs to ISO week 53 of 2020.
    expect(isoWeekKey(new Date(Date.UTC(2020, 11, 31)))).toBe("2020W53")
  })
})

describe("LEADERBOARD_MODES", () => {
  it("supports the two race modes", () => {
    expect(LEADERBOARD_MODES).toEqual(["words", "time"])
  })
})

// Pure helpers exercised above; ZSET plumbing (submitScore/getTopScores) is
// covered by the graceful-degradation contract: with no Upstash env vars the
// functions must resolve to empty results, never throw. That contract is
// asserted in leaderboard.route.test.ts via the route handler.
describe("LeaderboardRow shape", () => {
  it("carries display-ready fields", () => {
    const row: LeaderboardRow = {
      rank: 1,
      playerId: "p1",
      nickname: "SwiftFox",
      wpm: 120,
      accuracy: 98,
      mode: "words",
      weekKey: "2026W38",
    }
    expect(row.rank).toBe(1)
    expect(row.wpm).toBe(120)
  })
})
