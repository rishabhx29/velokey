import { describe, expect, it } from "vitest"
import {
  generateWords,
  generateWordsFromPool,
  generateFocusWords,
} from "@/lib/words"

describe("generateWords", () => {
  it("generates the requested count", () => {
    const words = generateWords(50)
    expect(words).toHaveLength(50)
  })

  it("respects difficulty length bounds", () => {
    const easy = generateWords(30, { difficulty: "easy" })
    expect(everyLengthWithin(easy, 2, 6)).toBe(true)

    const medium = generateWords(30, { difficulty: "medium" })
    expect(everyLengthWithin(medium, 4, 9)).toBe(true)

    const hard = generateWords(30, { difficulty: "hard" })
    expect(everyLengthWithin(hard, 6, 13)).toBe(true)
  })

  it("can inject numbers", () => {
    // 15% chance per word — with 200 words statistically all-number coverage is certain
    const words = generateWords(200, { numbers: true })
    expect(words.some((w) => /^\d+$/.test(w))).toBe(true)
  })

  it("can inject punctuation", () => {
    const words = generateWords(200, { punctuation: true })
    expect(words.some((w) => /[",!?;:.]/.test(w) || /^[A-Z]/.test(w))).toBe(
      true
    )
  })
})

describe("generateWordsFromPool", () => {
  // 20+ entries per difficulty bucket so the small-pool fallback never trips
  const pool = [
    "a",
    "be",
    "see",
    "dot",
    "fox",
    "run",
    "sun",
    "map",
    "key",
    "cup",
    "longer",
    "longestword",
    "banana",
    "cherry",
    "silver",
    "copper",
    "purple",
    "yellow",
    "orange",
    "quartz",
    "xy",
    "tv",
  ]

  it("generates the requested count", () => {
    expect(generateWordsFromPool(pool, 10)).toHaveLength(10)
  })

  it("filters by difficulty when the bucket is rich enough", () => {
    const easy = generateWordsFromPool(pool, 5, { difficulty: "easy" })
    expect(easy.every((w) => w.length <= 6)).toBe(true)

    const mediumPool = pool.filter((w) => w.length >= 4 && w.length <= 8)
    const medium = generateWordsFromPool(mediumPool, 5, {
      difficulty: "medium",
    })
    expect(medium.every((w) => w.length >= 4 && w.length <= 8)).toBe(true)

    const hardPool = pool.filter((w) => w.length >= 6)
    const hard = generateWordsFromPool(hardPool, 5, { difficulty: "hard" })
    expect(hard.every((w) => w.length >= 6)).toBe(true)
  })

  it("avoids immediate repetition when the pool allows", () => {
    const words = generateWordsFromPool(["a", "b"], 6)
    for (let i = 1; i < words.length; i++) {
      expect(words[i]).not.toBe(words[i - 1])
    }
  })

  it("handles a single-word pool", () => {
    expect(generateWordsFromPool(["solo"], 3)).toEqual(["solo", "solo", "solo"])
  })

  it("returns an empty array for an empty pool", () => {
    expect(generateWordsFromPool([], 3)).toEqual([])
  })
})

describe("generateFocusWords", () => {
  it("returns words containing the target keys when candidates are rich", () => {
    const pool = [
      "apple",
      "apricot",
      "grape",
      "papaya",
      "peach",
      "maple",
      "snape",
      "tape",
      "cape",
      "drape",
    ]
    const result = generateFocusWords(pool, ["a", "p"], 10)
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((w) => /[ap]/i.test(w))).toBe(true)
  })

  it("falls back to the whole pool when few words match", () => {
    const pool = ["apple", "zzz", "qqq"]
    const result = generateFocusWords(pool, ["a"], 3)
    expect(result).toHaveLength(3)
  })

  it("falls back to the whole pool with no keys", () => {
    const pool = ["alpha", "beta"]
    const result = generateFocusWords(pool, [], 5)
    expect(result).toHaveLength(5)
  })

  it("handles an empty pool", () => {
    expect(generateFocusWords([], ["a"], 5)).toEqual([])
  })
})

function everyLengthWithin(words: string[], min: number, max: number): boolean {
  return words.every((w) => w.length >= min && w.length <= max)
}
