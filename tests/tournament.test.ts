import { describe, it, expect } from "vitest"
import { isoWeekKey, LEADERBOARD_MODES } from "@/lib/leaderboard"
import {
  createTournament,
  nextMatchup,
  applyMatchResult,
  currentRoundMatch,
  TOURNAMENT_PLAYERS,
  type TournamentState,
} from "@/lib/tournament"

describe("leaderboard lib", () => {
  it("formats ISO week keys", () => {
    expect(isoWeekKey(new Date(Date.UTC(2020, 11, 31)))).toBe("2020W53")
    expect(isoWeekKey(new Date(Date.UTC(2026, 8, 22)))).toMatch(/^\d{4}W\d{2}$/)
  })
  it("exposes the two race modes", () => {
    expect(LEADERBOARD_MODES).toEqual(["words", "time"])
  })
})

describe("tournament bracket", () => {
  const ids = ["a", "b", "c", "d", "e", "f", "g", "h"]

  it("accepts 4–8 players, rejecting others", () => {
    expect(() =>
      createTournament(ids.slice(0, 4), "words", 25, 30, "easy")
    ).not.toThrow()
    expect(() =>
      createTournament(ids.slice(0, 8), "words", 25, 30, "easy")
    ).not.toThrow()
    // 5–7 entrants are allowed — byes pad the bracket.
    expect(() =>
      createTournament(ids.slice(0, 5), "words", 25, 30, "easy")
    ).not.toThrow()
    expect(() =>
      createTournament(ids.slice(0, 6), "words", 25, 30, "easy")
    ).not.toThrow()
    expect(() =>
      createTournament(ids.slice(0, 3), "words", 25, 30, "easy")
    ).toThrow()
    expect(() =>
      createTournament([...ids, "i"], "words", 25, 30, "easy")
    ).toThrow()
  })

  it("supports the declared player counts", () => {
    expect(TOURNAMENT_PLAYERS).toEqual([4, 8])
  })

  it("seeds round 1 with byes for 6 players (8-slot bracket)", () => {
    const t = createTournament(ids.slice(0, 6), "words", 25, 30, "easy")
    expect(t.players).toHaveLength(6)
    expect(t.rounds[0].slots).toHaveLength(8)
    const pairings = t.rounds[0].slots
    // Byes land on even slot indexes; real pairings are (0,1) and (2,3).
    expect(pairings[0]).toBe("a")
    expect(pairings[1]).toBe("b")
    expect(pairings[2]).toBe("c")
    expect(pairings[3]).toBe("d")
  })

  it("currentRoundMatch returns the live pairing", () => {
    const t = createTournament(ids.slice(0, 4), "time", 30, 60, "medium")
    const m = currentRoundMatch(t)
    expect(m).not.toBeNull()
    expect(m!.a).toBe("a")
    expect(m!.b).toBe("b")
  })

  it("advances winners and crowns a champion", () => {
    let t = createTournament(ids.slice(0, 4), "words", 25, 30, "easy")

    // Round 1 (semis): a beats b, then c beats d
    t = applyMatchResult(t, "a")
    expect(t.rounds[0].winnerIds[0]).toBe("a")
    t = applyMatchResult(t, "c")
    expect(t.rounds[0].winnerIds).toEqual(["a", "c"])
    expect(t.currentRound).toBe(1)

    // Final: a beats c → champion crowned immediately (2-round bracket)
    const final = currentRoundMatch(t)
    expect(final).toEqual({ a: "a", b: "c", index: 0 })
    t = applyMatchResult(t, "a")
    expect(t.champion).toBe("a")
  })

  it("nextMatchup walks pairings in order and signals round completion", () => {
    let t = createTournament(ids.slice(0, 8), "words", 25, 30, "easy")
    const seq = ["a", "c", "e", "g", "a", "e", "a"]
    for (const w of seq) {
      const m = nextMatchup(t)
      expect(m).not.toBeNull()
      expect([m!.a, m!.b]).toContain(w)
      t = applyMatchResult(t, w)
    }
    expect(t.champion).toBe("a")
  })

  it("ignores invalid winners", () => {
    const t = createTournament(ids.slice(0, 4), "words", 25, 30, "easy")
    expect(applyMatchResult(t, "zz")).toBe(t)
  })

  it("serializes to plain JSON and back", () => {
    const t = createTournament(ids.slice(0, 4), "words", 25, 30, "easy")
    const round = JSON.parse(JSON.stringify(t)) as TournamentState
    expect(round.currentRound).toBe(0)
    expect(applyMatchResult(round, "a").rounds[0].winnerIds[0]).toBe("a")
  })
})
