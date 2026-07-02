// ─────────────────────────────────────────────────────────────────────────────
// Persistent test history for the Stats Dashboard
// ─────────────────────────────────────────────────────────────────────────────

const HISTORY_KEY = "vk-test-history";
const MAX_ENTRIES = 500;

export interface TestHistoryEntry {
  id: string;
  timestamp: string; // ISO
  mode: string;
  wpm: number;
  raw: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  duration: number; // seconds
  wordCount: number;
  difficulty?: string;
  language: string;
  /** Per-character error counts: key → number of misses */
  charErrors: Record<string, number>;
  /** Per-character attempt counts: key → number of attempts */
  charAttempts: Record<string, number>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function readHistory(): TestHistoryEntry[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTestToHistory(entry: Omit<TestHistoryEntry, "id" | "timestamp">): void {
  if (!isBrowser()) return;
  const history = readHistory();
  const full: TestHistoryEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  history.unshift(full); // newest first
  if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(HISTORY_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Aggregation helpers for the Stats Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyAggregate {
  date: string; // YYYY-MM-DD
  avgWpm: number;
  maxWpm: number;
  avgAccuracy: number;
  tests: number;
  totalSeconds: number;
}

export function aggregateByDay(history: TestHistoryEntry[]): DailyAggregate[] {
  const map = new Map<string, { wpmSum: number; accSum: number; maxWpm: number; count: number; seconds: number }>();
  
  for (const entry of history) {
    const date = entry.timestamp.slice(0, 10); // YYYY-MM-DD
    const existing = map.get(date);
    if (existing) {
      existing.wpmSum += entry.wpm;
      existing.accSum += entry.accuracy;
      existing.maxWpm = Math.max(existing.maxWpm, entry.wpm);
      existing.count += 1;
      existing.seconds += entry.duration;
    } else {
      map.set(date, {
        wpmSum: entry.wpm,
        accSum: entry.accuracy,
        maxWpm: entry.wpm,
        count: 1,
        seconds: entry.duration,
      });
    }
  }

  const result: DailyAggregate[] = [];
  for (const [date, data] of map) {
    result.push({
      date,
      avgWpm: Math.round(data.wpmSum / data.count),
      maxWpm: data.maxWpm,
      avgAccuracy: Math.round((data.accSum / data.count) * 10) / 10,
      tests: data.count,
      totalSeconds: data.seconds,
    });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export interface KeyAccuracy {
  key: string;
  attempts: number;
  errors: number;
  accuracy: number; // 0–100
}

export function aggregateKeyAccuracy(history: TestHistoryEntry[]): KeyAccuracy[] {
  const attempts = new Map<string, number>();
  const errors = new Map<string, number>();

  for (const entry of history) {
    if (entry.charAttempts) {
      for (const [key, count] of Object.entries(entry.charAttempts)) {
        attempts.set(key, (attempts.get(key) ?? 0) + count);
      }
    }
    if (entry.charErrors) {
      for (const [key, count] of Object.entries(entry.charErrors)) {
        errors.set(key, (errors.get(key) ?? 0) + count);
      }
    }
  }

  const result: KeyAccuracy[] = [];
  for (const [key, totalAttempts] of attempts) {
    const totalErrors = errors.get(key) ?? 0;
    result.push({
      key,
      attempts: totalAttempts,
      errors: totalErrors,
      accuracy: totalAttempts > 0 ? Math.round(((totalAttempts - totalErrors) / totalAttempts) * 1000) / 10 : 100,
    });
  }

  return result.sort((a, b) => a.accuracy - b.accuracy); // worst first
}
