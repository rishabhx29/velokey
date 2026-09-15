"use client"

import { useEffect, useRef, useState } from "react"
import type { HighlighterCore } from "shiki"

// Only list languages whose shiki name differs from the internal code name.
const SHIKI_NAME_OVERRIDES: Record<string, string> = {
  shell: "shellscript",
}

function toShikiLang(lang: string): string {
  return SHIKI_NAME_OVERRIDES[lang] ?? lang
}

let highlighterPromise: Promise<HighlighterCore> | null = null
const loadedLangs = new Set<string>()

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then((m) =>
      m.createHighlighter({
        themes: ["vitesse-dark", "vitesse-light"],
        langs: [],
      })
    )
  }
  return highlighterPromise
}

async function ensureLang(lang: string) {
  const shikiLang = toShikiLang(lang)
  if (loadedLangs.has(shikiLang)) return
  const h = await getHighlighter()
  await h.loadLanguage(shikiLang as Parameters<typeof h.loadLanguage>[0])
  loadedLangs.add(shikiLang)
}

/**
 * Reconstruct the exact character offset of each word inside the raw source.
 * Words come from splitting the source on whitespace, so this walks the
 * source once, consuming one word at a time. Unlike `indexOf` scanning this
 * handles repeated tokens (e.g. `const` appearing many times) correctly.
 */
export function mapWordsToOffsets(rawCode: string, words: string[]): number[] {
  const offsets: number[] = []
  let pos = 0
  for (const word of words) {
    // Skip whitespace between words (any mix of spaces/tabs/newlines)
    while (pos < rawCode.length && /\s/.test(rawCode[pos])) pos++
    if (rawCode.startsWith(word, pos)) {
      offsets.push(pos)
      pos += word.length
    } else {
      // Unexpected mismatch (e.g. the source changed under us) — mark unknown
      offsets.push(-1)
    }
  }
  return offsets
}

/** Tokenizes words and returns per-word arrays of per-character hex colors.
 *  Pass `rawCode` (the original source) for accurate context-aware highlighting.
 *  Falls back to joining words with newlines if rawCode is not provided.
 */
export function useShikiTokens(
  words: string[],
  lang: string,
  enabled: boolean,
  theme: string,
  rawCode?: string
): (string | undefined)[][] {
  const [colorMap, setColorMap] = useState<(string | undefined)[][]>([])
  const prevKey = useRef("")

  useEffect(() => {
    if (!enabled || words.length === 0 || !lang) {
      prevKey.current = ""
      queueMicrotask(() => setColorMap([]))
      return
    }

    const codeToHighlight = rawCode ?? words.join("\n")
    const wordsKey = words.join("|")
    const key = `${lang}:${theme}:${codeToHighlight}:${wordsKey}`
    if (key === prevKey.current) return
    prevKey.current = key

    let cancelled = false
    ;(async () => {
      await ensureLang(lang)
      const h = await getHighlighter()
      const shikiLang = toShikiLang(lang)
      const shikiTheme = theme === "dark" ? "vitesse-dark" : "vitesse-light"

      const { tokens } = h.codeToTokens(codeToHighlight, {
        lang: shikiLang,
        theme: shikiTheme,
      })

      // Build a flat char→color array from the full source
      const charColors: (string | undefined)[] = []
      for (const line of tokens) {
        for (const token of line) {
          for (const ch of token.content) {
            charColors.push(ch === "\n" ? undefined : token.color)
          }
        }
        // newline between lines
        charColors.push(undefined)
      }

      if (rawCode) {
        // Deterministic walk of the raw source so repeated words keep the
        // colors of their own occurrences.
        const offsets = mapWordsToOffsets(rawCode, words)
        const result: (string | undefined)[][] = []
        for (let i = 0; i < words.length; i++) {
          const word = words[i]
          const idx = offsets[i]
          const colors: (string | undefined)[] = []
          if (idx === -1) {
            for (let c = 0; c < word.length; c++) colors.push(undefined)
          } else {
            for (let c = 0; c < word.length; c++) {
              colors.push(charColors[idx + c] ?? undefined)
            }
          }
          result.push(colors)
        }
        if (!cancelled) setColorMap(result)
      } else {
        // Original word-per-line mapping
        let pos = 0
        const result: (string | undefined)[][] = []
        for (const word of words) {
          const colors: (string | undefined)[] = []
          for (let i = 0; i < word.length; i++) {
            colors.push(charColors[pos] ?? undefined)
            pos++
          }
          result.push(colors)
          if (pos < charColors.length && charColors[pos] === undefined) pos++
        }
        if (!cancelled) setColorMap(result)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [words, lang, enabled, theme, rawCode])

  return colorMap
}
