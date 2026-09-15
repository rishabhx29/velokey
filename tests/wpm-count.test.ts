import { describe, expect, it } from "vitest"
import {
  accuracyFromCounts,
  countWpm,
  wpmNumeratorFromCounts,
} from "@/lib/wpm-count"

function counts(overrides: Partial<ReturnType<typeof countWpm>> = {}) {
  return {
    correctWordChars: 0,
    correctSpaces: 0,
    allCorrectChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    missedChars: 0,
    ...overrides,
  }
}

describe("countWpm", () => {
  it("counts a single fully correct word", () => {
    const c = countWpm({
      targetWords: ["hello"],
      wordInputs: [],
      typed: "hello",
      wordIndex: 0,
      mode: "words",
      final: true,
    })
    // not final-space committed, but partial last word in timed mode
    expect(c.allCorrectChars).toBe(5)
    expect(c.incorrectChars).toBe(0)
  })

  it("counts correct words and spaces across multiple inputs", () => {
    const c = countWpm({
      targetWords: ["hello", "world"],
      wordInputs: ["hello"],
      typed: "world",
      wordIndex: 1,
      mode: "words",
      final: true,
    })
    expect(c.correctWordChars).toBe(10) // both fully-correct words
    expect(c.correctSpaces).toBe(1)
    expect(c.allCorrectChars).toBe(10)
  })

  it("marks incorrect characters", () => {
    const c = countWpm({
      targetWords: ["hello"],
      wordInputs: ["hxllo"],
      typed: "",
      wordIndex: 1,
      mode: "words",
      final: true,
    })
    expect(c.allCorrectChars).toBe(4)
    expect(c.incorrectChars).toBe(1)
  })

  it("counts extra characters beyond the target", () => {
    const c = countWpm({
      targetWords: ["hi"],
      wordInputs: ["hixx"],
      typed: "",
      wordIndex: 1,
      mode: "words",
      final: true,
    })
    expect(c.allCorrectChars).toBe(2)
    expect(c.incorrectChars).toBe(0)
    expect(c.extraChars).toBe(2)
  })

  it("counts missed characters on a short final word in words mode", () => {
    const c = countWpm({
      targetWords: ["typing"],
      wordInputs: ["typ"],
      typed: "",
      wordIndex: 1,
      mode: "words",
      final: true,
    })
    expect(c.allCorrectChars).toBe(3)
    expect(c.missedChars).toBe(3)
  })

  it("counts a correct partial last word in timed mode", () => {
    const c = countWpm({
      targetWords: ["typing", "next"],
      wordInputs: ["typing"],
      typed: "ne",
      wordIndex: 1,
      mode: "time",
      final: true,
    })
    // timed tests credit a clean prefix of the in-flight word
    expect(c.correctWordChars).toBe(8) // "typing" + space + "ne"
    expect(c.allCorrectChars).toBe(8)
  })

  it("stops when target words run out", () => {
    const c = countWpm({
      targetWords: ["one"],
      wordInputs: ["one", "two"],
      typed: "",
      wordIndex: 2,
      mode: "words",
      final: true,
    })
    expect(c.allCorrectChars).toBe(3)
  })
})

describe("wpmNumeratorFromCounts", () => {
  it("sums correct word chars and spaces", () => {
    expect(
      wpmNumeratorFromCounts(counts({ correctWordChars: 20, correctSpaces: 4 }))
    ).toBe(24)
  })
})

describe("accuracyFromCounts", () => {
  it("returns 100 when nothing typed", () => {
    expect(accuracyFromCounts(counts())).toBe(100)
  })

  it("computes accuracy from correct vs total chars", () => {
    // 90 correct, 10 incorrect → 90%
    expect(
      accuracyFromCounts(counts({ allCorrectChars: 90, incorrectChars: 10 }))
    ).toBe(90)
  })

  it("includes missed chars in the denominator", () => {
    // 90 correct, 10 missed → 90%
    expect(
      accuracyFromCounts(counts({ allCorrectChars: 90, missedChars: 10 }))
    ).toBe(90)
  })
})
