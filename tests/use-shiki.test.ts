import { describe, expect, it } from "vitest"
import { mapWordsToOffsets } from "@/hooks/use-shiki"

describe("mapWordsToOffsets", () => {
  it("maps simple space-separated words", () => {
    const raw = "one two three"
    const words = ["one", "two", "three"]
    expect(mapWordsToOffsets(raw, words)).toEqual([0, 4, 8])
  })

  it("handles repeated words at their own occurrences", () => {
    const raw = "const a = 1;\nconst b = 2;"
    const words = ["const", "a", "=", "1;", "const", "b", "=", "2;"]
    const offsets = mapWordsToOffsets(raw, words)
    // The second "const" must point at its own occurrence, not the first
    expect(raw.slice(offsets[0], offsets[0] + 5)).toBe("const")
    expect(raw.slice(offsets[4], offsets[4] + 5)).toBe("const")
    expect(offsets[4]).toBe(offsets[0] + 13) // "const a = 1;" (12 chars) + \n
    expect(offsets[0]).not.toBe(offsets[4])
  })

  it("skips mixed whitespace including newlines and tabs", () => {
    const raw = "a\n\tb  c"
    const offsets = mapWordsToOffsets(raw, ["a", "b", "c"])
    expect(raw[offsets[0]]).toBe("a")
    expect(raw[offsets[1]]).toBe("b")
    expect(raw[offsets[2]]).toBe("c")
  })

  it("marks mismatches with -1", () => {
    expect(mapWordsToOffsets("foo bar", ["foo", "baz"])).toEqual([0, -1])
  })

  it("handles empty input", () => {
    expect(mapWordsToOffsets("", [])).toEqual([])
  })
})
