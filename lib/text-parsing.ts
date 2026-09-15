// ── Typing Engine Text Parsing (pure) ────────────────────────────────────────
// Pure helpers extracted from hooks/use-typing-test.ts so they can be unit
// tested without mounting React. No state, no DOM, no randomness.

export interface ParsedCodeContent {
  words: string[]
  lineLengths: number[]
  lineIndents: number[]
}

/** Split free-form text into words on any whitespace. */
export function customTextToWords(text: string): string[] {
  return text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean)
}

/**
 * Parse code text into a flat word list plus per-line metadata (word counts
 * and indent levels) used to render code blocks with line structure.
 * Indentation: 1 tab or 2 spaces count as one indent level.
 */
export function parseCodeContent(content: string): ParsedCodeContent {
  const lines = content.split("\n")
  const lineLengths: number[] = []
  const lineIndents: number[] = []
  const allWords: string[] = []
  for (const line of lines) {
    const leadingSpaces = line.match(/^(\s*)/)?.[1] ?? ""
    const tabCount = (leadingSpaces.match(/\t/g) ?? []).length
    const spaceCount = leadingSpaces.replace(/\t/g, "").length
    const indent = tabCount + Math.floor(spaceCount / 2)
    const lineWords = line.split(/\s+/).filter((w) => w.length > 0)
    lineLengths.push(lineWords.length)
    lineIndents.push(indent)
    allWords.push(...lineWords)
  }
  return {
    words: allWords.filter((w) => w.length > 0),
    lineLengths,
    lineIndents,
  }
}

/** Comment token to prepend to placeholder words for a code language. */
export function getCommentPrefix(lang: string): string {
  if (lang === "shell" || lang === "bash") return "#"
  if (lang === "lua") return "--"
  return "//"
}
