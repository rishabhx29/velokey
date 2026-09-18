// ── Race progress bar math (pure) ─────────────────────────────────────────────
// Extracted from components/race-progress-strip.tsx so the target/percentage
// semantics are unit-testable without mounting React.

import type { RaceProgress, RoomConfig } from "@/shared/race-protocol"

/** The denominator for a player's progress bar. */
export function getProgressTarget(
  config: RoomConfig,
  progress: RaceProgress[],
  playerId: string
): number {
  if (config.mode === "time") return config.timeOption
  const pProg = progress.find((p) => p.playerId === playerId)
  return pProg?.totalWords || config.wordOption || 1
}

/**
 * 0–100 percentage for a player's progress bar.
 * Time mode advances by elapsed seconds; words mode by word index.
 * Finished players always read 100; missing progress reads 0.
 */
export function getProgressPercentage(
  config: RoomConfig,
  progress: RaceProgress[],
  playerId: string
): number {
  const pProg = progress.find((p) => p.playerId === playerId)
  if (!pProg) return 0
  if (pProg.finished) return 100

  const target = getProgressTarget(config, progress, playerId)
  if (target <= 0) return 0

  const current =
    config.mode === "time" ? pProg.elapsedSeconds : pProg.wordIndex

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, (current / target) * 100))
}

/**
 * Per-player convenience variant used by the progress strip: takes the
 * player's own progress entry instead of scanning the whole list.
 */
export function getRaceProgressPercent(
  config: RoomConfig,
  pProg: RaceProgress
): number {
  if (pProg.finished) return 100

  const target =
    config.mode === "time"
      ? config.timeOption
      : pProg.totalWords || config.wordOption || 1
  if (target <= 0) return 0

  const current =
    config.mode === "time" ? pProg.elapsedSeconds : pProg.wordIndex

  return Math.max(0, Math.min(100, (current / target) * 100))
}
