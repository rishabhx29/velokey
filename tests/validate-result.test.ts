import { describe, expect, it } from "vitest"
import { validateResult, isInvalidTestResult } from "@/lib/validate-result"
import type { ResultStats, WpmSnapshot } from "@/components/results-screen"

function snapshot(
  second: number,
  wpm: number,
  raw = wpm,
  errors = 0
): WpmSnapshot {
  return { second, wpm, raw, errors }
}

function stats(overrides: Partial<ResultStats> = {}): ResultStats {
  return {
    wpm: 80,
    accuracy: 95,
    raw: 90,
    correctChars: 300,
    incorrectChars: 10,
    extraChars: 2,
    missedChars: 3,
    consistency: 80,
    elapsedSeconds: 30,
    correctedErrors: 5,
    mode: "time",
    modeDetail: "30",
    language: "english",
    wpmHistory: [
      snapshot(1, 75),
      snapshot(2, 80),
      snapshot(3, 82),
      snapshot(4, 78),
    ],
    ...overrides,
  }
}

describe("validateResult", () => {
  it("accepts a legitimate result", () => {
    expect(validateResult(stats())).toEqual({ valid: true })
  })

  it("rejects zero keystrokes", () => {
    const r = stats({ correctChars: 0, incorrectChars: 0, extraChars: 0 })
    expect(validateResult(r).reason).toBe("no_keystrokes")
  })

  it("rejects NaN stats", () => {
    const r = stats({ wpm: Number.NaN })
    expect(validateResult(r).reason).toBe("invalid_numbers")
  })

  it("rejects out-of-range accuracy", () => {
    expect(validateResult(stats({ accuracy: 101 })).reason).toBe(
      "invalid_accuracy"
    )
    expect(validateResult(stats({ accuracy: -1 })).reason).toBe(
      "invalid_accuracy"
    )
  })

  it("rejects zero time", () => {
    expect(validateResult(stats({ elapsedSeconds: 0 })).reason).toBe(
      "zero_time"
    )
  })

  it("rejects ultra-short tests with barely any input", () => {
    const r = stats({
      elapsedSeconds: 1,
      correctChars: 5,
      incorrectChars: 0,
      extraChars: 0,
    })
    expect(validateResult(r).reason).toBe("too_short")
  })

  it("allows ultra-short tests with real input", () => {
    // 25 keystrokes in 1 second = 25 cps — under the 30 cps ceiling
    const r = stats({
      elapsedSeconds: 1,
      correctChars: 22,
      incorrectChars: 2,
      extraChars: 1,
    })
    expect(validateResult(r).valid).toBe(true)
  })

  it("rejects impossible WPM", () => {
    expect(validateResult(stats({ wpm: 350 })).reason).toBe("impossible_wpm")
  })

  it("rejects impossible raw", () => {
    expect(validateResult(stats({ raw: 400 })).reason).toBe("impossible_raw")
  })

  it("rejects impossible chars-per-second", () => {
    // 30 chars/s ceiling — 1000 chars in 5 seconds = 200 cps
    const r = stats({
      correctChars: 900,
      incorrectChars: 50,
      extraChars: 50,
      elapsedSeconds: 5,
    })
    expect(validateResult(r).reason).toBe("impossible_cps")
  })

  it("rejects macro burst spikes", () => {
    const r = stats({ wpmHistory: [snapshot(1, 700)] })
    expect(validateResult(r).reason).toBe("impossible_burst")
  })

  it("rejects AFK gaps", () => {
    const history = [
      snapshot(1, 80, 80),
      snapshot(2, 80, 0),
      snapshot(3, 80, 0),
      snapshot(4, 80, 0),
      snapshot(5, 80, 0), // 4 consecutive zero-raw inner seconds
      snapshot(6, 80, 80),
      snapshot(7, 80, 80),
    ]
    expect(validateResult(stats({ wpmHistory: history })).reason).toBe(
      "afk_detected"
    )
  })

  it("rejects flat WPM history at speed", () => {
    const history = [1, 2, 3, 4, 5, 6].map((s) => snapshot(s, 120, 120))
    expect(validateResult(stats({ wpmHistory: history })).reason).toBe(
      "flat_wpm_history"
    )
  })

  it("allows flat history at low WPM (legit slow typing)", () => {
    const history = [1, 2, 3, 4, 5, 6].map((s) => snapshot(s, 40, 40))
    expect(
      validateResult(stats({ wpm: 40, raw: 42, wpmHistory: history })).valid
    ).toBe(true)
  })
})

describe("isInvalidTestResult", () => {
  it("is the boolean inverse of validateResult", () => {
    expect(isInvalidTestResult(stats())).toBe(false)
    expect(isInvalidTestResult(stats({ wpm: 500 }))).toBe(true)
  })
})
