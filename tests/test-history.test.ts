import { beforeEach, describe, expect, it } from "vitest"
import {
  aggregateByDay,
  aggregateKeyAccuracy,
  aggregateKeyAccuracyTrend,
  aggregateConsistency,
  clearHistory,
  computeTrendSeries,
  readHistory,
  saveTestToHistory,
  type TestHistoryEntry,
} from "@/lib/test-history"

function entry(
  overrides: Partial<TestHistoryEntry> = {}
): Omit<TestHistoryEntry, "id" | "timestamp"> {
  return {
    mode: "time",
    wpm: 80,
    raw: 90,
    accuracy: 95,
    correctChars: 300,
    incorrectChars: 10,
    extraChars: 2,
    missedChars: 3,
    duration: 30,
    wordCount: 60,
    difficulty: "30",
    language: "english",
    charErrors: {},
    charAttempts: {},
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe("saveTestToHistory / readHistory", () => {
  it("saves and reads entries newest-first", () => {
    saveTestToHistory(entry({ wpm: 60 }))
    saveTestToHistory(entry({ wpm: 70 }))
    const history = readHistory()
    expect(history).toHaveLength(2)
    expect(history[0].wpm).toBe(70)
  })

  it("caps history at 500 entries", () => {
    for (let i = 0; i < 505; i++) {
      saveTestToHistory(entry({ wpm: i }))
    }
    expect(readHistory()).toHaveLength(500)
  })

  it("survives corrupt JSON", () => {
    localStorage.setItem("vk-test-history", "{not json")
    expect(readHistory()).toEqual([])
  })

  it("assigns unique ids", () => {
    saveTestToHistory(entry())
    saveTestToHistory(entry())
    const [a, b] = readHistory()
    expect(a.id).not.toBe(b.id)
  })
})

describe("clearHistory", () => {
  it("removes all entries", () => {
    saveTestToHistory(entry())
    clearHistory()
    expect(readHistory()).toEqual([])
  })
})

describe("aggregateByDay", () => {
  it("groups by calendar day with averages and max", () => {
    const history: TestHistoryEntry[] = [
      { ...entry({ wpm: 60 }), id: "1", timestamp: "2026-09-09T10:00:00.000Z" },
      {
        ...entry({ wpm: 80, accuracy: 100 }),
        id: "2",
        timestamp: "2026-09-09T12:00:00.000Z",
      },
      {
        ...entry({ wpm: 100 }),
        id: "3",
        timestamp: "2026-09-10T09:00:00.000Z",
      },
    ]
    const daily = aggregateByDay(history)
    expect(daily).toHaveLength(2)
    expect(daily[0].date).toBe("2026-09-09")
    expect(daily[0].avgWpm).toBe(70)
    expect(daily[0].maxWpm).toBe(80)
    expect(daily[0].tests).toBe(2)
    expect(daily[0].totalSeconds).toBe(60)
    expect(daily[0].avgAccuracy).toBe(97.5)
  })

  it("sorts chronologically", () => {
    const history: TestHistoryEntry[] = [
      { ...entry(), id: "1", timestamp: "2026-09-10T10:00:00.000Z" },
      { ...entry(), id: "2", timestamp: "2026-09-08T10:00:00.000Z" },
    ]
    const dates = aggregateByDay(history).map((d) => d.date)
    expect(dates).toEqual(["2026-09-08", "2026-09-10"])
  })
})

describe("aggregateKeyAccuracy", () => {
  it("sums attempts and errors across entries, worst first", () => {
    const history: TestHistoryEntry[] = [
      {
        ...entry(),
        id: "1",
        timestamp: "2026-09-09T10:00:00.000Z",
        charAttempts: { a: 10, e: 10 },
        charErrors: { a: 5, e: 0 },
      },
      {
        ...entry(),
        id: "2",
        timestamp: "2026-09-09T11:00:00.000Z",
        charAttempts: { a: 5 },
        charErrors: { a: 1 },
      },
    ]
    const result = aggregateKeyAccuracy(history)
    expect(result[0].key).toBe("a") // worst first
    expect(result[0].attempts).toBe(15)
    expect(result[0].errors).toBe(6)
    expect(result[0].accuracy).toBe(60)
    const e = result.find((k) => k.key === "e")
    expect(e?.accuracy).toBe(100)
  })
})

describe("computeTrendSeries", () => {
  it("builds chronological per-test series with rolling avg and running best", () => {
    const history: TestHistoryEntry[] = [
      { ...entry(), id: "1", timestamp: "2026-09-01T10:00:00.000Z", wpm: 50 },
      { ...entry(), id: "2", timestamp: "2026-09-02T10:00:00.000Z", wpm: 70 },
      { ...entry(), id: "3", timestamp: "2026-09-03T10:00:00.000Z", wpm: 60 },
    ]
    const trend = computeTrendSeries(history, 2)
    expect(trend.map((t) => t.wpm)).toEqual([50, 70, 60])
    expect(trend[0].rollingAvg).toBe(50)
    expect(trend[1].rollingAvg).toBe(60)
    expect(trend[2].rollingAvg).toBe(65)
    expect(trend[0].best).toBe(50)
    expect(trend[1].best).toBe(70)
    expect(trend[2].best).toBe(70)
    expect(trend.map((t) => t.index)).toEqual([1, 2, 3])
  })

  it("input order does not matter", () => {
    const history: TestHistoryEntry[] = [
      { ...entry(), id: "1", timestamp: "2026-09-03T10:00:00.000Z", wpm: 60 },
      { ...entry(), id: "2", timestamp: "2026-09-01T10:00:00.000Z", wpm: 50 },
      { ...entry(), id: "3", timestamp: "2026-09-02T10:00:00.000Z", wpm: 70 },
    ]
    const trend = computeTrendSeries(history)
    expect(trend.map((t) => t.wpm)).toEqual([50, 70, 60])
  })
})

describe("aggregateKeyAccuracyTrend", () => {
  it("detects improvement and regression between halves", () => {
    const mk = (id: string, ts: string, aErr: number, eErr: number) => ({
      ...entry(),
      id,
      timestamp: ts,
      charAttempts: { a: 10, e: 10 },
      charErrors: { a: aErr, e: eErr },
    })
    const history: TestHistoryEntry[] = [
      mk("1", "2026-09-01T10:00:00.000Z", 5, 1), // older half
      mk("2", "2026-09-02T10:00:00.000Z", 5, 1),
      mk("3", "2026-09-03T10:00:00.000Z", 1, 4), // newer half
      mk("4", "2026-09-04T10:00:00.000Z", 1, 4),
    ]
    const result = aggregateKeyAccuracyTrend(history)
    const a = result.find((k) => k.key === "a")!
    const e = result.find((k) => k.key === "e")!
    expect(a.prevAccuracy).toBe(50)
    expect(a.delta).toBeGreaterThan(0)
    expect(a.improving).toBe(true)
    expect(e.delta).toBeLessThan(0)
    expect(e.improving).toBe(false)
  })

  it("returns null delta when a key appears in only one half", () => {
    const history: TestHistoryEntry[] = [
      {
        ...entry(),
        id: "1",
        timestamp: "2026-09-01T10:00:00.000Z",
        charAttempts: { z: 10 },
        charErrors: { z: 2 },
      },
      {
        ...entry(),
        id: "2",
        timestamp: "2026-09-02T10:00:00.000Z",
        charAttempts: { q: 10 },
        charErrors: { q: 2 },
      },
    ]
    const result = aggregateKeyAccuracyTrend(history)
    const z = result.find((k) => k.key === "z")!
    expect(z.delta).toBeNull()
    expect(z.improving).toBeNull()
  })
})

describe("aggregateConsistency", () => {
  it("averages recorded consistency and ignores legacy entries", () => {
    const history: TestHistoryEntry[] = [
      {
        ...entry(),
        id: "1",
        timestamp: "2026-09-01T10:00:00.000Z",
        consistency: 80,
      },
      {
        ...entry(),
        id: "2",
        timestamp: "2026-09-02T10:00:00.000Z",
        consistency: 90,
      },
      { ...entry(), id: "3", timestamp: "2026-09-03T10:00:00.000Z" }, // no consistency
    ]
    const stats = aggregateConsistency(history)
    expect(stats.avg).toBe(85)
    expect(stats.recent).toBe(85)
    expect(stats.delta).toBeNull() // fewer than 2 windows
  })

  it("returns nulls when nothing recorded", () => {
    expect(
      aggregateConsistency([
        { ...entry(), id: "x", timestamp: "2026-09-01T10:00:00.000Z" },
      ])
    ).toEqual({
      avg: null,
      recent: null,
      delta: null,
    })
  })
})
