import { describe, expect, it } from "vitest"
import {
  CODE_MANIFEST,
  CODE_FILES,
  getCodeContent,
  getFirstChapter,
} from "@/lib/code"

describe("code data", () => {
  it("manifest has all 14 languages", () => {
    expect(Object.keys(CODE_MANIFEST)).toHaveLength(14)
  })

  it("manifest chapters are numbered without gaps per language", () => {
    for (const [, entry] of Object.entries(CODE_MANIFEST)) {
      const numbers = entry.chapters.map((c) => parseInt(c.split("_")[0], 10))
      for (let i = 0; i < numbers.length; i++) {
        expect(numbers[i]).toBe(i)
      }
    }
  })

  it("every manifest chapter has content", () => {
    for (const [lang, entry] of Object.entries(CODE_MANIFEST)) {
      for (const chapter of entry.chapters) {
        const content = getCodeContent(lang, chapter)
        expect(content).toBeTruthy()
        expect(content!.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it("getCodeContent returns undefined for unknown keys", () => {
    expect(getCodeContent("klingon", "00_basics")).toBeUndefined()
  })

  it("getFirstChapter returns the first chapter", () => {
    expect(getFirstChapter("javascript")).toBe(
      CODE_MANIFEST.javascript.chapters[0]
    )
    expect(getFirstChapter("unknown")).toBeUndefined()
  })

  it("file contents are non-trivial", () => {
    expect(Object.keys(CODE_FILES).length).toBeGreaterThanOrEqual(90)
  })
})
