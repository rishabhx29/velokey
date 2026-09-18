export type WpmCountMode =
  "time" | "words" | "quote" | "zen" | "code" | "custom" | "brainrot" | "focus"

export interface WpmCounts {
  correctWordChars: number
  correctSpaces: number
  allCorrectChars: number
  incorrectChars: number
  extraChars: number
  missedChars: number
}

interface CountParams {
  targetWords: string[]
  wordInputs: string[]
  typed: string
  wordIndex: number
  mode: WpmCountMode
  final: boolean
}

/** Per-character comparison verdict between a typed word and its target. */
interface CharDiff {
  allCorrect: number
  incorrect: number
  extra: number
  missed: number
}

/**
 * Compare a typed word against its target character-by-character.
 * Characters beyond the shorter of the two words count as extra (typed
 * too much) or missed (typed too little).
 */
function diffChars(inputWord: string, targetWord: string): CharDiff {
  let allCorrect = 0
  let incorrect = 0
  const shared = Math.min(inputWord.length, targetWord.length)

  for (let c = 0; c < shared; c++) {
    if (inputWord[c] === targetWord[c]) allCorrect++
    else incorrect++
  }

  return {
    allCorrect,
    incorrect,
    extra: inputWord.length - shared,
    missed: targetWord.length - shared,
  }
}

/**
 * Apply the outcome of a word whose input was shorter than its target.
 * A partially typed final word (timed tests) still earns credit for its
 * correct characters when there are no mistakes; otherwise it counts as
 * missed characters. Non-final or mismatched words simply add their missed
 * characters (zero when the input was not shorter).
 */
function addPartialWordOutcome(
  counts: WpmCounts,
  diff: CharDiff,
  isLastWord: boolean,
  shouldCountPartialLastWord: boolean
) {
  if (isLastWord && shouldCountPartialLastWord) {
    if (diff.incorrect === 0) counts.correctWordChars += diff.allCorrect
    return
  }
  counts.missedChars += diff.missed
}

export function countWpm({
  targetWords,
  wordInputs,
  typed,
  wordIndex,
  mode,
  final,
}: CountParams): WpmCounts {
  /** Invariant: `wordInputs.length === wordIndex` (slice guards if briefly out of sync). */
  const inputWords = [...wordInputs.slice(0, wordIndex), typed]

  const counts: WpmCounts = {
    correctWordChars: 0,
    correctSpaces: 0,
    allCorrectChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    missedChars: 0,
  }

  const isTimedTest = mode === "time" || mode === "zen"
  const shouldCountPartialLastWord = !final || isTimedTest

  for (let i = 0; i < inputWords.length; i++) {
    const inputWord = inputWords[i] as string
    const targetWord = targetWords[i]
    if (targetWord === undefined) break

    if (inputWord === targetWord) {
      counts.correctWordChars += targetWord.length
      counts.allCorrectChars += targetWord.length
      if (i < inputWords.length - 1 && !inputWord.endsWith("\n"))
        counts.correctSpaces++
      continue
    }

    const diff = diffChars(inputWord, targetWord)
    counts.allCorrectChars += diff.allCorrect
    counts.incorrectChars += diff.incorrect
    counts.extraChars += diff.extra

    addPartialWordOutcome(
      counts,
      diff,
      i === inputWords.length - 1,
      shouldCountPartialLastWord
    )
  }

  return counts
}

export function wpmNumeratorFromCounts(c: WpmCounts): number {
  return c.correctWordChars + c.correctSpaces
}

export function accuracyFromCounts(c: WpmCounts): number {
  const denom = c.allCorrectChars + c.incorrectChars + c.missedChars
  if (denom <= 0) return 100
  return Math.round((c.allCorrectChars / denom) * 100)
}
