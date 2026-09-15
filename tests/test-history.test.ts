import { beforeEach, describe, expect, it } from "vitest"
import {
  aggregateByDay,
  aggregateKeyAccuracy,
  clearHistory,
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
