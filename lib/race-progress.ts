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
 * Time mode advances by elapsed seconds; words mode by character offset when
 * available, falling back to word index. Finished players always read 100;
 * missing progress reads 0.
 */
export function getProgressPercentage(
  config: RoomConfig,
  progress: RaceProgress[],
  playerId: string,
  totalChars?: number
): number {
  const pProg = progress.find((p) => p.playerId === playerId)
  if (!pProg) return 0
  return getRaceProgressPercent(config, pProg, totalChars)
}

/**
 * Per-player convenience variant used by the progress strip: takes the
 * player's own progress entry instead of scanning the whole list.
 *
 * In words mode the percent is driven by the player's broadcast charIndex
 * against `totalChars` (the flattened race-text length, words joined by
 * single spaces) whenever both are known, so the bar advances with every
 * typed character instead of hopping word-by-word. Without either, it falls
 * back to the coarser wordIndex fraction.
 */
export function getRaceProgressPercent(
  config: RoomConfig,
  pProg: RaceProgress,
  totalChars?: number
): number {
  if (pProg.finished) return 100

  if (config.mode === "time") {
    if (config.timeOption <= 0) return 0
    return Math.max(
      0,
      Math.min(100, (pProg.elapsedSeconds / config.timeOption) * 100)
    )
  }

  const target = pProg.totalWords || config.wordOption || 1
  if (target <= 0) return 0

  if (totalChars != null && totalChars > 0 && pProg.charIndex != null) {
    return Math.max(0, Math.min(100, (pProg.charIndex / totalChars) * 100))
  }
  return Math.max(0, Math.min(100, (pProg.wordIndex / target) * 100))
}

/** Where an opponent's caret sits inside the word list, for in-text carets. */
export interface CaretWordPosition {
  wordIndex: number
  /** Character offset within that word (may equal word length = end). */
  position: number
}

/**
 * Map a flattened char offset (words joined by single spaces) onto the word
 * it lands in. Used to render opponent carets inside the typing text.
 * Returns null when the offset is past the end of the text.
 */
export function caretWordPosition(
  words: string[],
  charIndex: number
): CaretWordPosition | null {
  if (words.length === 0 || charIndex < 0) return null
  let acc = 0
  for (let i = 0; i < words.length; i++) {
    const wordLen = words[i].length
    // charIndex within this word's characters, or exactly at its end
    if (charIndex <= acc + wordLen) {
      return { wordIndex: i, position: charIndex - acc }
    }
    acc += wordLen + 1 // +1 for the joining space
  }
  return null
}
