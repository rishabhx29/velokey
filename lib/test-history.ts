// ─────────────────────────────────────────────────────────────────────────────
// Persistent test history for the Stats Dashboard
// ─────────────────────────────────────────────────────────────────────────────

const HISTORY_KEY = "vk-test-history"
const MAX_ENTRIES = 500

export interface TestHistoryEntry {
  id: string
  timestamp: string // ISO
  mode: string
  wpm: number
  raw: number
  accuracy: number
  correctChars: number
  incorrectChars: number
  extraChars: number
  missedChars: number
  duration: number // seconds
  wordCount: number
  difficulty?: string
  language: string
  /** Per-character error counts: key → number of misses */
  charErrors: Record<string, number>
  /** Per-character attempt counts: key → number of attempts */
  charAttempts: Record<string, number>
  /** Keystroke steadiness 0–100; absent on entries saved before it was tracked */
  consistency?: number
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function generateId(): string {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return `${Date.now()}-${Array.from(bytes, (b) => b.toString(36)).join("")}`
}

export function readHistory(): TestHistoryEntry[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(HISTORY_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTestToHistory(
  entry: Omit<TestHistoryEntry, "id" | "timestamp">
): void {
  if (!isBrowser()) return
  const history = readHistory()
  const full: TestHistoryEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  }
  history.unshift(full) // newest first
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function clearHistory(): void {
  if (!isBrowser()) return
  localStorage.removeItem(HISTORY_KEY)
}

// ─────────────────────────────────────────────────────────────────────────────
// Aggregation helpers for the Stats Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyAggregate {
  date: string // YYYY-MM-DD
  avgWpm: number
  maxWpm: number
  avgAccuracy: number
  tests: number
  totalSeconds: number
}

export function aggregateByDay(history: TestHistoryEntry[]): DailyAggregate[] {
  const map = new Map<
    string,
    {
      wpmSum: number
      accSum: number
      maxWpm: number
      count: number
      seconds: number
    }
  >()

  for (const entry of history) {
    const date = entry.timestamp.slice(0, 10) // YYYY-MM-DD
    const existing = map.get(date)
    if (existing) {
      existing.wpmSum += entry.wpm
      existing.accSum += entry.accuracy
      existing.maxWpm = Math.max(existing.maxWpm, entry.wpm)
      existing.count += 1
      existing.seconds += entry.duration
    } else {
      map.set(date, {
        wpmSum: entry.wpm,
        accSum: entry.accuracy,
        maxWpm: entry.wpm,
        count: 1,
        seconds: entry.duration,
      })
    }
  }

  const result: DailyAggregate[] = []
  for (const [date, data] of map) {
    result.push({
      date,
      avgWpm: Math.round(data.wpmSum / data.count),
      maxWpm: data.maxWpm,
      avgAccuracy: Math.round((data.accSum / data.count) * 10) / 10,
      tests: data.count,
      totalSeconds: data.seconds,
    })
  }

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

export interface KeyAccuracy {
  key: string
  attempts: number
  errors: number
  accuracy: number // 0–100
}

export function aggregateKeyAccuracy(
  history: TestHistoryEntry[]
): KeyAccuracy[] {
  const attempts = new Map<string, number>()
  const errors = new Map<string, number>()

  for (const entry of history) {
    if (entry.charAttempts) {
      for (const [key, count] of Object.entries(entry.charAttempts)) {
        attempts.set(key, (attempts.get(key) ?? 0) + count)
      }
    }
    if (entry.charErrors) {
      for (const [key, count] of Object.entries(entry.charErrors)) {
        errors.set(key, (errors.get(key) ?? 0) + count)
      }
    }
  }

  const result: KeyAccuracy[] = []
  for (const [key, totalAttempts] of attempts) {
    const totalErrors = errors.get(key) ?? 0
    result.push({
      key,
      attempts: totalAttempts,
      errors: totalErrors,
      accuracy:
        totalAttempts > 0
          ? Math.round(((totalAttempts - totalErrors) / totalAttempts) * 1000) /
            10
          : 100,
    })
  }

  return result.sort((a, b) => a.accuracy - b.accuracy) // worst first
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-test WPM trend (rolling average + best-so-far)
// ─────────────────────────────────────────────────────────────────────────────

export interface TrendPoint {
  /** 1-based chronological test index */
  index: number
  timestamp: string
  wpm: number
  /** Rolling mean of the last `window` tests (inclusive) */
  rollingAvg: number
  /** Best WPM seen so far (running maximum) */
  best: number
}

/** Build a chronological per-test WPM series with a rolling average and a
 * running best. Newest tests come last; input order does not matter. */
export function computeTrendSeries(
  history: TestHistoryEntry[],
  window = 10
): TrendPoint[] {
  const sorted = [...history].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  )
  let best = 0
  return sorted.map((e, i) => {
    best = Math.max(best, e.wpm)
    const start = Math.max(0, i - window + 1)
    const slice = sorted.slice(start, i + 1)
    const avg = slice.reduce((s, x) => s + x.wpm, 0) / slice.length
    return {
      index: i + 1,
      timestamp: e.timestamp,
      wpm: e.wpm,
      rollingAvg: Math.round(avg * 10) / 10,
      best,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Key accuracy trend (is a key improving or regressing?)
// ─────────────────────────────────────────────────────────────────────────────

export interface KeyAccuracyTrend extends KeyAccuracy {
  /** Accuracy over the older half of tests, when measurable */
  prevAccuracy: number | null
  /** Newer-half accuracy minus older-half accuracy; + means improving */
  delta: number | null
  /** true = improving, false = regressing, null = not enough data */
  improving: boolean | null
}

interface KeyTally {
  attempts: number
  errors: number
}

function tallyKeys(entries: TestHistoryEntry[]): Map<string, KeyTally> {
  const map = new Map<string, KeyTally>()
  for (const entry of entries) {
    if (!entry.charAttempts) continue
    const errs = entry.charErrors ?? {}
    for (const [key, count] of Object.entries(entry.charAttempts)) {
      const t = map.get(key) ?? { attempts: 0, errors: 0 }
      t.attempts += count
      t.errors += errs[key] ?? 0
      map.set(key, t)
    }
  }
  return map
}

function accuracyOf(t: KeyTally | undefined): number | null {
  if (!t || t.attempts === 0) return null
  return Math.round(((t.attempts - t.errors) / t.attempts) * 1000) / 10
}

/** Compare per-key accuracy between the older and newer half of the history
 * (chronologically). Keys need ≥ `minAttempts` overall and appear in both
 * halves to get a meaningful delta; otherwise delta/improving are null. */
export function aggregateKeyAccuracyTrend(
  history: TestHistoryEntry[],
  minAttempts = 5
): KeyAccuracyTrend[] {
  const sorted = [...history].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  )
  const mid = Math.floor(sorted.length / 2)
  const older = tallyKeys(sorted.slice(0, mid))
  const newer = tallyKeys(sorted.slice(mid))
  const overall = tallyKeys(sorted)

  const result: KeyAccuracyTrend[] = []
  for (const [key, t] of overall) {
    const acc = accuracyOf(t) ?? 100
    const prev = accuracyOf(older.get(key))
    const curr = accuracyOf(newer.get(key))
    const hasDelta = t.attempts >= minAttempts && prev !== null && curr !== null
    const delta = hasDelta ? Math.round((curr - prev) * 10) / 10 : null
    result.push({
      key,
      attempts: t.attempts,
      errors: t.errors,
      accuracy: acc,
      prevAccuracy: prev,
      delta,
      improving: delta === null ? null : delta > 0,
    })
  }
  return result.sort((a, b) => a.accuracy - b.accuracy) // worst first
}

// ─────────────────────────────────────────────────────────────────────────────
// Consistency aggregates
// ─────────────────────────────────────────────────────────────────────────────

export interface ConsistencyStats {
  /** Mean over all recorded tests, or null when none recorded it */
  avg: number | null
  /** Mean of the 10 most recent recorded tests */
  recent: number | null
  /** recent − mean of the 10 before those; + means steadier lately */
  delta: number | null
}

export function aggregateConsistency(
  history: TestHistoryEntry[]
): ConsistencyStats {
  const withC = [...history]
    .filter((h) => typeof h.consistency === "number")
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((h) => h.consistency as number)
  if (withC.length === 0) return { avg: null, recent: null, delta: null }

  const mean = (xs: number[]) =>
    xs.length === 0
      ? null
      : Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10

  const avg = mean(withC)
  const recentSlice = withC.slice(-10)
  const priorSlice = withC.slice(-20, -10)
  const recent = mean(recentSlice)
  const prior = mean(priorSlice)
  const delta =
    recent !== null && prior !== null
      ? Math.round((recent - prior) * 10) / 10
      : null
  return { avg, recent, delta }
}
