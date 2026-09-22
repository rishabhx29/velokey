"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMountEffect } from "@/hooks/use-mount-effect"
import {
  generateWords,
  generateWordsFromPool,
  generateFocusWords,
  type Difficulty,
} from "@/lib/words"
import { randomPick } from "@/lib/secure-random"
import { getWorstKeys } from "@/lib/mistakes"
import { readHistory, aggregateKeyAccuracyTrend } from "@/lib/test-history"
import { recordLessonResult } from "@/lib/courses"
import { getQuote, type QuoteLength } from "@/lib/quotes"
import {
  fetchLanguageWords,
  isRTLLanguage,
  stripArabicDiacritics,
} from "@/lib/languages"
import { useSettings } from "@/components/settings-context"
import {
  accuracyFromCounts,
  countWpm,
  wpmNumeratorFromCounts,
} from "@/lib/wpm-count"
import type { ResultStats, WpmSnapshot } from "@/components/results-screen"
import { CODE_MANIFEST, getCodeContent } from "@/lib/code"
import {
  type TestMode,
  TEST_MODE_STORAGE_KEY,
  TIME_OPTION_STORAGE_KEY,
  WORD_OPTION_STORAGE_KEY,
  QUOTE_LENGTH_STORAGE_KEY,
  PUNCTUATION_STORAGE_KEY,
  NUMBERS_STORAGE_KEY,
  DIFFICULTY_STORAGE_KEY,
  CUSTOM_TEXT_STORAGE_KEY,
  DEFAULT_CUSTOM_TEXT,
  CODE_LANGUAGE_STORAGE_KEY,
  CODE_CHAPTER_STORAGE_KEY,
  CUSTOM_CODE_LANGUAGE_STORAGE_KEY,
  readStoredTestMode,
  readStoredTimeOption,
  readStoredWordOption,
  readStoredQuoteLength,
  readStoredBool,
  readStoredDifficulty,
  readStoredCustomText,
  readStoredCodeLanguage,
  readStoredCodeChapter,
  readStoredCustomCodeLanguage,
} from "@/lib/test-storage"

import { BRAINROT_WORDS } from "@/lib/brainrot"
import { markPerformance, measurePerformance } from "@/lib/performance-metrics"
import {
  customTextToWords,
  getCommentPrefix,
  parseCodeContent,
} from "@/lib/text-parsing"

/** Human-readable summary of the active mode's configuration. */
function describeModeDetail(
  mode: TestMode,
  opts: { timeOption: number; wordOption: number; quoteLength: string }
): string {
  if (mode === "time") return String(opts.timeOption)
  if (mode === "words") return String(opts.wordOption)
  if (mode === "quote") return opts.quoteLength
  if (mode === "custom") return "custom"
  return ""
}

/** Target word count per test mode (timed tests over-generate). */
function wordCountForMode(mode: TestMode, wordsOption: number): number {
  if (mode === "time") return 200
  if (mode === "words" || mode === "brainrot" || mode === "focus") {
    return wordsOption
  }
  return 100
}

/** Which code-mode parts are missing, for the "Select X and Y" prompt. */
function describeMissingCodeParts(
  hasLang: boolean,
  hasChapter: boolean
): string[] {
  if (!hasLang && !hasChapter) return ["language", "and", "chapter"]
  if (!hasLang) return ["language"]
  return ["chapter"]
}

/** Result of resolving a custom-mode word set. */
interface CustomWordsResult {
  words: string[]
  codeLines: number[]
  codeIndents: number[]
}

/**
 * Resolve the word set for the "custom" mode. When a code language is set the
 * custom text is parsed as code (lines + indents); otherwise it is split into
 * plain words. Falls back to the default custom text when empty.
 */
function resolveCustomWords(
  customText: string,
  codeLang: string
): CustomWordsResult {
  const fallbackWords = customTextToWords(DEFAULT_CUSTOM_TEXT)

  if (codeLang) {
    const parsed = parseCodeContent(customText)
    const hasWords = parsed.words.length > 0
    return {
      words: hasWords ? parsed.words : fallbackWords,
      codeLines: hasWords ? parsed.lineLengths : [],
      codeIndents: hasWords ? parsed.lineIndents : [],
    }
  }

  const customWords = customTextToWords(customText)
  return {
    words: customWords.length > 0 ? customWords : fallbackWords,
    codeLines: [],
    codeIndents: [],
  }
}

/**
 * Resolve the word set for "code" mode. Missing selection or load failures
 * produce friendly placeholder words so the test area is never blank.
 */
function resolveCodeWords(
  codeLang: string,
  codeChapter: string
): CustomWordsResult {
  const prefix = getCommentPrefix(codeLang)

  if (!codeLang || !codeChapter) {
    const missing = describeMissingCodeParts(
      Boolean(codeLang),
      Boolean(codeChapter)
    )
    const fallback = [
      prefix,
      "Select",
      "a",
      ...missing,
      "from",
      "the",
      "top",
      "menu",
      "to",
      "start",
    ]
    return { words: fallback, codeLines: [fallback.length], codeIndents: [0] }
  }

  const content = getCodeContent(codeLang, codeChapter)
  if (!content) {
    return {
      words: [prefix, "error", "loading", "file"],
      codeLines: [4],
      codeIndents: [0],
    }
  }

  const parsed = parseCodeContent(content)
  const hasWords = parsed.words.length > 0
  return {
    words: hasWords ? parsed.words : [prefix, "empty", "file"],
    codeLines: hasWords ? parsed.lineLengths : [3],
    codeIndents: hasWords ? parsed.lineIndents : [0],
  }
}

/**
 * Load (or resolve) the word set for a freshly reset test. Async because
 * word generation can fetch language pools. Returns the words plus optional
 * code-mode line metadata.
 */
async function loadTestWords(opts: {
  m: TestMode
  ql: QuoteLength
  ct: string
  ccl: string
  cl: string
  cc: string
  wc: number
  buildWords: (
    lang: string,
    count: number,
    o: {
      punctuation: boolean
      numbers: boolean
      difficulty: Difficulty | undefined
      showDiacritics?: boolean
    }
  ) => Promise<string[]>
  lang: string
  p: boolean
  n: boolean
  d: Difficulty | undefined
  sd: boolean | undefined
}): Promise<CustomWordsResult & { author: string | null }> {
  const { m } = opts
  if (m === "quote") {
    const { words, author } = getQuote(opts.ql)
    return { words, codeLines: [], codeIndents: [], author }
  }
  if (m === "custom") {
    const resolved = resolveCustomWords(opts.ct, opts.ccl)
    return { ...resolved, author: null }
  }
  if (m === "brainrot") {
    return {
      words: generateWordsFromPool(BRAINROT_WORDS, opts.wc, {
        punctuation: false,
        numbers: false,
      }),
      codeLines: [],
      codeIndents: [],
      author: null,
    }
  }
  if (m === "focus") {
    // Adaptive targeting: lifetime problem keys, plus keys whose accuracy is
    // actively regressing in recent tests (they need the practice most).
    const worst = getWorstKeys(6)
    const regressing = aggregateKeyAccuracyTrend(readHistory())
      .filter((k) => k.improving === false && k.attempts >= 10)
      .slice(0, 3)
      .map((k) => k.key)
    const merged = [...new Set([...regressing, ...worst])]
    const targetKeys =
      merged.length > 0 ? merged : ["e", "t", "a", "o", "i", "n", "s", "r"]
    const baseWords = await opts.buildWords(opts.lang, opts.wc * 3, {
      punctuation: opts.p,
      numbers: opts.n,
      difficulty: opts.d,
      showDiacritics: opts.sd,
    })
    return {
      words: generateFocusWords(baseWords, targetKeys, opts.wc),
      codeLines: [],
      codeIndents: [],
      author: null,
    }
  }
  if (m === "code") {
    const resolved = resolveCodeWords(opts.cl, opts.cc)
    return { ...resolved, author: null }
  }
  return {
    words: await opts.buildWords(opts.lang, opts.wc, {
      punctuation: opts.p,
      numbers: opts.n,
      difficulty: opts.d,
      showDiacritics: opts.sd,
    }),
    codeLines: [],
    codeIndents: [],
    author: null,
  }
}

/** Everything persisted across sessions, as one snapshot of localStorage. */
interface StoredTestOptions {
  mode: TestMode | undefined
  timeOption: number | undefined
  wordOption: number | undefined
  quoteLength: QuoteLength | undefined
  punctuation: boolean | undefined
  numbers: boolean | undefined
  difficulty: Difficulty | undefined
  customText: string | undefined
  customCodeLanguage: string | undefined
  codeLanguage: string | undefined
  codeChapter: string | undefined
}

/** Read all persisted test options from localStorage in one place. */
function readStoredTestOptions(): StoredTestOptions {
  return {
    mode: readStoredTestMode(),
    timeOption: readStoredTimeOption(),
    wordOption: readStoredWordOption(),
    quoteLength: readStoredQuoteLength(),
    punctuation: readStoredBool(PUNCTUATION_STORAGE_KEY),
    numbers: readStoredBool(NUMBERS_STORAGE_KEY),
    difficulty: readStoredDifficulty(),
    customText: readStoredCustomText(),
    customCodeLanguage: readStoredCustomCodeLanguage(),
    codeLanguage: readStoredCodeLanguage(),
    codeChapter: readStoredCodeChapter(),
  }
}

/** Alt+Backspace/Delete or Ctrl+Backspace — delete the whole word. */
function isWordDeleteCombo(e: {
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  key: string
}): boolean {
  const isAltDelete =
    e.altKey &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    (e.key === "Backspace" || e.key === "Delete")
  const isCtrlBackspace =
    e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey && e.key === "Backspace"
  return isAltDelete || isCtrlBackspace
}

type ResetOverrides = Partial<{
  mode: TestMode
  quoteLength: QuoteLength
  wordOption: number
  timeOption: number
  punctuation: boolean
  numbers: boolean
  difficulty: Difficulty | undefined
  language: string
  showDiacritics: boolean
  customText: string
  customCodeLanguage: string
  codeLanguage: string
  codeChapter: string
}>

interface UseTypingTestProps {
  onKeyHighlight?: (key: string | null) => void
  onFinished?: (finished: boolean) => void
  onTypingActiveChange?: (active: boolean) => void
  onFocusChange?: (focused: boolean) => void
  onWrongKey?: () => void
  pauseTypingInputRefocus?: boolean

  // Multiplayer overrides
  raceWords?: string[]
  raceMode?: "words" | "time"
  raceTimeOption?: number
  raceWordOption?: number
  onProgressUpdate?: (progress: {
    wordIndex: number
    wpm: number
    accuracy: number
    totalWords: number
  }) => void
  onRaceFinish?: (stats: ResultStats) => void
  disabled?: boolean
  /** No keyboard footer is rendered below (race page): center the text vertically. */
  standaloneLayout?: boolean
}

export function useTypingTest({
  onKeyHighlight,
  onFinished,
  onTypingActiveChange,
  onFocusChange,
  onWrongKey,
  pauseTypingInputRefocus = false,
  raceWords,
  raceMode,
  raceTimeOption,
  raceWordOption,
  onProgressUpdate,
  onRaceFinish,
  disabled,
}: UseTypingTestProps) {
  const { language, showDiacritics, autoPair } = useSettings()
  const isRTL = isRTLLanguage(language)

  const pauseRefocusRef = useRef(false)
  useEffect(() => {
    pauseRefocusRef.current = pauseTypingInputRefocus
  }, [pauseTypingInputRefocus])

  const [mode, setMode] = useState<TestMode>("time")
  const [timeOption, setTimeOption] = useState<number>(30)
  const [wordOption, setWordOption] = useState<number>(25)
  const [quoteLength, setQuoteLength] = useState<QuoteLength>("medium")
  const [quoteAuthor, setQuoteAuthor] = useState<string | null>(null)
  const [punctuation, setPunctuation] = useState(false)
  const [numbers, setNumbers] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>("easy")
  const [customText, setCustomText] = useState<string>(DEFAULT_CUSTOM_TEXT)
  const [customCodeLanguage, setCustomCodeLanguage] = useState<string>("")
  const [codeLanguage, setCodeLanguage] = useState<string>("")
  const [codeChapter, setCodeChapter] = useState<string>("")

  const langPoolRef = useRef<{
    code: string
    hard: boolean
    words: string[]
  } | null>(null)

  const [words, setWords] = useState<string[]>([])

  const [codeLines, setCodeLines] = useState<number[]>([])
  const [codeIndents, setCodeIndents] = useState<number[]>([])
  const [typed, setTyped] = useState("")
  const [wordIndex, setWordIndex] = useState(0)
  const [started, setStarted] = useState(false)
  const [rowOffset, setRowOffset] = useState(0)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [wordInputs, setWordInputs] = useState<string[]>([])
  const [wpmHistory, setWpmHistory] = useState<WpmSnapshot[]>([])
  const [showControls, setShowControls] = useState(true)
  const [isFocused, setIsFocused] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [isActivelyTyping, setIsActivelyTyping] = useState(false)
  const [screenFade, setScreenFade] = useState(1)
  const [capsLock, setCapsLock] = useState(false)
  const [frozenStats, setFrozenStats] = useState<ResultStats | null>(null)

  const correctCharsRef = useRef(0)
  const allTypedRef = useRef(0)
  const errorsThisSecondRef = useRef(0)
  const elapsedSecondsRef = useRef(0)
  const correctedErrorsRef = useRef(0)
  const wordTimingsMsRef = useRef<number[]>([])
  const wordStartTimeRef = useRef<number | null>(null)
  const practiceWordsRef = useRef<string[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wordsContainerRef = useRef<HTMLDivElement>(null)
  const activeWordRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tabPressedRef = useRef(false)
  const isComposingRef = useRef(false)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const screenFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetAnimRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishTestRef = useRef<(() => void) | null>(null)
  const lastProgressUpdateRef = useRef(0)
  const lastProgressWordRef = useRef(-1)

  const mtCounts = useMemo(
    () =>
      countWpm({
        targetWords: words,
        wordInputs,
        typed,
        wordIndex,
        mode,
        final: finished,
      }),
    [words, wordInputs, typed, wordIndex, mode, finished]
  )
  const wpmNumerator = wpmNumeratorFromCounts(mtCounts)
  const accuracy = accuracyFromCounts(mtCounts)
  useEffect(() => {
    correctCharsRef.current = wpmNumerator
  }, [wpmNumerator])

  const wpm =
    started && !finished ? (wpmHistory[wpmHistory.length - 1]?.wpm ?? 0) : 0

  useEffect(() => {
    if (!onProgressUpdate || !started || finished) return
    const now = performance.now()
    const changedWord = wordIndex !== lastProgressWordRef.current
    // Non-word-change updates (WPM/accuracy ticks) at most every 250ms —
    // aligned with the server's PROGRESS_BROADCAST_MS so neither side waits
    // on the other.
    if (!changedWord && now - lastProgressUpdateRef.current < 250) return
    lastProgressUpdateRef.current = now
    lastProgressWordRef.current = wordIndex
    const elapsedSec = startTime ? (Date.now() - startTime) / 1000 : 0
    const elapsedMin = elapsedSec / 60 || 1 / 60
    const computedWpm = Math.round(correctCharsRef.current / 5 / elapsedMin)
    onProgressUpdate({
      wordIndex,
      totalWords: words.length,
      wpm: computedWpm,
      accuracy,
    })
  }, [
    typed,
    wordIndex,
    accuracy,
    words.length,
    started,
    finished,
    startTime,
    onProgressUpdate,
  ])

  const buildResultStats = useCallback(
    (
      snapshotWordInputs: string[] = wordInputs,
      snapshotTyped: string = typed,
      snapshotWordIndex: number = wordIndex
    ): ResultStats => {
      const elapsed = startTime
        ? (Date.now() - startTime) / 1000
        : elapsedSecondsRef.current
      const elapsedMin = elapsed / 60 || 1 / 60
      const counts = countWpm({
        targetWords: words,
        wordInputs: snapshotWordInputs,
        typed: snapshotTyped,
        wordIndex: snapshotWordIndex,
        mode,
        final: true,
      })
      const wpmValues = wpmHistory.map((s) => s.wpm).filter((v) => v > 0)
      let consistency = 100
      if (wpmValues.length > 1) {
        const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length
        const variance =
          wpmValues.reduce((a, b) => a + (b - mean) ** 2, 0) / wpmValues.length
        consistency = Math.max(
          0,
          Math.round(100 - (Math.sqrt(variance) / (mean || 1)) * 100)
        )
      }
      const computedWpm = Math.round(
        wpmNumeratorFromCounts(counts) / 5 / elapsedMin
      )
      const computedRaw = Math.max(
        Math.round(allTypedRef.current / 5 / elapsedMin),
        computedWpm
      )

      return {
        wpm: computedWpm,
        accuracy: accuracyFromCounts(counts),
        raw: computedRaw,
        correctChars: counts.correctWordChars,
        incorrectChars: counts.incorrectChars,
        extraChars: counts.extraChars,
        missedChars: counts.missedChars,
        consistency,
        elapsedSeconds: Math.round(elapsed),
        correctedErrors: correctedErrorsRef.current,
        mode,
        modeDetail: describeModeDetail(mode, {
          timeOption,
          wordOption,
          quoteLength,
        }),
        language,
        wpmHistory,
        wordInputs: snapshotWordInputs,
        targetWords: words,
        wordTimingsMs: wordTimingsMsRef.current.slice(),
      }
    },
    [
      wordInputs,
      typed,
      wordIndex,
      startTime,
      words,
      mode,
      timeOption,
      wordOption,
      quoteLength,
      language,
      wpmHistory,
    ]
  )

  const finishTest = useCallback(
    (finalStats?: ResultStats) => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (finalStats) {
        setFrozenStats(finalStats)
        onRaceFinish?.(finalStats)
        // Record structured-course lesson results for progression.
        const lessonRaw = sessionStorage.getItem("vk-lesson-active")
        if (lessonRaw) {
          try {
            const lesson = JSON.parse(lessonRaw) as {
              lessonId: string
            }
            recordLessonResult(lesson.lessonId, finalStats.accuracy)
          } catch {
            // malformed marker — ignore, progression is best-effort
          }
        }
      }
      setFinished(true)
      setShowControls(true)
      onFinished?.(true)
      onTypingActiveChange?.(false)
      setScreenFade(0)
      requestAnimationFrame(() => setScreenFade(1))
    },
    [onFinished, onTypingActiveChange, onRaceFinish]
  )

  useEffect(() => {
    finishTestRef.current = finishTest
  }, [finishTest])

  const buildWords = useCallback(
    async (
      lang: string,
      count: number,
      opts: {
        punctuation: boolean
        numbers: boolean
        difficulty: Difficulty | undefined
        showDiacritics?: boolean
      }
    ): Promise<string[]> => {
      const isHard = opts.difficulty === "hard"

      if (
        langPoolRef.current &&
        langPoolRef.current.code === lang &&
        langPoolRef.current.hard === isHard
      ) {
        const result = generateWordsFromPool(
          langPoolRef.current.words,
          count,
          opts
        )
        return opts.showDiacritics === false && isRTLLanguage(lang)
          ? result.map(stripArabicDiacritics)
          : result
      }
      const pool = await fetchLanguageWords(lang, isHard)
      if (pool.length > 0) {
        langPoolRef.current = { code: lang, hard: isHard, words: pool }
        const result = generateWordsFromPool(pool, count, opts)
        return opts.showDiacritics === false && isRTLLanguage(lang)
          ? result.map(stripArabicDiacritics)
          : result
      }

      return generateWords(count, opts)
    },
    []
  )

  const resetTestWith = useCallback(
    async (overrides: ResetOverrides = {}) => {
      const m = raceMode ?? overrides.mode ?? mode
      const ql = overrides.quoteLength ?? quoteLength
      const wo = raceWordOption ?? overrides.wordOption ?? wordOption
      const to = raceTimeOption ?? overrides.timeOption ?? timeOption
      const p = overrides.punctuation ?? punctuation
      const n = overrides.numbers ?? numbers
      const d = "difficulty" in overrides ? overrides.difficulty : difficulty
      const lang = overrides.language ?? language
      const sd =
        "showDiacritics" in overrides
          ? overrides.showDiacritics
          : showDiacritics
      const ct = overrides.customText ?? customText
      const ccl =
        "customCodeLanguage" in overrides
          ? (overrides.customCodeLanguage ?? "")
          : customCodeLanguage
      const cl = overrides.codeLanguage ?? codeLanguage
      const cc = overrides.codeChapter ?? codeChapter
      const wc = wordCountForMode(m, wo)

      setQuoteAuthor(null)
      if (raceWords && raceWords.length > 0) {
        setWords(raceWords)
        setCodeLines([])
        setCodeIndents([])
      } else if (practiceWordsRef.current) {
        // Practice mode overrides normal word generation.
        setWords(practiceWordsRef.current)
        setCodeLines([])
        setCodeIndents([])
      } else {
        const loaded = await loadTestWords({
          m,
          ql,
          ct,
          ccl,
          cl,
          cc,
          wc,
          buildWords,
          lang,
          p,
          n,
          d,
          sd,
        })
        setWords(loaded.words)
        setCodeLines(loaded.codeLines)
        setCodeIndents(loaded.codeIndents)
        if (loaded.author) setQuoteAuthor(loaded.author)
      }
      setTyped("")
      setWordIndex(0)
      setStarted(false)
      setFinished(false)
      setStartTime(null)
      setWordInputs([])
      setWpmHistory([])
      correctCharsRef.current = 0
      allTypedRef.current = 0
      errorsThisSecondRef.current = 0
      elapsedSecondsRef.current = 0
      correctedErrorsRef.current = 0
      wordTimingsMsRef.current = []
      wordStartTimeRef.current = null
      if (m === "time") setTimeLeft(to)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setRowOffset(0)
      setShowControls(true)
      setIsActivelyTyping(false)
      onFinished?.(false)
      onTypingActiveChange?.(false)
      inputRef.current?.focus()
    },
    [
      mode,
      quoteLength,
      wordOption,
      timeOption,
      punctuation,
      numbers,
      difficulty,
      language,
      showDiacritics,
      customText,
      customCodeLanguage,
      codeLanguage,
      codeChapter,
      buildWords,
      onFinished,
      onTypingActiveChange,
      raceWords,
      raceMode,
      raceTimeOption,
      raceWordOption,
    ]
  )

  const resetTestImmediate = useCallback(() => resetTestWith(), [resetTestWith])

  const resetTest = useCallback(
    (overrides: ResetOverrides = {}) => {
      if (resetAnimRef.current) clearTimeout(resetAnimRef.current)
      setResetting(true)
      resetAnimRef.current = setTimeout(() => {
        void resetTestWith(overrides).then(() => {
          setResetting(false)
          resetAnimRef.current = null
        })
      }, 150)
    },
    [resetTestWith]
  )

  useMountEffect(() => {
    // Multiplayer: the server delivers the authoritative words + mode before
    // the countdown ends. Skip every localStorage-driven default so the race
    // props are the single source of truth on this mount.
    if (raceWords && raceWords.length > 0) {
      const raceM = raceMode ?? "words"
      setMode(raceM)
      if (raceM === "time" && raceTimeOption) {
        setTimeOption(raceTimeOption)
        setTimeLeft(raceTimeOption)
      }
      if (raceM === "words" && raceWordOption) setWordOption(raceWordOption)
      setWords(raceWords)
      setTyped("")
      setWordIndex(0)
      setStarted(false)
      setFinished(false)
      setStartTime(null)
      setWordInputs([])
      setWpmHistory([])
      inputRef.current?.focus()
      return
    }

    const stored = readStoredTestOptions()

    const m = stored.mode ?? mode
    const to = stored.timeOption ?? timeOption
    const wo = stored.wordOption ?? wordOption
    const ql = stored.quoteLength ?? quoteLength
    const p = stored.punctuation ?? punctuation
    const n = stored.numbers ?? numbers
    const d = stored.difficulty !== undefined ? stored.difficulty : difficulty
    const lang = language

    /** Restore persisted selections into state, resolving code-mode defaults. */
    const applyStoredSelections = () => {
      // Code mode: fall back to stored selections, or defaults when the
      // stored mode is "code" but nothing was saved yet.
      let activeCodeLang = codeLanguage
      let activeCodeChap = codeChapter
      if (stored.codeLanguage) {
        activeCodeLang = stored.codeLanguage
        setCodeLanguage(stored.codeLanguage)
      } else if (m === "code") {
        activeCodeLang = "javascript"
        setCodeLanguage("javascript")
      }
      if (stored.codeChapter) {
        activeCodeChap = stored.codeChapter
        setCodeChapter(stored.codeChapter)
      } else if (m === "code") {
        activeCodeChap =
          CODE_MANIFEST["javascript"]?.chapters[0] ?? "00_variables"
        setCodeChapter(activeCodeChap)
      }

      if (stored.mode !== undefined) setMode(stored.mode)
      if (stored.timeOption !== undefined) setTimeOption(stored.timeOption)
      if (stored.wordOption !== undefined) setWordOption(stored.wordOption)
      if (stored.quoteLength !== undefined) setQuoteLength(stored.quoteLength)
      if (stored.punctuation !== undefined) setPunctuation(stored.punctuation)
      if (stored.numbers !== undefined) setNumbers(stored.numbers)
      if (stored.difficulty !== undefined) setDifficulty(stored.difficulty)
      if (stored.customText !== undefined) setCustomText(stored.customText)
      if (stored.customCodeLanguage)
        setCustomCodeLanguage(stored.customCodeLanguage)
      return { activeCodeLang, activeCodeChap }
    }

    const { activeCodeLang, activeCodeChap } = applyStoredSelections()

    const ct = stored.customText ?? customText
    const activeCCL = stored.customCodeLanguage ?? customCodeLanguage
    const wc = wordCountForMode(m, wo)
    const loaded = loadTestWords({
      m,
      ql,
      ct,
      ccl: activeCCL,
      cl: activeCodeLang,
      cc: activeCodeChap,
      wc,
      buildWords,
      lang,
      p,
      n,
      d,
      sd: showDiacritics,
    }).then((result) => {
      setWords(result.words)
      setCodeLines(result.codeLines)
      setCodeIndents(result.codeIndents)
      if (result.author) setQuoteAuthor(result.author)
    })
    loaded.catch(() => {
      // Word loading is best-effort on mount; keep defaults on failure.
    })
    if (m === "time") setTimeLeft(to)
    inputRef.current?.focus()
  })

  const prevLangRef = useRef(language)
  useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language
      langPoolRef.current = null // invalidate cache
      queueMicrotask(() => {
        void resetTestWith({ language })
      })
    }
  }, [language, resetTestWith])

  // ── Multiplayer: react whenever the server delivers race words/config ──────
  // The server sends `words` before the countdown ends; every reset below
  // re-arms the local test so all racers type the identical text and the
  // correct mode (time vs words) drives the local timer/totals.
  useEffect(() => {
    if (!raceWords || raceWords.length === 0) return
    queueMicrotask(() => {
      if (raceMode) setMode(raceMode)
      if (raceMode === "time" && raceTimeOption) {
        setTimeOption(raceTimeOption)
        setTimeLeft(raceTimeOption)
      }
      if (raceMode === "words" && raceWordOption) setWordOption(raceWordOption)
      void resetTestWith({
        mode: raceMode ?? "words",
        timeOption: raceTimeOption,
        wordOption: raceWordOption,
      })
    })
    // resetTestWith reads raceWords/raceMode directly, so they are not deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceWords, raceMode, raceTimeOption, raceWordOption])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      setCapsLock(e.getModifierState("CapsLock"))
    window.addEventListener("keydown", onKey)
    window.addEventListener("keyup", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("keyup", onKey)
    }
  }, [])

  const prevShowDiacriticsRef = useRef(showDiacritics)
  useEffect(() => {
    if (prevShowDiacriticsRef.current !== showDiacritics) {
      prevShowDiacriticsRef.current = showDiacritics
      queueMicrotask(() => {
        void resetTestWith({ showDiacritics })
      })
    }
  }, [showDiacritics, resetTestWith])

  const markTypingActive = useCallback(() => {
    setIsActivelyTyping(true)
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current)
    typingIdleRef.current = setTimeout(() => setIsActivelyTyping(false), 1000)
  }, [])

  const handleMouseMove = useCallback(() => {
    if (!started || finished) return
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 2500)
  }, [started, finished])

  const recordWordSnapshot = useCallback(
    (
      snapshotWordInputs: string[],
      snapshotTyped: string,
      snapshotWordIndex: number
    ) => {
      if (!startTime || mode === "time") return
      const snapCounts = countWpm({
        targetWords: words,
        wordInputs: snapshotWordInputs,
        typed: snapshotTyped,
        wordIndex: snapshotWordIndex,
        mode,
        final: false,
      })
      const snapNum = wpmNumeratorFromCounts(snapCounts)
      const elapsedSec = (Date.now() - startTime) / 1000
      elapsedSecondsRef.current = elapsedSec
      const elapsedMin = elapsedSec / 60 || 1 / 60
      const snapWpm = Math.round(snapNum / 5 / elapsedMin)
      const snapRaw = Math.max(
        Math.round(allTypedRef.current / 5 / elapsedMin),
        snapWpm
      )
      setWpmHistory((prev) => [
        ...prev,
        {
          second: Math.round(elapsedSec),
          wpm: snapWpm,
          raw: snapRaw,
          errors: errorsThisSecondRef.current,
        },
      ])
      errorsThisSecondRef.current = 0
    },
    [startTime, mode, words]
  )

  const clearWordOrNavigateBack = useCallback(() => {
    if (typed.length > 0) {
      setTyped("")
      const cw = words[wordIndex]
      onKeyHighlight?.(cw && cw.length > 0 ? cw[0] : null)
      return
    }
    if (wordIndex <= 0) return
    const prevInput = wordInputs[wordIndex - 1]
    const prevWord = words[wordIndex - 1]
    setWordIndex((prev) => prev - 1)
    setTyped(prevInput)
    setWordInputs((prev) => prev.slice(0, -1))
    if (prevInput.length < prevWord.length)
      onKeyHighlight?.(prevWord[prevInput.length])
    else onKeyHighlight?.(" ")
    requestAnimationFrame(() => {
      if (!activeWordRef.current) return
      const word = activeWordRef.current
      const lineH = word.offsetHeight + 4
      const row = Math.round(word.offsetTop / lineH)
      setRowOffset(Math.max(0, row - 1) * lineH)
    })
  }, [typed, wordIndex, wordInputs, words, onKeyHighlight, activeWordRef])

  /** Code-like modes treat Enter as a line commit instead of a word end. */
  const isCodeLikeMode =
    mode === "code" || (mode === "custom" && customCodeLanguage !== "")

  /** Shared rAF: keep the active word row vertically centered. */
  const scrollToActiveWord = useCallback(() => {
    requestAnimationFrame(() => {
      if (!activeWordRef.current) return
      const word = activeWordRef.current
      const lineH = word.offsetHeight + 4
      const row = Math.round(word.offsetTop / lineH)
      setRowOffset(Math.max(0, row - 1) * lineH)
    })
  }, [])

  /** Start the test clock on the first keystroke of a session. */
  const startTypingIfNeeded = useCallback(() => {
    if (started) return
    setStarted(true)
    setStartTime(Date.now())
    setShowControls(false)
    onTypingActiveChange?.(true)
  }, [started, onTypingActiveChange])

  /** Per-second timer for timed tests; fires once per session. */
  const startTimeModeTimer = useCallback(() => {
    if (mode !== "time") return
    let elapsedTicks = 0
    timerRef.current = setInterval(() => {
      elapsedTicks += 1
      elapsedSecondsRef.current = elapsedTicks
      const elapsedMin = elapsedTicks / 60
      const snapWpm =
        elapsedMin > 0
          ? Math.round(correctCharsRef.current / 5 / elapsedMin)
          : 0
      const snapRaw =
        elapsedMin > 0
          ? Math.max(Math.round(allTypedRef.current / 5 / elapsedMin), snapWpm)
          : 0
      setWpmHistory((prev) => [
        ...prev,
        {
          second: elapsedTicks,
          wpm: snapWpm,
          raw: snapRaw,
          errors: errorsThisSecondRef.current,
        },
      ])
      errorsThisSecondRef.current = 0
      if (elapsedTicks >= timeOption) {
        clearInterval(timerRef.current!)
        timerRef.current = null
        finishTestRef.current?.()
      } else {
        setTimeLeft(timeOption - elapsedTicks)
      }
    }, 1000)
  }, [mode, timeOption])

  /** Count mistyped characters (and the trailing overflow char) this second. */
  const noteTypedErrors = useCallback(
    (typedWord: string, targetWord: string) => {
      for (let i = 0; i < Math.min(typedWord.length, targetWord.length); i++) {
        if (typedWord[i] !== targetWord[i]) errorsThisSecondRef.current++
      }
      if (typedWord.length > targetWord.length) errorsThisSecondRef.current++
    },
    []
  )

  /** Advance to the next word after a committed input. */
  const advanceToWord = useCallback(
    (nextInputs: string[], nextIndex: number) => {
      setWordInputs(nextInputs)
      setWordIndex(nextIndex)
      setTyped("")
      onKeyHighlight?.(null)
      scrollToActiveWord()
    },
    [onKeyHighlight, scrollToActiveWord]
  )

  /** Commit the current line and jump past it (code-like modes). */
  const handleEnterInCodeMode = useCallback(() => {
    let lineStart = 0
    for (const lineLen of codeLines) {
      const lineEnd = lineStart + lineLen - 1
      if (wordIndex < lineStart || wordIndex > lineEnd) {
        lineStart += lineLen
        continue
      }
      const nextInputs = [...wordInputs]
      for (let i = wordIndex; i <= lineEnd; i++) {
        nextInputs[i] = i === wordIndex ? typed : ""
      }
      const nextIndex = lineEnd + 1
      if (nextIndex >= words.length) {
        setWordInputs(nextInputs)
        finishTest(buildResultStats(nextInputs, "", nextIndex))
        return
      }
      advanceToWord(nextInputs, nextIndex)
      return
    }
  }, [
    codeLines,
    wordIndex,
    wordInputs,
    typed,
    words.length,
    finishTest,
    buildResultStats,
    advanceToWord,
  ])

  /** Commit the current word and move on (space key). */
  const handleSpaceKey = useCallback(() => {
    if (typed.length === 0) return
    const currentWord = words[wordIndex]

    allTypedRef.current += 1 // count the space keystroke so raw >= wpm
    noteTypedErrors(typed, currentWord)

    const nextInputs = [...wordInputs, typed]
    const nextIndex = wordIndex + 1
    recordWordSnapshot(nextInputs, "", nextIndex)

    // record per-word timing
    const now = Date.now()
    if (wordStartTimeRef.current !== null) {
      wordTimingsMsRef.current.push(now - wordStartTimeRef.current)
    }
    wordStartTimeRef.current = now

    if (nextIndex >= words.length) {
      setWordInputs(nextInputs)
      finishTest(buildResultStats(nextInputs, "", nextIndex))
      return
    }
    advanceToWord(nextInputs, nextIndex)
  }, [
    typed,
    words,
    wordIndex,
    wordInputs,
    allTypedRef,
    noteTypedErrors,
    recordWordSnapshot,
    buildResultStats,
    finishTest,
    advanceToWord,
  ])

  /** Delete a character, or step back into the previous word. */
  const handleBackspaceKey = useCallback(() => {
    const currentWord = words[wordIndex]

    if (typed.length === 0 && wordIndex > 0) {
      const prevInput = wordInputs[wordIndex - 1]
      setWordIndex((prev) => prev - 1)
      setTyped(prevInput)
      setWordInputs((prev) => prev.slice(0, -1))
      scrollToActiveWord()
      return
    }
    if (typed.length > 0) {
      const lastIdx = typed.length - 1
      const isWrong =
        lastIdx >= currentWord.length || typed[lastIdx] !== currentWord[lastIdx]
      if (isWrong) correctedErrorsRef.current += 1
      setTyped((prev) => prev.slice(0, -1))
    }
  }, [words, wordIndex, typed, wordInputs, scrollToActiveWord])

  /** Insert an auto-pair (e.g. "(") when the target word expects both halves. */
  const tryAutoPair = useCallback(
    (key: string, currentWord: string): boolean => {
      const PAIR_MAP: Record<string, string> = {
        "(": ")",
        "{": "}",
        "[": "]",
        '"': '"',
        "'": "'",
        "`": "`",
      }
      if (!autoPair || !isCodeLikeMode || !PAIR_MAP[key]) return false

      const closer = PAIR_MAP[key]
      const charIndex = typed.length
      if (
        charIndex >= currentWord.length ||
        currentWord[charIndex] !== key ||
        currentWord[charIndex + 1] !== closer
      )
        return false

      allTypedRef.current += 1
      const nextTyped = typed + key + closer
      setTyped(nextTyped)
      if (key !== currentWord[charIndex]) onWrongKey?.()
      const nextCharIndex = nextTyped.length
      onKeyHighlight?.(
        nextCharIndex < currentWord.length ? currentWord[nextCharIndex] : " "
      )
      return true
    },
    [autoPair, isCodeLikeMode, typed, onWrongKey, onKeyHighlight]
  )

  /** Insert a character, handling auto-pairs and the final-word finish. */
  const handleCharacterKey = useCallback(
    (key: string) => {
      const currentWord = words[wordIndex]

      if (tryAutoPair(key, currentWord)) return

      allTypedRef.current += 1
      const nextTyped = typed + key
      setTyped(nextTyped)

      const charIndex = typed.length
      const isWrong =
        charIndex >= currentWord.length || key !== currentWord[charIndex]
      if (isWrong) onWrongKey?.()

      const isLastWord = wordIndex + 1 >= words.length
      if (
        isLastWord &&
        nextTyped.length >= currentWord.length &&
        mode !== "time" &&
        mode !== "zen"
      ) {
        noteTypedErrors(nextTyped, currentWord)
        const nextInputs = [...wordInputs, nextTyped]
        // record timing for last word
        if (wordStartTimeRef.current !== null) {
          wordTimingsMsRef.current.push(Date.now() - wordStartTimeRef.current)
          wordStartTimeRef.current = null
        }
        setWordInputs(nextInputs)
        recordWordSnapshot(nextInputs, "", wordIndex + 1)
        finishTest(buildResultStats(nextInputs, "", wordIndex + 1))
        return
      }

      const nextCharIndex = nextTyped.length
      onKeyHighlight?.(
        nextCharIndex < currentWord.length ? currentWord[nextCharIndex] : " "
      )
    },
    [
      words,
      wordIndex,
      typed,
      wordInputs,
      tryAutoPair,
      mode,
      onWrongKey,
      onKeyHighlight,
      noteTypedErrors,
      recordWordSnapshot,
      buildResultStats,
      finishTest,
    ]
  )

  /**
   * Tab (restart chord), Enter shortcuts, and code-mode line commits.
   * Returns true when the key was consumed.
   */
  const handleSpecialKeys = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): boolean => {
      if (e.key === "Tab") {
        e.preventDefault()
        tabPressedRef.current = true
        setTimeout(() => {
          tabPressedRef.current = false
        }, 1000)
        return true
      }
      if (e.key === "Enter" && tabPressedRef.current) {
        e.preventDefault()
        tabPressedRef.current = false
        resetTest()
        return true
      }
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault()
        if (mode === "zen" && started && !finished) {
          finishTest()
        }
        return true
      }
      if (e.key === "Enter" && isCodeLikeMode && !tabPressedRef.current) {
        e.preventDefault()
        if (finished) return true
        startTypingIfNeeded()
        markTypingActive()
        handleEnterInCodeMode()
        return true
      }
      return false
    },
    [
      resetTest,
      mode,
      started,
      finished,
      finishTest,
      isCodeLikeMode,
      startTypingIfNeeded,
      markTypingActive,
      handleEnterInCodeMode,
    ]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        disabled ||
        isComposingRef.current ||
        e.nativeEvent.isComposing ||
        e.key === "Dead" ||
        e.key === "Process"
      ) {
        return
      }

      if (isWordDeleteCombo(e)) {
        e.preventDefault()
        if (finished) return
        startTypingIfNeeded()
        markTypingActive()
        clearWordOrNavigateBack()
        return
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (handleSpecialKeys(e)) return

      if (finished) return

      if (e.key.length > 1 && e.key !== "Backspace") return

      markPerformance("typing-keydown")
      requestAnimationFrame(() =>
        measurePerformance("typing-keydown-to-frame", "typing-keydown")
      )

      if (e.key === "Backspace" && !started && typed.length === 0) return

      if (!started) {
        wordStartTimeRef.current = Date.now()
        startTypingIfNeeded()
        startTimeModeTimer()
      }

      markTypingActive()

      if (e.key === " ") {
        e.preventDefault()
        handleSpaceKey()
        return
      }

      if (e.key === "Backspace") {
        handleBackspaceKey()
        return
      }

      if (e.key.length === 1) {
        handleCharacterKey(e.key)
      }
    },
    [
      finished,
      started,
      typed,
      disabled,
      markTypingActive,
      startTypingIfNeeded,
      startTimeModeTimer,
      handleSpecialKeys,
      handleSpaceKey,
      handleBackspaceKey,
      handleCharacterKey,
      clearWordOrNavigateBack,
    ]
  )

  const handleFocus = () => {
    if (pauseRefocusRef.current) return

    const active = document.activeElement
    if (
      active &&
      active.closest('[role="dialog"], [data-radix-dialog-content]')
    )
      return
    inputRef.current?.focus()
  }

  const handleInputBlur = useCallback(() => {
    if (pauseRefocusRef.current) return
    setIsFocused(false)
    onFocusChange?.(false)
  }, [onFocusChange])

  const handleInputFocus = useCallback(() => {
    setIsFocused(true)
    onFocusChange?.(true)
  }, [onFocusChange])

  useEffect(() => {
    if (isFocused) return

    const handleEnterToFocus = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || pauseRefocusRef.current) return

      const target = event.target as HTMLElement | null
      if (
        target?.closest(
          'input, textarea, select, button, [contenteditable="true"], [role="dialog"], [data-radix-dialog-content]'
        )
      ) {
        return
      }

      event.preventDefault()
      inputRef.current?.focus()
    }

    window.addEventListener("keydown", handleEnterToFocus)
    return () => window.removeEventListener("keydown", handleEnterToFocus)
  }, [isFocused])

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true
  }, [])

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false
      const data = e.data

      if (inputRef.current && inputRef.current.value !== typed) {
        inputRef.current.value = typed
      }
      if (!data) return

      for (const ch of data) {
        handleKeyDown({
          key: ch,
          altKey: false,
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          preventDefault: () => {},
          nativeEvent: { isComposing: false } as unknown as KeyboardEvent,
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      }
    },
    [handleKeyDown, typed]
  )

  useEffect(() => {
    if (finished) {
      queueMicrotask(() => setFrozenStats((prev) => prev ?? buildResultStats()))
    } else {
      queueMicrotask(() => setFrozenStats(null))
    }
  }, [finished, buildResultStats])

  const resetSameWords = useCallback(() => {
    setTyped("")
    setWordIndex(0)
    setStarted(false)
    setFinished(false)
    setStartTime(null)
    setWordInputs([])
    setWpmHistory([])
    correctCharsRef.current = 0
    allTypedRef.current = 0
    errorsThisSecondRef.current = 0
    elapsedSecondsRef.current = 0
    correctedErrorsRef.current = 0
    wordTimingsMsRef.current = []
    wordStartTimeRef.current = null
    if (mode === "time") setTimeLeft(timeOption)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRowOffset(0)
    setShowControls(true)
    setIsActivelyTyping(false)
    onFinished?.(false)
    onTypingActiveChange?.(false)
    inputRef.current?.focus()
  }, [mode, timeOption, onFinished, onTypingActiveChange])

  const handleResultsRestart = useCallback(() => {
    setScreenFade(0)
    if (screenFadeRef.current) clearTimeout(screenFadeRef.current)
    screenFadeRef.current = setTimeout(() => {
      setResetting(true)
      resetSameWords()
      setTimeout(() => setResetting(false), 150)
      requestAnimationFrame(() => setScreenFade(1))
      screenFadeRef.current = null
    }, 150)
  }, [resetSameWords])

  const handleResultsNext = useCallback(() => {
    setScreenFade(0)
    if (screenFadeRef.current) clearTimeout(screenFadeRef.current)
    screenFadeRef.current = setTimeout(() => {
      if (mode === "code") {
        const chapters = CODE_MANIFEST[codeLanguage]?.chapters ?? []
        const currentIndex = chapters.indexOf(codeChapter)
        if (currentIndex !== -1 && currentIndex < chapters.length - 1) {
          const nextChapter = chapters[currentIndex + 1]
          setCodeChapter(nextChapter)
          localStorage.setItem(CODE_CHAPTER_STORAGE_KEY, nextChapter)
          void resetTestWith({ codeChapter: nextChapter }).then(() => {
            requestAnimationFrame(() => setScreenFade(1))
            screenFadeRef.current = null
          })
          return
        }
      }
      void resetTestImmediate().then(() => {
        requestAnimationFrame(() => setScreenFade(1))
        screenFadeRef.current = null
      })
    }, 150)
  }, [resetTestImmediate, resetTestWith, mode, codeLanguage, codeChapter])

  const handleResultsPractice = useCallback(
    (words: string[]) => {
      setScreenFade(0)
      if (screenFadeRef.current) clearTimeout(screenFadeRef.current)
      screenFadeRef.current = setTimeout(() => {
        // Store practice set — restarts will re-use this instead of generating new words
        practiceWordsRef.current = words
        // Use words mode (doesn't touch custom text at all)
        setMode("words")
        localStorage.setItem(TEST_MODE_STORAGE_KEY, "words")
        void resetTestWith({ mode: "words" }).then(() => {
          requestAnimationFrame(() => setScreenFade(1))
          screenFadeRef.current = null
        })
      }, 150)
    },
    [resetTestWith]
  )

  const onModeChange = useCallback(
    (next: TestMode) => {
      practiceWordsRef.current = null // exit practice mode when user picks a mode manually
      setMode(next)
      localStorage.setItem(TEST_MODE_STORAGE_KEY, next)
      if (next === "code" && !codeLanguage) {
        setCodeLanguage("javascript")
        localStorage.setItem(CODE_LANGUAGE_STORAGE_KEY, "javascript")
        setCodeChapter("00_variables")
        localStorage.setItem(CODE_CHAPTER_STORAGE_KEY, "00_variables")
        resetTest({
          mode: next,
          codeLanguage: "javascript",
          codeChapter: "00_variables",
        })
      } else {
        resetTest({ mode: next })
      }
    },
    [resetTest, codeLanguage]
  )

  const onTimeOptionChange = useCallback(
    (next: number) => {
      setTimeOption(next)
      localStorage.setItem(TIME_OPTION_STORAGE_KEY, String(next))
      resetTest({ timeOption: next })
    },
    [resetTest]
  )

  const onWordOptionChange = useCallback(
    (next: number) => {
      practiceWordsRef.current = null // changing word count exits practice mode
      setWordOption(next)
      localStorage.setItem(WORD_OPTION_STORAGE_KEY, String(next))
      resetTest({ wordOption: next })
    },
    [resetTest]
  )

  const onQuoteLengthChange = useCallback(
    (next: QuoteLength) => {
      setQuoteLength(next)
      localStorage.setItem(QUOTE_LENGTH_STORAGE_KEY, next)
      resetTest({ quoteLength: next })
    },
    [resetTest]
  )

  const onPunctuationToggle = useCallback(() => {
    const next = !punctuation
    setPunctuation(next)
    localStorage.setItem(PUNCTUATION_STORAGE_KEY, String(next))
    resetTest({ punctuation: next })
  }, [punctuation, resetTest])

  const onNumbersToggle = useCallback(() => {
    const next = !numbers
    setNumbers(next)
    localStorage.setItem(NUMBERS_STORAGE_KEY, String(next))
    resetTest({ numbers: next })
  }, [numbers, resetTest])

  const onCustomTextChange = useCallback(
    (next: string, codeLang?: string) => {
      setCustomText(next)
      localStorage.setItem(CUSTOM_TEXT_STORAGE_KEY, next)
      setCustomCodeLanguage(codeLang ?? "")
      if (codeLang)
        localStorage.setItem(CUSTOM_CODE_LANGUAGE_STORAGE_KEY, codeLang)
      else localStorage.removeItem(CUSTOM_CODE_LANGUAGE_STORAGE_KEY)
      resetTest({
        customText: next,
        mode: "custom",
        customCodeLanguage: codeLang ?? "",
      })
    },
    [resetTest]
  )

  const onDifficultyToggle = useCallback(
    (d: Difficulty) => {
      const next = difficulty === d ? undefined : d
      setDifficulty(next)
      if (next) localStorage.setItem(DIFFICULTY_STORAGE_KEY, next)
      else localStorage.removeItem(DIFFICULTY_STORAGE_KEY)
      resetTest({ difficulty: next })
    },
    [difficulty, resetTest]
  )

  const onCodeLanguageChange = useCallback(
    (next: string) => {
      setCodeLanguage(next)
      const firstChap = CODE_MANIFEST[next]?.chapters[0] ?? ""
      setCodeChapter(firstChap)
      localStorage.setItem(CODE_LANGUAGE_STORAGE_KEY, next)
      if (firstChap) {
        localStorage.setItem(CODE_CHAPTER_STORAGE_KEY, firstChap)
        resetTest({ codeLanguage: next, codeChapter: firstChap })
      } else {
        localStorage.removeItem(CODE_CHAPTER_STORAGE_KEY)
        resetTest({ codeLanguage: next, codeChapter: "" })
      }
    },
    [resetTest]
  )

  const onCodeChapterChange = useCallback(
    (next: string) => {
      setCodeChapter(next)
      localStorage.setItem(CODE_CHAPTER_STORAGE_KEY, next)
      resetTest({ codeChapter: next })
    },
    [resetTest]
  )

  const controlsVisible = !started || showControls
  const showResults = Boolean(finished && frozenStats)

  return {
    mode,
    timeOption,
    wordOption,
    quoteLength,
    quoteAuthor,
    punctuation,
    numbers,
    difficulty,
    customText,
    customCodeLanguage,
    codeLanguage,
    codeChapter,
    words,
    codeLines,
    codeIndents,
    typed,
    wordIndex,
    started,
    rowOffset,
    finished,
    timeLeft,
    wordInputs,
    showControls,
    isFocused,
    resetting,
    isActivelyTyping,
    screenFade,
    wpm,
    accuracy,
    capsLock,

    isRTL,
    controlsVisible,
    showResults,
    frozenStats,

    inputRef,
    wordsContainerRef,
    activeWordRef,

    handleKeyDown,
    handleFocus,
    handleInputBlur,
    handleInputFocus,
    handleCompositionStart,
    handleCompositionEnd,
    handleMouseMove,
    handleResultsRestart,
    handleResultsNext,
    handleResultsPractice,
    onModeChange,
    onTimeOptionChange,
    onWordOptionChange,
    onQuoteLengthChange,
    onPunctuationToggle,
    onNumbersToggle,
    onDifficultyToggle,
    onCustomTextChange,
    onCodeLanguageChange,
    onCodeChapterChange,
    onRestart: () => {
      if (mode !== "code") return resetTest()
      const others = (CODE_MANIFEST[codeLanguage]?.chapters ?? []).filter(
        (c) => c !== codeChapter
      )
      const pick = randomPick(others)
      if (pick) {
        setCodeChapter(pick)
        localStorage.setItem(CODE_CHAPTER_STORAGE_KEY, pick)
      }
      resetTest(pick ? { codeChapter: pick } : {})
    },
  }
}
