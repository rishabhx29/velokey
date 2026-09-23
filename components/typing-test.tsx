"use client"

import { AnimatePresence, motion, LayoutGroup } from "motion/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { IconLock, IconPointer, IconRefresh } from "@tabler/icons-react"
import { ResultsScreen, type ResultStats } from "@/components/results-screen"
import { TestControls, type CodeManifest } from "@/components/test-controls"
import { WordItem, type OpponentCaret } from "@/components/word-item"
import { useTypingTest } from "@/hooks/use-typing-test"
import { useSettings } from "@/components/settings-context"
import { useAppChrome } from "@/components/app-chrome"
import { cn } from "@/lib/utils"
import { useShikiTokens } from "@/hooks/use-shiki"
import { CODE_MANIFEST, getCodeContent } from "@/lib/code"
import { useTheme } from "next-themes"

function getHintOpacity(
  mode: string,
  started: boolean,
  controlsVisible: boolean
): number {
  if ((mode === "zen" && started) || controlsVisible) return 1
  return 0
}

function getWordsOpacity(resetting: boolean, isFocused: boolean): number {
  if (resetting) return 0
  if (isFocused) return 1
  return 0.15
}

const FONT_SIZE_REM: Record<string, string> = {
  xs: "1rem",
  sm: "1.25rem",
  md: "1.5rem",
  lg: "1.875rem",
  xl: "2.25rem",
}

/**
 * One word in the plain (non-code) typing flow. Derives its own display state
 * from the active word's live text and the stored input of past words.
 */
function WordTile({
  word,
  isActive,
  isPast,
  typed,
  storedInput,
  currentWordLength,
  isNextWord,
  ghostMode,
  isFocused,
  isRTL,
  elemRef,
  tokenColors,
  opponentCarets,
}: {
  word: string
  isActive: boolean
  isPast: boolean
  typed: string
  storedInput: string | undefined
  currentWordLength: number
  isNextWord: boolean
  ghostMode: boolean
  isFocused: boolean
  isRTL: boolean
  elemRef: React.RefObject<HTMLDivElement | null> | undefined
  tokenColors: (string | undefined)[] | undefined
  opponentCarets?: OpponentCaret[]
}) {
  const isFuture = !isActive && !isPast
  const displayInput = isActive ? typed : (isPast && (storedInput ?? "")) || ""
  const hasError = isPast && storedInput !== word
  const currentWordDone = typed.length >= currentWordLength
  const dimmed =
    ghostMode && isFocused && isFuture && !(currentWordDone && isNextWord)

  return (
    <WordItem
      word={word}
      displayInput={displayInput}
      isActive={isActive}
      isPast={isPast}
      hasError={hasError}
      elemRef={elemRef}
      dimmed={dimmed}
      isRTL={isRTL}
      tokenColors={tokenColors}
      opponentCarets={opponentCarets}
    />
  )
}

/** A single word inside code-mode rendering, deriving state from its index. */
function CodeWordTile({
  word,
  wordIndex: wIdx,
  options,
}: {
  word: string
  wordIndex: number
  options: CodeLineRenderOptions
}) {
  const {
    words,
    wordInputs,
    typed,
    wordIndex,
    activeWordRef,
    ghostMode,
    isFocused,
    isRTL,
    syntaxHighlighting,
    shikiColors,
  } = options
  const isActive = wIdx === wordIndex
  const isPast = wIdx < wordIndex
  const displayInput = isActive
    ? typed
    : (isPast && (wordInputs[wIdx] ?? "")) || ""
  const currentWordDone = typed.length >= (words[wordIndex]?.length ?? 0)
  const dimmed =
    ghostMode &&
    isFocused &&
    !isActive &&
    !isPast &&
    !(currentWordDone && wIdx === wordIndex + 1)

  return (
    <WordItem
      key={`${word}-${wIdx}`}
      word={word}
      displayInput={displayInput}
      isActive={isActive}
      isPast={isPast}
      hasError={isPast && wordInputs[wIdx] !== word}
      elemRef={isActive ? activeWordRef : undefined}
      dimmed={dimmed}
      isRTL={isRTL}
      tokenColors={syntaxHighlighting ? shikiColors[wIdx] : undefined}
    />
  )
}

/** One rendered source-code line: optional line number plus indented words. */
function CodeLine({
  lineIdx,
  isActiveLine,
  indent,
  showLineNumbers,
  children,
}: {
  lineIdx: number
  isActiveLine: boolean
  indent: number
  showLineNumbers: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-row items-baseline gap-x-4">
      {showLineNumbers && (
        <span
          className={cn(
            "w-8 shrink-0 text-right font-mono text-[0.7em] tabular-nums transition-colors duration-100 select-none",
            isActiveLine ? "text-primary" : "text-muted-foreground/30"
          )}
        >
          {lineIdx + 1}
        </span>
      )}
      <div
        className="flex flex-row gap-x-2.5"
        style={{ paddingLeft: indent > 0 ? `${indent * 2}ch` : undefined }}
      >
        {children}
      </div>
    </div>
  )
}

interface CodeLineRenderOptions {
  codeLines: number[]
  codeIndents: number[]
  words: string[]
  wordInputs: string[]
  typed: string
  wordIndex: number
  activeWordRef: React.RefObject<HTMLDivElement | null>
  ghostMode: boolean
  isFocused: boolean
  isRTL: boolean
  syntaxHighlighting: boolean
  showLineNumbers: boolean
  shikiColors: (string | undefined)[][]
}

/** Index of the code line containing the word at `wordIndex`. */
function findActiveLine(codeLines: number[], wordIndex: number): number {
  let wCount = 0
  for (let li = 0; li < codeLines.length; li++) {
    wCount += codeLines[li]!
    if (wordIndex < wCount) return li
  }
  return Math.max(codeLines.length - 1, 0)
}

/** Render words grouped by their source-code lines (code / custom-with-lines mode). */
function renderCodeLines(options: CodeLineRenderOptions): React.ReactNode[] {
  const { codeLines, codeIndents, words, wordIndex } = options

  const activeLine = findActiveLine(codeLines, wordIndex)

  const lineElements: React.ReactNode[] = []
  let wIdx = 0
  for (let lineIdx = 0; lineIdx < codeLines.length; lineIdx++) {
    const lineWordCount = codeLines[lineIdx]!
    if (lineWordCount === 0) {
      continue
    }
    const lineWords: React.ReactNode[] = []
    for (let i = 0; i < lineWordCount; i++, wIdx++) {
      const word = words[wIdx]
      if (!word) continue
      lineWords.push(
        <CodeWordTile
          key={`${word}-${wIdx}`}
          word={word}
          wordIndex={wIdx}
          options={options}
        />
      )
    }
    lineElements.push(
      <CodeLine
        key={lineIdx}
        lineIdx={lineIdx}
        isActiveLine={lineIdx === activeLine}
        indent={codeIndents[lineIdx] ?? 0}
        showLineNumbers={options.showLineNumbers}
      >
        {lineWords}
      </CodeLine>
    )
  }
  return lineElements
}

/** Scroll `container` so the typing cursor stays within a padded viewport. */
function scrollCursorIntoView(container: HTMLElement): void {
  const cursor = container.querySelector<HTMLElement>(".typing-cursor")
  if (!cursor) return
  const containerRect = container.getBoundingClientRect()
  const cursorRect = cursor.getBoundingClientRect()
  const cursorLeft = cursorRect.left - containerRect.left + container.scrollLeft
  const cursorRight =
    cursorRect.right - containerRect.left + container.scrollLeft
  const viewLeft = container.scrollLeft
  const viewRight = container.scrollLeft + containerRect.width
  const pad = 80
  if (cursorRight > viewRight - pad) {
    container.scrollTo({
      left: cursorRight - containerRect.width + pad,
      behavior: "smooth",
    })
  } else if (cursorLeft < viewLeft + pad) {
    container.scrollTo({
      left: Math.max(0, cursorLeft - pad),
      behavior: "smooth",
    })
  }
}

/** Keeps the code-mode viewport scrolled so the cursor stays visible. */
function useCodeAutoScroll(
  isCodeRendering: boolean,
  wordsContainerRef: React.RefObject<HTMLDivElement | null>,
  codeLines: number[],
  wordIndex: number,
  typed: string
): void {
  // Track which code line the cursor is on so line changes snap scroll to 0
  const activeLineRef = useRef<number>(-1)

  useEffect(() => {
    if (!isCodeRendering) return
    const container = wordsContainerRef.current
    if (!container) return

    const activeLine = findActiveLine(codeLines, wordIndex)

    // If the line changed, snap scrollLeft back to 0 immediately
    if (activeLine !== activeLineRef.current) {
      activeLineRef.current = activeLine
      container.scrollLeft = 0
      return
    }

    requestAnimationFrame(() => {
      scrollCursorIntoView(container)
    })
  }, [typed, wordIndex, isCodeRendering, wordsContainerRef, codeLines])
}

/** Word index of the AI pace bot; advances one word per interval while racing. */
function usePaceBot(
  started: boolean,
  paceBotEnabled: boolean,
  paceBotWpm: number,
  wordCount: number
): number {
  const [botWordIndex, setBotWordIndex] = useState(0)
  useEffect(() => {
    if (!started || !paceBotEnabled) {
      queueMicrotask(() => setBotWordIndex(0))
      return
    }
    const msPerWord = (60 / Math.max(paceBotWpm, 1)) * 1000
    const interval = setInterval(() => {
      setBotWordIndex((prev) => Math.min(prev + 1, wordCount))
    }, msPerWord)
    return () => clearInterval(interval)
  }, [started, paceBotEnabled, paceBotWpm, wordCount])
  return botWordIndex
}

/** Wrong-key feedback: FAH audio clip and/or a screen-shake animation. */
function useWrongKeyFeedback(
  faahMode: boolean,
  shakeMode: boolean
): () => void {
  const faahAudioRef = useRef<HTMLAudioElement | null>(null)
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(() => {
    if (faahMode) {
      if (!faahAudioRef.current) {
        faahAudioRef.current = new Audio("/sounds/fahhhhh.mp3")
      }
      faahAudioRef.current.currentTime = 0
      void faahAudioRef.current.play()
    }
    if (shakeMode && typeof document !== "undefined") {
      const body = document.body
      body.classList.remove("screen-shake")
      // Force reflow so the animation can restart on rapid repeats.
      body.getBoundingClientRect()
      body.classList.add("screen-shake")
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current)
      shakeTimeoutRef.current = setTimeout(() => {
        body.classList.remove("screen-shake")
      }, 320)
    }
  }, [faahMode, shakeMode])
}

/** Animated caps-lock warning banner shown above the test area. */
function CapsLockBanner({ visible }: { visible: boolean }) {
  return (
    <div className="pointer-events-none absolute top-3 right-0 left-0 z-30 flex items-center justify-center">
      <AnimatePresence>
        {visible && (
          <motion.span
            key="caps-lock"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5 rounded border border-border bg-background/95 px-2 py-0.5 font-mono text-[10px] text-primary shadow-sm backdrop-blur"
          >
            <IconLock size={10} />
            caps lock
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

const MONO_STAT_BASE =
  "font-mono text-2xl font-bold text-primary tabular-nums transition-opacity duration-200"

/** Timer / word-progress / live WPM row above the words. */
function TestProgressHeader({
  mode,
  started,
  resetting,
  timeLeft,
  wordIndex,
  wordOption,
  realtimeWpm,
  wpm,
  accuracy,
}: {
  mode: string
  started: boolean
  resetting: boolean
  timeLeft: number
  wordIndex: number
  wordOption: number
  realtimeWpm: boolean
  wpm: number
  accuracy: number
}) {
  const statVisibility = started ? "opacity-100" : "opacity-0"
  return (
    <motion.div
      className="mb-3 flex min-h-8 items-center gap-5"
      animate={{ opacity: resetting ? 0 : 1 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex min-w-0 items-center gap-5">
        {mode === "time" && (
          <span className={cn(MONO_STAT_BASE, statVisibility)}>{timeLeft}</span>
        )}
        {mode === "words" && (
          <span className={cn(MONO_STAT_BASE, statVisibility)}>
            {wordIndex}/{wordOption}
          </span>
        )}
        <div
          className={cn(
            "flex items-center gap-5 font-mono text-lg text-muted-foreground transition-opacity duration-200",
            realtimeWpm && started ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="tabular-nums">
            {wpm} <span className="text-sm opacity-60">wpm</span>
          </span>
          <span className="tabular-nums">
            {accuracy}% <span className="text-sm opacity-60">acc</span>
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/** Progress race between the user and the AI pace bot. */
function PaceBotBar({
  youWordIndex,
  youCharOffset,
  botWordIndex,
  totalWords,
  totalChars,
  wpm,
  paceBotWpm,
}: {
  youWordIndex: number
  /** Flattened char offset of the user's typing (words joined by spaces). */
  youCharOffset: number
  botWordIndex: number
  totalWords: number
  /** Flattened race-text length; enables per-character "You" fill. */
  totalChars: number
  wpm: number
  paceBotWpm: number
}) {
  // Per-character fraction when text length is known (smooth), else per-word.
  const youPct =
    totalChars > 0
      ? Math.min((youCharOffset / totalChars) * 100, 100)
      : Math.min((youWordIndex / totalWords) * 100, 100)
  const botPct = Math.min((botWordIndex / totalWords) * 100, 100)
  return (
    <div className="mb-3 flex w-full flex-col gap-1.5 rounded-xl border border-border bg-zinc-100/60 p-2.5 transition-all dark:bg-zinc-800/60">
      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="flex items-center gap-1.5 font-semibold text-primary">
          🏎️ You: {youWordIndex} / {totalWords} ({wpm} WPM)
        </span>
        <span className="flex items-center gap-1.5 font-semibold text-amber-500">
          🤖 AI Pace Bot: {botWordIndex} / {totalWords} ({paceBotWpm} WPM)
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
          style={{ width: `${youPct}%` }}
        />
        <div
          className="absolute top-0 left-0 h-full bg-amber-500/70 transition-all duration-300"
          style={{ width: `${botPct}%` }}
        />
      </div>
    </div>
  )
}

interface WordsViewportProps {
  wordsContainerRef: React.RefObject<HTMLDivElement | null>
  isCodeRendering: boolean
  isActivelyTyping: boolean
  fontSizeRem: string | undefined
  inputRef: React.RefObject<HTMLInputElement | null>
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleCompositionStart: () => void
  handleCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void
  handleInputBlur: () => void
  handleInputFocus: () => void
  typed: string
  rowOffset: number
  isRTL: boolean
  resetting: boolean
  wordsOpacity: number
  useCodeRender: boolean
  isFocused: boolean
  codeLines: number[]
  codeIndents: number[]
  words: string[]
  wordInputs: string[]
  wordIndex: number
  activeWordRef: React.RefObject<HTMLDivElement | null>
  ghostMode: boolean
  syntaxHighlighting: boolean
  showLineNumbers: boolean
  shikiColors: (string | undefined)[][]
  /** Opponent racers' caret positions keyed by word index (multiplayer). */
  opponentsByWord: Map<number, OpponentCaret[]>
}

/** The hidden input + scrolling words area with overlays. */
function WordsViewport(props: WordsViewportProps) {
  const {
    wordsContainerRef,
    isCodeRendering,
    isActivelyTyping,
    fontSizeRem,
    inputRef,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
    handleInputBlur,
    handleInputFocus,
    typed,
    rowOffset,
    isRTL,
    resetting,
    wordsOpacity,
    useCodeRender,
    isFocused,
    codeLines,
    codeIndents,
    words,
    wordInputs,
    wordIndex,
    activeWordRef,
    ghostMode,
    syntaxHighlighting,
    showLineNumbers,
    shikiColors,
    opponentsByWord,
  } = props
  const highlightEnabled = isCodeRendering && syntaxHighlighting
  return (
    <div
      ref={wordsContainerRef}
      className={cn(
        "relative w-full leading-relaxed",
        isCodeRendering
          ? "no-scrollbar overflow-x-auto overflow-y-hidden"
          : "overflow-hidden",
        isActivelyTyping && "is-typing"
      )}
      style={{
        fontFamily: "var(--typing-font)",
        fontSize: fontSizeRem,
        height: "calc(4.875em + 0.5rem)",
      }}
    >
      <input
        ref={inputRef}
        className="absolute opacity-0"
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        value={typed}
        onChange={() => {}}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
      />

      {rowOffset > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-background to-transparent" />
      )}

      {/* Bottom fade */}
      {isCodeRendering && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-3 bg-gradient-to-t from-background to-transparent" />
      )}

      <LayoutGroup id="words">
        <motion.div
          className={cn(
            isCodeRendering
              ? "flex flex-col gap-y-1"
              : "flex flex-wrap gap-x-2.5 gap-y-1"
          )}
          dir={isRTL ? "rtl" : undefined}
          animate={{
            y: -rowOffset,
            opacity: wordsOpacity,
            filter: resetting ? "blur(4px)" : "blur(0px)",
          }}
          transition={
            resetting
              ? { duration: 0.15, ease: "easeOut" }
              : {
                  type: "spring",
                  stiffness: 750,
                  damping: 45,
                  mass: 0.35,
                }
          }
        >
          {useCodeRender
            ? renderCodeLines({
                codeLines,
                codeIndents,
                words,
                wordInputs,
                typed,
                wordIndex,
                activeWordRef,
                ghostMode,
                isFocused,
                isRTL,
                syntaxHighlighting,
                showLineNumbers,
                shikiColors,
              })
            : words.map((word, wIdx) => {
                const isActive = wIdx === wordIndex
                const isPast = wIdx < wordIndex
                return (
                  <WordTile
                    key={`${word}-${wIdx}`}
                    word={word}
                    isActive={isActive}
                    isPast={isPast}
                    typed={typed}
                    storedInput={wordInputs[wIdx]}
                    currentWordLength={words[wordIndex]?.length ?? 0}
                    isNextWord={wIdx === wordIndex + 1}
                    ghostMode={ghostMode}
                    isFocused={isFocused}
                    isRTL={isRTL}
                    elemRef={isActive ? activeWordRef : undefined}
                    tokenColors={
                      highlightEnabled ? shikiColors[wIdx] : undefined
                    }
                    opponentCarets={opponentsByWord.get(wIdx)}
                  />
                )
              })}
        </motion.div>
      </LayoutGroup>

      <AnimatePresence>
        {!isFocused && (
          <motion.div
            key="focus-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center"
            onClick={() => inputRef.current?.focus()}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-primary">
              <IconPointer size={16} />
              Click here or press Enter to focus
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface TypingTestProps {
  onKeyHighlight?: (key: string | null) => void
  onFinished?: (finished: boolean) => void
  onTypingActiveChange?: (active: boolean) => void
  onFocusChange?: (focused: boolean) => void
  onModeChange?: (mode: string) => void
  pauseTypingInputRefocus?: boolean

  // Multiplayer overrides
  raceWords?: string[]
  raceMode?: "words" | "time"
  raceTimeOption?: number
  raceWordOption?: number
  onProgressUpdate?: (prog: {
    wordIndex: number
    totalWords: number
    wpm: number
    accuracy: number
    charIndex: number
  }) => void
  onRaceFinish?: (stats: ResultStats) => void
  hideControls?: boolean
  disabled?: boolean
  /** No keyboard footer below (race page): vertically center the test. */
  standaloneLayout?: boolean
  /**
   * Multiplayer: opponents' live positions, mapped to words via their
   * broadcast charIndex. Rendered as colored carets inside the text.
   */
  opponentCarets?: OpponentCaret[]
}

export function TypingTest(props: TypingTestProps) {
  const {
    realtimeWpm,
    faahMode,
    ghostMode,
    shakeMode,
    fontSize,
    syntaxHighlighting,
    showKeyboard,
    showLineNumbers,
    paceBotEnabled,
    paceBotWpm,
  } = useSettings()
  const { resolvedTheme } = useTheme()
  const fontSizeRem = FONT_SIZE_REM[fontSize]
  const [codeManifest] = useState<CodeManifest>(() => CODE_MANIFEST)

  const onWrongKey = useWrongKeyFeedback(faahMode, shakeMode)

  const {
    mode,
    timeOption,
    wordOption,
    quoteLength,
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
    timeLeft,
    wordInputs,
    isFocused,
    resetting,
    isActivelyTyping,
    screenFade,
    wpm,
    accuracy,
    isRTL,
    capsLock,
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
    onModeChange: onModeChangeInternal,
    onTimeOptionChange,
    onWordOptionChange,
    onQuoteLengthChange,
    onPunctuationToggle,
    onNumbersToggle,
    onDifficultyToggle,
    onCustomTextChange,
    onCodeLanguageChange,
    onCodeChapterChange,
    onRestart,
  } = useTypingTest({
    ...props,
    onWrongKey,
    pauseTypingInputRefocus: props.pauseTypingInputRefocus,
    raceWords: props.raceWords,
    raceMode: props.raceMode,
    raceTimeOption: props.raceTimeOption,
    raceWordOption: props.raceWordOption,
    onProgressUpdate: props.onProgressUpdate,
    onRaceFinish: props.onRaceFinish,
    disabled: props.disabled,
  })

  const wordsOpacity = getWordsOpacity(resetting, isFocused)
  const hintOpacity = getHintOpacity(mode, started, controlsVisible)
  const centeredLayout = props.standaloneLayout || !showKeyboard

  // Opponent carets: bucket the flat per-player caret list by the word each
  // player currently occupies, so each WordTile can render its own markers.
  const opponentsByWord = useMemo(() => {
    const map = new Map<number, OpponentCaret[]>()
    for (const caret of props.opponentCarets ?? []) {
      const list = map.get(caret.wordIndex)
      if (list) list.push(caret)
      else map.set(caret.wordIndex, [caret])
    }
    return map
  }, [props.opponentCarets])

  // Flattened char offset of my typing (past words + typed chars in the
  // current word) and the total race-text length — feeds the per-character
  // pace-bot fill so it glides with each keystroke, not word-by-word.
  const typedCharOffset = useMemo(() => {
    let offset = wordIndex
    for (let i = 0; i < wordIndex; i++) offset += words[i]?.length ?? 0
    return offset + typed.length
  }, [wordIndex, words, typed])
  const totalChars = useMemo(() => words.join(" ").length, [words])

  const onModeChange = useCallback(
    (next: string) => {
      onModeChangeInternal(next as Parameters<typeof onModeChangeInternal>[0])
      props.onModeChange?.(next)
    },
    [onModeChangeInternal, props]
  )

  // Expose practice-start to the header dashboard via the shared chrome ref.
  const { startPracticeRef } = useAppChrome()
  useEffect(() => {
    startPracticeRef.current = handleResultsPractice
    return () => {
      startPracticeRef.current = null
    }
  }, [handleResultsPractice, startPracticeRef])

  const botWordIndex = usePaceBot(
    started,
    paceBotEnabled,
    paceBotWpm,
    words.length
  )

  const isCodeRendering =
    mode === "code" || (mode === "custom" && codeLines.length > 0)
  const useCodeRender = isCodeRendering && codeLines.length > 0

  // Auto-scroll horizontally in code mode to keep the cursor visible
  useCodeAutoScroll(
    isCodeRendering,
    wordsContainerRef,
    codeLines,
    wordIndex,
    typed
  )

  const rawCode =
    mode === "code" && codeLanguage && codeChapter
      ? getCodeContent(codeLanguage, codeChapter)
      : undefined

  const shikiLang = mode === "custom" ? customCodeLanguage : codeLanguage

  const shikiColors = useShikiTokens(
    words,
    shikiLang,
    isCodeRendering && syntaxHighlighting,
    resolvedTheme ?? "dark",
    rawCode
  )

  if (showResults) {
    return (
      <div
        className="w-full transition-all duration-150 ease-out"
        style={{
          opacity: screenFade,
          filter: screenFade < 1 ? "blur(4px)" : "none",
        }}
      >
        <ResultsScreen
          stats={frozenStats!}
          onRestart={handleResultsRestart}
          onNext={handleResultsNext}
          onPractice={handleResultsPractice}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex w-full max-w-site flex-col items-center gap-3 transition-all duration-150 ease-out",
        centeredLayout && "flex-1"
      )}
      style={{
        opacity: screenFade,
        filter: screenFade < 1 ? "blur(4px)" : "none",
      }}
      onClick={handleFocus}
      onMouseMove={handleMouseMove}
    >
      {/* Controls toolbar */}
      {!props.hideControls && (
        <TestControls
          mode={mode}
          timeOption={timeOption}
          wordOption={wordOption}
          quoteLength={quoteLength}
          punctuation={punctuation}
          numbers={numbers}
          difficulty={difficulty}
          customText={customText}
          codeLanguage={codeLanguage}
          codeChapter={codeChapter}
          codeManifest={codeManifest}
          controlsVisible={controlsVisible}
          onModeChange={onModeChange}
          onTimeOptionChange={onTimeOptionChange}
          onWordOptionChange={onWordOptionChange}
          onQuoteLengthChange={onQuoteLengthChange}
          onPunctuationToggle={onPunctuationToggle}
          onNumbersToggle={onNumbersToggle}
          onDifficultyToggle={onDifficultyToggle}
          onCustomTextChange={onCustomTextChange}
          onCodeLanguageChange={onCodeLanguageChange}
          onCodeChapterChange={onCodeChapterChange}
        />
      )}

      {/* Text area + controls — fills remaining height and centers when keyboard is hidden */}
      <div
        className={cn(
          "flex w-full flex-col items-center gap-3",
          centeredLayout && "flex-1 justify-center pb-20"
        )}
      >
        {/* Words display */}
        <div className="relative w-full">
          {/* Caps Lock indicator */}
          <CapsLockBanner visible={capsLock} />

          {/* Timer / progress — always reserves space */}
          <TestProgressHeader
            mode={mode}
            started={started}
            resetting={resetting}
            timeLeft={timeLeft}
            wordIndex={wordIndex}
            wordOption={wordOption}
            realtimeWpm={realtimeWpm}
            wpm={wpm}
            accuracy={accuracy}
          />

          {paceBotEnabled && words.length > 0 && (
            <PaceBotBar
              youWordIndex={wordIndex}
              youCharOffset={typedCharOffset}
              botWordIndex={botWordIndex}
              totalWords={words.length}
              totalChars={totalChars}
              wpm={wpm}
              paceBotWpm={paceBotWpm}
            />
          )}

          <WordsViewport
            wordsContainerRef={wordsContainerRef}
            isCodeRendering={isCodeRendering}
            isActivelyTyping={isActivelyTyping}
            fontSizeRem={fontSizeRem}
            inputRef={inputRef}
            handleKeyDown={handleKeyDown}
            handleCompositionStart={handleCompositionStart}
            handleCompositionEnd={handleCompositionEnd}
            handleInputBlur={handleInputBlur}
            handleInputFocus={handleInputFocus}
            typed={typed}
            rowOffset={rowOffset}
            isRTL={isRTL}
            resetting={resetting}
            wordsOpacity={wordsOpacity}
            useCodeRender={useCodeRender}
            isFocused={isFocused}
            codeLines={codeLines}
            codeIndents={codeIndents}
            words={words}
            wordInputs={wordInputs}
            wordIndex={wordIndex}
            activeWordRef={activeWordRef}
            ghostMode={ghostMode}
            syntaxHighlighting={syntaxHighlighting}
            showLineNumbers={showLineNumbers}
            shikiColors={shikiColors}
            opponentsByWord={opponentsByWord}
          />
        </div>

        {/* Restart button */}
        <RestartButton
          controlsVisible={controlsVisible}
          onRestart={onRestart}
        />

        {/* Keyboard shortcuts hint */}
        <motion.div
          animate={{
            opacity: hintOpacity,
          }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 text-xs text-muted-foreground"
        >
          {mode === "zen" && started ? (
            <span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                shift
              </kbd>
              {" + "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                enter
              </kbd>{" "}
              - end test
            </span>
          ) : (
            <span className="hidden md:block">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                tab
              </kbd>
              {" + "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                enter
              </kbd>{" "}
              - restart test
            </span>
          )}
        </motion.div>
      </div>
      {/* end centered content wrapper */}
    </div>
  )
}

function RestartButton({
  controlsVisible,
  onRestart,
}: {
  controlsVisible: boolean
  onRestart: () => void
}) {
  const [spinning, setSpinning] = useState(false)

  function handleClick() {
    setSpinning(true)
    setTimeout(() => setSpinning(false), 600)
    onRestart()
  }

  return (
    <motion.button
      animate={{ opacity: controlsVisible ? 1 : 0.15 }}
      transition={{ duration: 0.4 }}
      onClick={handleClick}
      className={cn(
        "rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground",
        !controlsVisible && "pointer-events-none"
      )}
      title="Random chapter"
    >
      <span
        style={{
          display: "inline-flex",
          transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
          transform: spinning ? "rotate(360deg)" : "rotate(0deg)",
        }}
      >
        <IconRefresh size={18} />
      </span>
    </motion.button>
  )
}
