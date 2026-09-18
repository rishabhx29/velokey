import { beforeEach, describe, expect, it } from "vitest"
import {
  clearMistakes,
  getMistakeHistory,
  getMistakeStats,
  getProblemWords,
  getWorstKeys,
  recordTestMistakes,
  buildHistoryPracticeWords,
} from "@/lib/mistakes"

const TIMINGS = Array.from({ length: 10 }, () => 500)

beforeEach(() => {
  localStorage.clear()
})

describe("recordTestMistakes", () => {
  it("tracks mistyped words", () => {
    recordTestMistakes(["hello", "world"], ["hello", "wrld"], TIMINGS, "words")
    const problems = getProblemWords()
    expect(problems.map((p) => p.word)).toContain("world")
    expect(problems.map((p) => p.word)).not.toContain("hello")
  })

  it("tracks slow words", () => {
    const timings = [100, 100, 100, 100, 100, 100, 100, 100, 100, 9999]
    recordTestMistakes(
      ["a", "b", "c", "d", "e", "f", "g", "h", "i", "slow"],
      ["a", "b", "c", "d", "e", "f", "g", "h", "i", "slow"],
      timings,
      "words"
    )
    expect(getProblemWords().map((p) => p.word)).toContain("slow")
  })

  it("ignores code mode", () => {
    recordTestMistakes(["const"], ["cnst"], TIMINGS, "code")
    expect(getProblemWords()).toHaveLength(0)
  })

  it("graduates words after 5 consecutive clean hits", () => {
    // seed as a problem
    recordTestMistakes(["word"], ["wrd"], [500], "words")
    expect(getProblemWords()).toHaveLength(1)

    // 5 clean passes → graduates out
    for (let i = 0; i < 5; i++) {
      recordTestMistakes(["word"], ["word"], [500], "words")
    }
    expect(getProblemWords()).toHaveLength(0)
  })

  it("caps the outcomes window", () => {
    for (let i = 0; i < 20; i++) {
      recordTestMistakes(["word"], ["wrd"], [500], "words")
    }
    const entry = getProblemWords()[0]
    expect(entry.outcomes.length).toBeLessThanOrEqual(8)
    expect(entry.attempts).toBe(20)
  })

  it("skips words never reached", () => {
    recordTestMistakes(["hello", "unreached"], ["hello"], [500], "words")
    expect(getProblemWords().map((p) => p.word)).not.toContain("unreached")
  })

  it("records a mastery snapshot", () => {
    recordTestMistakes(["hello"], ["helo"], [500], "words")
    expect(getMistakeHistory()).toHaveLength(1)
  })
})

describe("getMistakeStats", () => {
  it("reports empty stats when clean", () => {
    expect(getMistakeStats()).toEqual({
      count: 0,
      mastery: 100,
      attempts: 0,
      misses: 0,
    })
  })

  it("computes mastery from recent outcomes", () => {
    recordTestMistakes(["word"], ["wrd"], [500], "words") // problem
    recordTestMistakes(["word"], ["word"], [500], "words") // clean
    const s = getMistakeStats()
    expect(s.count).toBe(1)
    expect(s.mastery).toBe(50) // 1 clean / 2 total
  })
})

describe("getWorstKeys", () => {
  it("returns keys weighted by misses", () => {
    localStorage.setItem(
      "velokey-mistakes",
      JSON.stringify({
        zebra: {
          word: "zebra",
          attempts: 5,
          misses: 3,
          outcomes: [1, 1, 1, 0, 0, 0, 0, 0],
          lastSeen: "2026-01-01",
        },
        quiet: {
          word: "quiet",
          attempts: 5,
          misses: 1,
          outcomes: [1, 0, 0, 0, 0, 0, 0, 0],
          lastSeen: "2026-01-01",
        },
      })
    )
    const worst = getWorstKeys(2)
    // zebra contributes 3 misses to z/e/b/r/a; quiet contributes 1 to q/u/i/e/t
    // → 'e' totals 4, z/b/r/a total 3, q/u/i/t total 1
    expect(worst[0]).toBe("e")
    expect(worst).toEqual(["e", "z"])
  })

  it("only counts a-z keys", () => {
    localStorage.setItem(
      "velokey-mistakes",
      JSON.stringify({
        "hello!": {
          word: "hello!",
          attempts: 2,
          misses: 2,
          outcomes: [1, 1],
          lastSeen: "2026-01-01",
        },
      })
    )
    const worst = getWorstKeys(5)
    expect(worst).not.toContain("!")
    // l appears twice in "hello!" → double weight; the rest tie at 1 miss each
    expect(worst[0]).toBe("l")
    expect(new Set(worst)).toEqual(new Set(["h", "e", "l", "o"]))
  })
})

describe("buildHistoryPracticeWords", () => {
  it("repeats the problem set to a usable length", () => {
    localStorage.setItem(
      "velokey-mistakes",
      JSON.stringify({
        alpha: {
          word: "alpha",
          attempts: 2,
          misses: 2,
          outcomes: [1, 1],
          lastSeen: "2026-01-01",
        },
      })
    )
    const words = buildHistoryPracticeWords()
    expect(words.length).toBeGreaterThanOrEqual(20)
    expect(words.every((w) => w === "alpha")).toBe(true)
  })

  it("returns empty with no problems", () => {
    expect(buildHistoryPracticeWords()).toEqual([])
  })
})

describe("clearMistakes", () => {
  it("removes all stored data", () => {
    recordTestMistakes(["hello"], ["helo"], [500], "words")
    clearMistakes()
    expect(getProblemWords()).toHaveLength(0)
    expect(getMistakeHistory()).toHaveLength(0)
  })
})
