// ── Race Standings (runtime-neutral, pure) ───────────────────────────────────
// Leaderboard ranking shared by the PartyKit server (endRace) and testable
// in isolation. No I/O, no clock, no randomness.

import type { LeaderboardEntry, RaceMode } from "./race-protocol"

/** Finished players (elapsed > 0) sort before DNFs. */
export function finishedBefore(e: LeaderboardEntry): 0 | 1 {
  return e.elapsedSeconds > 0 ? 0 : 1
}

/**
 * Ranking semantics:
 * - words mode is a first-to-finish race: earliest finish wins, DNFs last,
 *   WPM breaks ties.
 * - time mode is a highest-score contest: WPM wins, accuracy then time
 *   break ties.
 *
 * Sorts in place and assigns `placement` (1-based) to each entry.
 */
export function rankLeaderboard(
  entries: LeaderboardEntry[],
  mode: RaceMode
): LeaderboardEntry[] {
  if (mode === "words") {
    entries.sort(
      (a, b) =>
        finishedBefore(a) - finishedBefore(b) ||
        (finishedBefore(a) === 0 ? a.elapsedSeconds - b.elapsedSeconds : 0) ||
        b.wpm - a.wpm
    )
  } else {
    entries.sort(
      (a, b) =>
        b.wpm - a.wpm ||
        b.accuracy - a.accuracy ||
        a.elapsedSeconds - b.elapsedSeconds
    )
  }
  entries.forEach((e, i) => {
    e.placement = i + 1
  })
  return entries
}
