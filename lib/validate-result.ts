import type { ResultStats, WpmSnapshot } from "@/components/results-screen"
import {
  validateResultStats,
  type InvalidReason,
  type ValidationResult,
} from "@/shared/result-validation"

export type { InvalidReason, ValidationResult }

/**
 * Returns `{ valid: true }` for a legitimate result or
 * `{ valid: false, reason }` with the first failing check.
 *
 * The checks themselves live in `shared/result-validation.ts` so the
 * PartyKit race server can run the exact same anti-cheat heuristics on
 * incoming `finish` messages (see realtime/race-room.ts).
 */
export function validateResult(stats: ResultStats): ValidationResult {
  return validateResultStats(
    {
      wpm: stats.wpm,
      raw: stats.raw,
      accuracy: stats.accuracy,
      correctChars: stats.correctChars,
      incorrectChars: stats.incorrectChars,
      extraChars: stats.extraChars,
      elapsedSeconds: stats.elapsedSeconds,
      wpmHistory: stats.wpmHistory,
    },
    stats.consistency
  )
}

/** Convenience boolean wrapper — drop-in replacement for the old helper. */
export function isInvalidTestResult(stats: ResultStats): boolean {
  return !validateResult(stats).valid
}
