import { describe, expect, it } from "vitest"
import {
  COUNTDOWN_SECONDS,
  DISCONNECT_GRACE_MS,
  MAX_PLAYERS,
  PROGRESS_BROADCAST_MS,
  PROGRESS_THROTTLE_MS,
  QUICK_MATCH_WAIT_MS,
  ROOM_TIMEOUT_MS,
} from "@/shared/race-protocol"

describe("race protocol constants", () => {
  it("has sane values", () => {
    expect(MAX_PLAYERS).toBe(8)
    expect(COUNTDOWN_SECONDS).toBe(3)
    expect(ROOM_TIMEOUT_MS).toBe(10 * 60 * 1000)
    expect(QUICK_MATCH_WAIT_MS).toBe(15 * 1000)
    expect(PROGRESS_THROTTLE_MS).toBe(500)
    expect(PROGRESS_BROADCAST_MS).toBeLessThanOrEqual(PROGRESS_THROTTLE_MS)
    expect(DISCONNECT_GRACE_MS).toBe(10 * 1000)
  })
})
