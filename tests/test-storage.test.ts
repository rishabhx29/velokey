import { beforeEach, describe, expect, it } from "vitest"
import {
  readStoredBool,
  readStoredCodeChapter,
  readStoredCodeLanguage,
  readStoredCustomText,
  readStoredCustomCodeLanguage,
  readStoredDifficulty,
  readStoredQuoteLength,
  readStoredTestMode,
  readStoredTimeOption,
  readStoredWordOption,
} from "@/lib/test-storage"

beforeEach(() => {
  localStorage.clear()
})

describe("readStoredTestMode", () => {
  it("returns undefined without a stored value", () => {
    expect(readStoredTestMode()).toBeUndefined()
  })

  it("returns valid modes", () => {
    for (const mode of [
      "time",
      "words",
      "quote",
      "zen",
      "custom",
      "code",
      "brainrot",
      "focus",
    ]) {
      localStorage.setItem("tc-test-mode", mode)
      expect(readStoredTestMode()).toBe(mode)
    }
  })

  it("rejects unknown modes", () => {
    localStorage.setItem("tc-test-mode", "hacker")
    expect(readStoredTestMode()).toBeUndefined()
  })
})

describe("readStoredTimeOption / readStoredWordOption", () => {
  it("parses numbers", () => {
    localStorage.setItem("tc-time-option", "45")
    expect(readStoredTimeOption()).toBe(45)
    localStorage.setItem("tc-word-option", "75")
    expect(readStoredWordOption()).toBe(75)
  })

  it("rejects non-numeric and non-positive values", () => {
    for (const bad of ["abc", "-5", "0", ""]) {
      localStorage.setItem("tc-time-option", bad)
      expect(readStoredTimeOption()).toBeUndefined()
    }
  })
})

describe("readStoredQuoteLength", () => {
  it("accepts valid lengths and rejects others", () => {
    localStorage.setItem("tc-quote-length", "medium")
    expect(readStoredQuoteLength()).toBe("medium")
    localStorage.setItem("tc-quote-length", "huge")
    expect(readStoredQuoteLength()).toBeUndefined()
  })
})

describe("readStoredBool", () => {
  it("parses true/false strictly", () => {
    localStorage.setItem("tc-punctuation", "true")
    expect(readStoredBool("tc-punctuation")).toBe(true)
    localStorage.setItem("tc-punctuation", "false")
    expect(readStoredBool("tc-punctuation")).toBe(false)
    localStorage.setItem("tc-punctuation", "1")
    expect(readStoredBool("tc-punctuation")).toBeUndefined()
  })
})

describe("readStoredDifficulty", () => {
  it("accepts valid difficulties", () => {
    localStorage.setItem("tc-difficulty", "hard")
    expect(readStoredDifficulty()).toBe("hard")
  })

  it("rejects unknown values", () => {
    localStorage.setItem("tc-difficulty", "impossible")
    expect(readStoredDifficulty()).toBeUndefined()
  })
})

describe("readers for code + custom values", () => {
  it("read strings verbatim, treating empty as undefined", () => {
    localStorage.setItem("tc-custom-text", "my text")
    expect(readStoredCustomText()).toBe("my text")

    localStorage.setItem("tc-code-language", "python")
    expect(readStoredCodeLanguage()).toBe("python")

    localStorage.setItem("tc-code-chapter", "05_decorators")
    expect(readStoredCodeChapter()).toBe("05_decorators")

    localStorage.setItem("tc-custom-code-language", "go")
    expect(readStoredCustomCodeLanguage()).toBe("go")

    localStorage.setItem("tc-code-language", "")
    expect(readStoredCodeLanguage()).toBeUndefined()
  })
})
