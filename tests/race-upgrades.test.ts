import { describe, expect, test } from "vitest"
import { sanitizeCharIndex } from "@/shared/race-protocol"
import { caretWordPosition } from "@/lib/race-progress"

describe("sanitizeCharIndex", () => {
  test("accepts a valid in-range integer", () => {
    expect(sanitizeCharIndex(42, 100)).toBe(42)
  })

  test("clamps above the max", () => {
    expect(sanitizeCharIndex(150, 100)).toBe(100)
  })

  test("clamps below zero", () => {
    expect(sanitizeCharIndex(-5, 100)).toBe(0)
  })

  test("floors fractional values", () => {
    expect(sanitizeCharIndex(7.9, 100)).toBe(7)
  })

  test("returns 0 for NaN", () => {
    expect(sanitizeCharIndex(Number.NaN, 100)).toBe(0)
  })

  test("returns 0 for Infinity (non-finite input)", () => {
    expect(sanitizeCharIndex(Number.POSITIVE_INFINITY, 100)).toBe(0)
  })

  test("returns 0 for non-number types", () => {
    expect(sanitizeCharIndex("12", 100)).toBe(0)
    expect(sanitizeCharIndex(null, 100)).toBe(0)
    expect(sanitizeCharIndex(undefined, 100)).toBe(0)
  })

  test("handles a max of 0 (empty race text)", () => {
    expect(sanitizeCharIndex(50, 0)).toBe(0)
  })
})

describe("caretWordPosition", () => {
  const words = ["hello", "hi", ""]

  test("start of text", () => {
    expect(caretWordPosition(words, 0)).toEqual({ wordIndex: 0, position: 0 })
  })

  test("mid first word", () => {
    expect(caretWordPosition(words, 3)).toEqual({ wordIndex: 0, position: 3 })
  })

  test("exactly at a word end lands on that word", () => {
    // char 5 = end of "hello" → word 0, position 5
    expect(caretWordPosition(words, 5)).toEqual({ wordIndex: 0, position: 5 })
  })

  test("first char of the second word", () => {
    // "hello" (5) + space (1) = 6 → word 1, position 0
    expect(caretWordPosition(words, 6)).toEqual({ wordIndex: 1, position: 0 })
  })

  test("word-end and empty-word boundaries", () => {
    // "hello hi " — char 8 = end of "hi" → word 1, position 2
    expect(caretWordPosition(words, 8)).toEqual({ wordIndex: 1, position: 2 })
    // char 9 = the joining slot of the empty word 2 → word 2, position 0
    expect(caretWordPosition(words, 9)).toEqual({ wordIndex: 2, position: 0 })
  })

  test("past the end returns null", () => {
    expect(caretWordPosition(words, 99)).toBeNull()
  })

  test("negative index returns null", () => {
    expect(caretWordPosition(words, -1)).toBeNull()
  })

  test("empty word list returns null", () => {
    expect(caretWordPosition([], 0)).toBeNull()
  })

  test("single word end boundary", () => {
    expect(caretWordPosition(["abc"], 3)).toEqual({ wordIndex: 0, position: 3 })
    expect(caretWordPosition(["abc"], 4)).toBeNull()
  })

  test("later words map correctly", () => {
    const text = ["the", "quick", "brown", "fox"]
    // "the quick bro" = 13 chars → word 2, position 3
    expect(caretWordPosition(text, 13)).toEqual({ wordIndex: 2, position: 3 })
  })
})
