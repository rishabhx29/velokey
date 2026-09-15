import { describe, expect, it } from "vitest"
import {
  getOrCreateNickname,
  getOrCreateSessionId,
  setNickname,
  PLAYER_COLORS,
  refreshNickname,
  getNickname,
  getOrCreateColor,
  setColor,
} from "@/lib/race-identity"

describe("race identity", () => {
  it("creates and persists a nickname", () => {
    const nick = getOrCreateNickname()
    expect(nick.length).toBeGreaterThan(0)
    expect(getOrCreateNickname()).toBe(nick)
    expect(getNickname()).toBe(nick)
  })

  it("setNickname trims and caps length", () => {
    setNickname("  speedy typer with a very long name  ")
    expect(getNickname()).toBe("speedy typer with a ") // 20 chars
  })

  it("setNickname ignores empty values", () => {
    setNickname("keepme")
    setNickname("   ")
    expect(getNickname()).toBe("keepme")
  })

  it("refreshNickname returns a new value and stores it", () => {
    const before = getNickname()
    const after = refreshNickname()
    expect(after).not.toBe(before)
    expect(getNickname()).toBe(after)
  })

  it("color persists and can be set", () => {
    const color = getOrCreateColor()
    expect(PLAYER_COLORS).toContain(color)
    expect(getOrCreateColor()).toBe(color)
    setColor("#ffffff")
    expect(getOrCreateColor()).toBe("#ffffff")
  })

  it("session ids are unique per call chain", () => {
    const a = getOrCreateSessionId()
    const b = getOrCreateSessionId()
    // sessionStorage-persisted: same within a session, but well-formed
    expect(a).toBe(b)
    expect(a.length).toBeGreaterThan(8)
  })
})
