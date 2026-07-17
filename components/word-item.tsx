"use client";

import { memo, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface WordItemProps {
  word: string;
  displayInput: string;
  isActive: boolean;
  isPast: boolean;
  hasError: boolean;
  elemRef?: React.RefObject<HTMLDivElement | null>;
  dimmed?: boolean;
  isRTL?: boolean;
  tokenColors?: (string | undefined)[];
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
}: WordItemProps) {
  const wordRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cursorIdx = Math.min(displayInput.length, word.length);

  useLayoutEffect(() => {
    const cursor = cursorRef.current;
    const container = wordRef.current;
    if (!cursor || !container) return;
    if (!isActive) {
      cursor.style.display = "none";
      return;
    }

    cursor.style.display = "";
    const target = charRefs.current[cursorIdx];
    const x = displayInput.length > word.length
      ? container.scrollWidth
      : target
        ? target.offsetLeft
        : container.scrollWidth;

    // Transitioning the compositor-only transform lets each new character
    // position retarget from the caret's current visual position instead of
    // snapping to it. Keep the initial position instant so a new word does
    // not animate in from its previous location.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cursor.style.transition = displayInput.length === 0 || reduceMotion
      ? "none"
      : "transform 88ms cubic-bezier(0.22, 1, 0.36, 1)";
    cursor.style.transform = `translateX(${x}px)`;
  }, [cursorIdx, displayInput.length, isActive, word.length]);

  return (
    <div
      ref={(node) => {
        wordRef.current = node;
        if (isActive && elemRef) elemRef.current = node;
      }}
      className={cn(
        "relative whitespace-nowrap",
        isPast && hasError && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-destructive/50",
      )}
      style={dimmed ? { opacity: 0.05 } : undefined}
    >
      <span
        ref={cursorRef}
        aria-hidden="true"
        className="typing-cursor pointer-events-none absolute top-0.5 h-[1.2em] w-0.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
        style={{ display: "none" }}
      />
      {word.split("").map((char, cIdx) => {
        const tokenHex = tokenColors?.[cIdx];
        const defaultColor = tokenHex ? undefined : "text-muted-foreground/40";
        let color = defaultColor;
        let inlineColor = tokenHex;
        if (isPast || isActive) {
          if (cIdx < displayInput.length) {
            color = displayInput[cIdx] === char ? "text-foreground" : "text-destructive";
            inlineColor = undefined;
          } else {
            color = defaultColor;
            inlineColor = tokenHex;
          }
        }

        return (
          <span
            key={cIdx}
            ref={(el) => { charRefs.current[cIdx] = el; }}
            className={cn("relative", isRTL ? "inline" : "inline-block")}
          >
            <span className={color} style={inlineColor ? { color: inlineColor } : undefined}>
              {char}
            </span>
          </span>
        );
      })}

      {(isActive || isPast) &&
        displayInput.length > word.length &&
        displayInput.slice(word.length).split("").map((char, eIdx) => (
          <span key={`extra-${eIdx}`} className="text-destructive/80">
            {char}
          </span>
        ))}
    </div>
  );
});
