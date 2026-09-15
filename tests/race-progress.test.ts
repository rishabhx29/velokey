import { describe, expect, it } from "vitest"
import {
  getProgressPercentage,
  getProgressTarget,
  getRaceProgressPercent,
} from "@/lib/race-progress"
import type { RaceProgress, RoomConfig } from "@/shared/race-protocol"

const wordsConfig: RoomConfig = {
  mode: "words",
  wordOption: 50,
  timeOption: 60,
  difficulty: "medium",
  isQuickMatch: false,
}

const timeConfig: RoomConfig = {
  mode: "time",
  wordOption: 25,
  timeOption: 30,
  difficulty: "medium",
  isQuickMatch: false,
}

const prog = (overrides: Partial<RaceProgress>): RaceProgress => ({
  playerId: "p1",
  wordIndex: 0,
  wpm: 0,
  accuracy: 100,
  elapsedSeconds: 0,
  totalWords: 50,
  finished: false,
  ...overrides,
})

describe("getProgressTarget", () => {
  it("returns timeOption in time mode", () => {
    expect(getProgressTarget(timeConfig, [], "p1")).toBe(30)
  })

  it("returns the player's totalWords in words mode", () => {
    expect(
      getProgressTarget(wordsConfig, [prog({ totalWords: 75 })], "p1")
    ).toBe(75)
  })

  it("falls back to config.wordOption when no progress yet", () => {
    expect(getProgressTarget(wordsConfig, [], "p1")).toBe(50)
  })

  it("never returns 0", () => {
    expect(
      getProgressTarget(
        { ...wordsConfig, wordOption: 0 },
        [prog({ totalWords: 0 })],
        "p1"
      )
    ).toBe(1)
  })
})

describe("getProgressPercentage", () => {
  it("returns 0 for missing progress", () => {
    expect(getProgressPercentage(wordsConfig, [], "p1")).toBe(0)
  })

  it("returns 100 for finished players", () => {
    expect(
      getProgressPercentage(
        wordsConfig,
        [prog({ finished: true, wordIndex: 3 })],
        "p1"
      )
    ).toBe(100)
  })

  it("scales wordIndex against totalWords in words mode", () => {
    expect(
      getProgressPercentage(wordsConfig, [prog({ wordIndex: 25 })], "p1")
    ).toBe(50)
  })

  it("scales elapsedSeconds against timeOption in time mode", () => {
    expect(
      getProgressPercentage(
        timeConfig,
        [prog({ elapsedSeconds: 15, totalWords: 10 })],
        "p1"
      )
    ).toBe(50)
  })

  it("clamps overshoot to 100", () => {
    expect(
      getProgressPercentage(wordsConfig, [prog({ wordIndex: 60 })], "p1")
    ).toBe(100)
  })

  it("clamps negative to 0", () => {
    expect(
      getProgressPercentage(wordsConfig, [prog({ wordIndex: -5 })], "p1")
    ).toBe(0)
  })
})

describe("getRaceProgressPercent", () => {
  it("mirrors getProgressPercentage for the same player", () => {
    const list = [prog({ wordIndex: 30 })]
    expect(getRaceProgressPercent(wordsConfig, list[0])).toBe(
      getProgressPercentage(wordsConfig, list, "p1")
    )
  })

  it("returns 100 immediately when finished", () => {
    expect(getRaceProgressPercent(timeConfig, prog({ finished: true }))).toBe(
      100
    )
  })

  it("guards against a zero/negative target", () => {
    expect(
      getRaceProgressPercent(
        { ...timeConfig, timeOption: 0 },
        prog({ elapsedSeconds: 5 })
      )
    ).toBe(0)
  })
})
