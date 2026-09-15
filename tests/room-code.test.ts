import { describe, expect, it } from "vitest"
import {
  extractCodeSuffix,
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
} from "@/lib/room-code"

describe("generateRoomCode", () => {
  it("matches the VELO-XXXX format", () => {
    expect(generateRoomCode()).toMatch(/^VELO-[A-Z2-9]{4}$/)
  })

  it("only uses unambiguous characters", () => {
    const ambiguous = /[0IO1L]/g
    for (let i = 0; i < 50; i++) {
      const code = extractCodeSuffix(generateRoomCode())
      expect(code.match(ambiguous)).toBeNull()
    }
  })
})

describe("isValidRoomCode", () => {
  it("accepts valid codes", () => {
    expect(isValidRoomCode("VELO-ABCD")).toBe(true)
    expect(isValidRoomCode("VELO-2345")).toBe(true)
  })

  it("rejects invalid codes", () => {
    expect(isValidRoomCode("")).toBe(false)
    expect(isValidRoomCode("VELO-")).toBe(false)
    expect(isValidRoomCode("VELO-ABC")).toBe(false)
    expect(isValidRoomCode("VELO-ABCDE")).toBe(false)
    expect(isValidRoomCode("VELO-0O1L")).toBe(false) // ambiguous chars
    expect(isValidRoomCode("XXXX-ABCD")).toBe(false)
  })
})

describe("normalizeRoomCode", () => {
  it("accepts already-normal codes", () => {
    expect(normalizeRoomCode("VELO-ABCD")).toBe("VELO-ABCD")
  })

  it("lowercase input is normalized", () => {
    expect(normalizeRoomCode("velo-abcd")).toBe("VELO-ABCD")
  })

  it("bare 4-char codes get the prefix", () => {
    expect(normalizeRoomCode("abcd")).toBe("VELO-ABCD")
    expect(normalizeRoomCode("ABCD")).toBe("VELO-ABCD")
  })

  it("strips separators", () => {
    expect(normalizeRoomCode("velo abcd")).toBe("VELO-ABCD")
    expect(normalizeRoomCode("velo_abcd")).toBe("VELO-ABCD")
    expect(normalizeRoomCode(" velo-abcd ")).toBe("VELO-ABCD")
  })

  it("rejects wrong-length input", () => {
    expect(normalizeRoomCode("abc")).toBeNull()
    expect(normalizeRoomCode("abcde")).toBeNull()
    expect(normalizeRoomCode("")).toBeNull()
    expect(normalizeRoomCode("VELOVELOVELO")).toBeNull()
  })

  it("treats a prefixed 8-char input as prefix + 4-char code", () => {
    // "VELOVELO" → VELO + VELO — all characters are in the unambiguous set
    expect(normalizeRoomCode("VELOVELO")).toBe("VELO-VELO")
  })
})

describe("extractCodeSuffix", () => {
  it("returns the last dash segment", () => {
    expect(extractCodeSuffix("VELO-ABCD")).toBe("ABCD")
    expect(extractCodeSuffix("ABCD")).toBe("ABCD")
  })

  it("falls back to the input when unparsable", () => {
    expect(extractCodeSuffix("")).toBe("")
  })
})
