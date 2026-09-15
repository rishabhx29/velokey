import { describe, expect, it } from "vitest"
import {
  validateResultStats,
  type ValidatableResult,
} from "@/shared/result-validation"
import { validateResult, isInvalidTestResult } from "@/lib/validate-result"
import type { ResultStats } from "@/components/results-screen"

function baseStats(
  overrides: Partial<ValidatableResult> = {}
): ValidatableResult {
  return {
    wpm: 80,
    raw: 90,
    accuracy: 95,
    correctChars: 200,
    incorrectChars: 10,
    extraChars: 2,
    elapsedSeconds: 30,
    wpmHistory: [
      { second: 1, wpm: 60, raw: 70, errors: 1 },
      { second: 2, wpm: 75, raw: 85, errors: 0 },
      { second: 3, wpm: 82, raw: 92, errors: 2 },
      { second: 4, wpm: 88, raw: 95, errors: 0 },
      { second: 5, wpm: 80, raw: 90, errors: 1 },
    ],
    ...overrides,
  }
}

describe("validateResultStats (shared, used by client and race server)", () => {
  it("accepts a legitimate result", () => {
    expect(validateResultStats(baseStats())).toEqual({ valid: true })
  })

  it("rejects empty keystrokes", () => {
    expect(
      validateResultStats(
        baseStats({ correctChars: 0, incorrectChars: 0, extraChars: 0 })
      )
    ).toEqual({
      valid: false,
      reason: "no_keystrokes",
    })
  })

  it("rejects non-finite core stats", () => {
    expect(validateResultStats(baseStats({ wpm: NaN }))).toEqual({
      valid: false,
      reason: "invalid_numbers",
    })
  })

  it("rejects out-of-range accuracy", () => {
    expect(validateResultStats(baseStats({ accuracy: 120 }))).toEqual({
      valid: false,
      reason: "invalid_accuracy",
    })
  })

  it("rejects zero time", () => {
    expect(validateResultStats(baseStats({ elapsedSeconds: 0 }))).toEqual({
      valid: false,
      reason: "zero_time",
    })
  })

  it("rejects impossible WPM ceilings", () => {
    expect(validateResultStats(baseStats({ wpm: 400 }))).toEqual({
      valid: false,
      reason: "impossible_wpm",
    })
    expect(validateResultStats(baseStats({ raw: 400 }))).toEqual({
      valid: false,
      reason: "impossible_raw",
    })
  })

  it("rejects impossible chars-per-second", () => {
    const impossible = baseStats({ elapsedSeconds: 5 })
    expect(validateResultStats(impossible).reason).toBe("impossible_cps")
  })

  it("rejects single-second burst spikes", () => {
    const history = baseStats().wpmHistory.map((s, i) =>
      i === 2 ? { ...s, wpm: 900 } : s
    )
    expect(validateResultStats(baseStats({ wpmHistory: history })).reason).toBe(
      "impossible_burst"
    )
  })

  it("rejects bot-flat WPM history at high speed", () => {
    const history = Array.from({ length: 6 }, (_, i) => ({
      second: i + 1,
      wpm: 150,
      raw: 160,
      errors: 0,
    }))
    expect(
      validateResultStats(
        baseStats({ wpm: 150, raw: 160, wpmHistory: history })
      ).reason
    ).toBe("flat_wpm_history")
  })

  it("rejects perfect consistency at high WPM", () => {
    expect(
      validateResultStats(baseStats({ wpm: 150, raw: 160 }), 99.5).reason
    ).toBe("perfect_consistency")
  })

  it("rejects AFK gaps mid-test", () => {
    // AFK check only engages above MIN_HISTORY_FOR_STATS + 2 = 6 seconds.
    const history = Array.from({ length: 9 }, (_, i) => ({
      second: i + 1,
      wpm: i >= 2 && i <= 5 ? 0 : 80,
      raw: i >= 2 && i <= 5 ? 0 : 90,
      errors: 0,
    }))
    expect(validateResultStats(baseStats({ wpmHistory: history })).reason).toBe(
      "afk_detected"
    )
  })
})

describe("validateResult (client wrapper keeps existing behavior)", () => {
  it("accepts a full ResultStats object", () => {
    const stats = {
      ...baseStats(),
      missedChars: 0,
      consistency: 80,
      correctedErrors: 1,
      mode: "time",
      modeDetail: "30",
      language: "english",
    } as ResultStats
    expect(validateResult(stats)).toEqual({ valid: true })
    expect(isInvalidTestResult(stats)).toBe(false)
  })

  it("flags a spoofed race finish", () => {
    const stats = {
      ...baseStats(),
      wpm: 500,
      raw: 520,
      consistency: 70,
      mode: "race_words",
    } as unknown as ResultStats
    expect(isInvalidTestResult(stats)).toBe(true)
  })
})
