import { beforeEach, describe, expect, it } from "vitest"
import { saveIfPersonalBest, getPersonalBest } from "@/lib/personal-best"

beforeEach(() => {
  localStorage.clear()
})

describe("personal best", () => {
  it("returns null when nothing saved", () => {
    expect(getPersonalBest("time", "30")).toBeNull()
  })

  it("saves the first result as a PB", () => {
    const { isNewPb, previous } = saveIfPersonalBest("time", "30", 70, 96)
    expect(isNewPb).toBe(true)
    expect(previous).toBeNull()
    expect(getPersonalBest("time", "30")?.wpm).toBe(70)
  })

  it("does not replace a slower result", () => {
    saveIfPersonalBest("time", "30", 70, 96)
    const { isNewPb, previous } = saveIfPersonalBest("time", "30", 60, 99)
    expect(isNewPb).toBe(false)
    expect(previous?.wpm).toBe(70)
    expect(getPersonalBest("time", "30")?.wpm).toBe(70)
  })

  it("replaces a faster result", () => {
    saveIfPersonalBest("time", "30", 70, 96)
    const { isNewPb } = saveIfPersonalBest("time", "30", 85, 93)
    expect(isNewPb).toBe(true)
    expect(getPersonalBest("time", "30")?.wpm).toBe(85)
  })

  it("keeps PBs separate per mode/detail", () => {
    saveIfPersonalBest("time", "30", 70, 96)
    saveIfPersonalBest("words", "25", 90, 98)
    expect(getPersonalBest("time", "30")?.wpm).toBe(70)
    expect(getPersonalBest("words", "25")?.wpm).toBe(90)
    expect(getPersonalBest("time", "15")).toBeNull()
  })

  it("survives corrupt JSON", () => {
    localStorage.setItem("velokey-pb-time-30", "nope")
    expect(getPersonalBest("time", "30")).toBeNull()
  })
})
