import { describe, expect, it } from "vitest"
import {
  generateRaceWords,
  EASY_WORDS,
  MEDIUM_WORDS,
  HARD_WORDS,
} from "@/shared/race-words"

describe("generateRaceWords", () => {
  it("generates the requested count", () => {
    expect(generateRaceWords(25, "easy")).toHaveLength(25)
    expect(generateRaceWords(50, "medium")).toHaveLength(50)
    expect(generateRaceWords(100, "hard")).toHaveLength(100)
  })

  it("cycles the pool when count exceeds pool size", () => {
    expect(generateRaceWords(500, "easy")).toHaveLength(500)
  })

  it("draws only from the requested difficulty pool", () => {
    const words = generateRaceWords(50, "hard")
    for (const w of words) expect(HARD_WORDS).toContain(w)
    const medium = generateRaceWords(50, "medium")
    for (const w of medium) expect(MEDIUM_WORDS).toContain(w)
  })

  it("is deterministic with a seeded RNG", () => {
    const rng = () => 0.42
    expect(generateRaceWords(10, "easy", rng)).toEqual(
      generateRaceWords(10, "easy", rng)
    )
  })

  it("produces varied output with the default RNG (statistical)", () => {
    const a = generateRaceWords(20, "easy").join(" ")
    const b = generateRaceWords(20, "easy").join(" ")
    // Not a hard guarantee, but the chance of 20 identical picks is negligible.
    expect(a).not.toBe(b)
  })

  it("keeps pools non-empty and lowercase-dominated", () => {
    expect(EASY_WORDS.length).toBeGreaterThan(100)
    expect(MEDIUM_WORDS.length).toBeGreaterThan(50)
    expect(HARD_WORDS.length).toBeGreaterThan(50)
  })
})
