import { describe, expect, it } from "vitest"
import {
  PLAYER_COLORS,
  WORD_OPTIONS,
  TIME_OPTIONS,
  sanitizeColor,
  sanitizeNickname,
  sanitizeMode,
  sanitizeDifficulty,
  sanitizeOption,
  MAX_NICKNAME_LENGTH,
} from "@/shared/race-protocol"

describe("sanitizeColor", () => {
  it("accepts palette colors", () => {
    expect(sanitizeColor("#f472b6")).toBe("#f472b6")
  })

  it("normalizes case and whitespace", () => {
    expect(sanitizeColor("  #F472B6 ")).toBe("#f472b6")
  })

  it("falls back to the first palette color for unknown values", () => {
    expect(sanitizeColor("red")).toBe(PLAYER_COLORS[0])
    expect(sanitizeColor(42)).toBe(PLAYER_COLORS[0])
    expect(sanitizeColor(null)).toBe(PLAYER_COLORS[0])
    expect(sanitizeColor(undefined)).toBe(PLAYER_COLORS[0])
  })

  it("never returns a value with injection characters", () => {
    const out = sanitizeColor("#fff; position:fixed")
    expect((PLAYER_COLORS as readonly string[]).includes(out)).toBe(true)
  })
})

describe("sanitizeNickname", () => {
  it("trims and truncates to the max length", () => {
    expect(sanitizeNickname("  ace  ")).toBe("ace")
    expect(sanitizeNickname("x".repeat(50))).toHaveLength(MAX_NICKNAME_LENGTH)
  })

  it("strips control characters", () => {
    expect(sanitizeNickname("a\u0000b\u001bc\u007fd")).toBe("abcd")
    expect(sanitizeNickname("\u001b[31mRed")).toBe("[31mRed")
  })

  it("returns null for empty or non-string input", () => {
    expect(sanitizeNickname("   ")).toBeNull()
    expect(sanitizeNickname("")).toBeNull()
    expect(sanitizeNickname(123)).toBeNull()
    expect(sanitizeNickname(undefined)).toBeNull()
  })
})

describe("sanitizeMode / sanitizeDifficulty", () => {
  it("accepts valid race modes", () => {
    expect(sanitizeMode("words")).toBe("words")
    expect(sanitizeMode("time")).toBe("time")
  })

  it("rejects invalid race modes", () => {
    expect(sanitizeMode("zen")).toBeNull()
    expect(sanitizeMode("quote")).toBeNull()
    expect(sanitizeMode("")).toBeNull()
    expect(sanitizeMode(1)).toBeNull()
  })

  it("accepts valid difficulties", () => {
    expect(sanitizeDifficulty("easy")).toBe("easy")
    expect(sanitizeDifficulty("medium")).toBe("medium")
    expect(sanitizeDifficulty("hard")).toBe("hard")
  })

  it("rejects invalid difficulties", () => {
    expect(sanitizeDifficulty("impossible")).toBeNull()
    expect(sanitizeDifficulty({})).toBeNull()
    expect(sanitizeDifficulty(undefined)).toBeNull()
  })
})

describe("sanitizeOption", () => {
  it("accepts the UI option values", () => {
    for (const v of WORD_OPTIONS) {
      expect(sanitizeOption(v, WORD_OPTIONS, 1, 1000)).toBe(v)
    }
    for (const v of TIME_OPTIONS) {
      expect(sanitizeOption(v, TIME_OPTIONS, 1, 3600)).toBe(v)
    }
  })

  it("accepts any in-range integer", () => {
    expect(sanitizeOption(37, WORD_OPTIONS, 1, 1000)).toBe(37)
  })

  it("rejects out-of-range, non-integer and non-number values", () => {
    expect(sanitizeOption(1e9, WORD_OPTIONS, 1, 1000)).toBeNull()
    expect(sanitizeOption(0, WORD_OPTIONS, 1, 1000)).toBeNull()
    expect(sanitizeOption(-5, WORD_OPTIONS, 1, 1000)).toBeNull()
    expect(sanitizeOption(25.5, WORD_OPTIONS, 1, 1000)).toBeNull()
    expect(sanitizeOption(Number.NaN, WORD_OPTIONS, 1, 1000)).toBeNull()
    expect(
      sanitizeOption(Number.POSITIVE_INFINITY, WORD_OPTIONS, 1, 1000)
    ).toBeNull()
    expect(sanitizeOption("25", WORD_OPTIONS, 1, 1000)).toBeNull()
    expect(sanitizeOption(null, WORD_OPTIONS, 1, 1000)).toBeNull()
    expect(sanitizeOption(undefined, WORD_OPTIONS, 1, 1000)).toBeNull()
  })
})
