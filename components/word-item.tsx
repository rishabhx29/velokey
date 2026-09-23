"use client"

import { memo, useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface WordItemProps {
  word: string
  displayInput: string
  isActive: boolean
  isPast: boolean
  hasError: boolean
  elemRef?: React.RefObject<HTMLDivElement | null>
  dimmed?: boolean
  isRTL?: boolean
  tokenColors?: (string | undefined)[]
  /**
   * Opponent racers' positions inside this word (multiplayer race): maps a
   * player ID to { char offset within the word, player color }. Rendered as
   * small colored carets under the text so you can see who is where without
   * looking up at the progress strip.
   */
  opponentCarets?: OpponentCaret[]
}

export interface OpponentCaret {
  playerId: string
  nickname: string
  color: string
  /** Index of the word this caret sits in. */
  wordIndex: number
  /** Char offset within this word (0 = before first char, word.length = end). */
  position: number
}

export const WordItem = memo(function WordItem({
  word,
  displayInput,
  isActive,
  isPast,
  hasError,
  elemRef,
  dimmed = false,
  isRTL = false,
  tokenColors,
  opponentCarets,
}: WordItemProps) {
  const wordRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const cursorIdx = Math.min(displayInput.length, word.length)

  useLayoutEffect(() => {
    const cursor = cursorRef.current
    const container = wordRef.current
    if (!cursor || !container) return
    if (!isActive) {
      cursor.style.display = "none"
      return
    }

    cursor.style.display = ""
    const target = charRefs.current[cursorIdx]
    let x: number
    if (displayInput.length > word.length) {
      x = container.scrollWidth
    } else if (target) {
      x = target.offsetLeft
    } else {
      x = container.scrollWidth
    }

    // Transitioning the compositor-only transform lets each new character
    // position retarget from the caret's current visual position instead of
    // snapping to it. A linear curve keeps the velocity constant across
    // retargets — eased curves restart at zero velocity every keystroke,
    // which reads as a stutter while typing continuously. Keep the initial
    // position instant so a new word does not animate in from its previous
    // location.
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    cursor.style.transition =
      displayInput.length === 0 || reduceMotion
        ? "none"
        : "transform 90ms linear"
    cursor.style.transform = `translateX(${x}px)`
  }, [cursorIdx, displayInput.length, isActive, word.length])

  return (
    <div
      ref={(node) => {
        wordRef.current = node
        if (isActive && elemRef) elemRef.current = node
      }}
      className={cn(
        "relative whitespace-nowrap",
        isPast &&
          hasError &&
          "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[2px] after:rounded-full after:bg-destructive/50"
      )}
      style={dimmed ? { opacity: 0.05 } : undefined}
    >
      <span
        ref={cursorRef}
        aria-hidden="true"
        className="typing-cursor pointer-events-none absolute top-0.5 h-[1.2em] w-0.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
        style={{ display: "none", willChange: "transform" }}
      />
      {word.split("").map((char, cIdx) => {
        const tokenHex = tokenColors?.[cIdx]
        const defaultColor = tokenHex ? undefined : "text-muted-foreground/40"
        let color = defaultColor
        let inlineColor = tokenHex
        if (isPast || isActive) {
          if (cIdx < displayInput.length) {
            color =
              displayInput[cIdx] === char
                ? "text-foreground"
                : "text-destructive"
            inlineColor = undefined
          } else {
            color = defaultColor
            inlineColor = tokenHex
          }
        }

        return (
          <span
            key={cIdx}
            ref={(el) => {
              charRefs.current[cIdx] = el
            }}
            className={cn("relative", isRTL ? "inline" : "inline-block")}
          >
            <span
              className={color}
              style={inlineColor ? { color: inlineColor } : undefined}
            >
              {char}
            </span>
          </span>
        )
      })}

      {(isActive || isPast) &&
        displayInput.length > word.length &&
        displayInput
          .slice(word.length)
          .split("")
          .map((char, eIdx) => (
            <span key={`extra-${eIdx}`} className="text-destructive/80">
              {char}
            </span>
          ))}

      {/* Opponent carets — small colored tabs hanging under the word, each
          nudged horizontally to the player's exact char position. */}
      {opponentCarets && opponentCarets.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-[-5px] left-0 z-10 h-[3px]"
        >
          {opponentCarets.map((caret) => (
            <span
              key={caret.playerId}
              title={caret.nickname}
              className="absolute top-0 h-[3px] w-[3px] -translate-x-1/2 rounded-full transition-[left] duration-200 ease-linear"
              style={{
                backgroundColor: caret.color,
                left: `${Math.max(0, Math.min(100, (caret.position / Math.max(1, word.length)) * 100))}%`,
                boxShadow: `0 0 4px ${caret.color}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
})
