import { describe, expect, it } from "vitest"

import {
  customTextToWords,
  getCommentPrefix,
  parseCodeContent,
} from "@/lib/text-parsing"

describe("customTextToWords", () => {
  it("splits on any whitespace and drops empties", () => {
    expect(customTextToWords("  hello   world\n\tfoo  ")).toEqual([
      "hello",
      "world",
      "foo",
    ])
  })

  it("returns a single empty-ish word array for whitespace-only input", () => {
    // " ".trim() -> "" -> split(" ") -> [""] but filter(Boolean) removes it
    expect(customTextToWords("   ")).toEqual([])
  })
})

describe("parseCodeContent", () => {
  it("tracks word counts and indent levels per line", () => {
    const parsed = parseCodeContent("const a = 1\n  return a\n\tif (a) {}")
    expect(parsed.words).toEqual([
      "const",
      "a",
      "=",
      "1",
      "return",
      "a",
      "if",
      "(a)",
      "{}",
    ])
    expect(parsed.lineLengths).toEqual([4, 2, 3])
    // 2 spaces = 1 indent, tab = 1 indent
    expect(parsed.lineIndents).toEqual([0, 1, 1])
  })

  it("keeps empty lines as zero-length entries", () => {
    const parsed = parseCodeContent("a\n\nb")
    expect(parsed.lineLengths).toEqual([1, 0, 1])
    expect(parsed.lineIndents).toEqual([0, 0, 0])
  })

  it("counts 4-space indent as two levels", () => {
    const parsed = parseCodeContent("    deep()")
    expect(parsed.lineIndents).toEqual([2])
  })
})

describe("getCommentPrefix", () => {
  it("returns # for shell/bash", () => {
    expect(getCommentPrefix("shell")).toBe("#")
    expect(getCommentPrefix("bash")).toBe("#")
  })

  it("returns -- for lua", () => {
    expect(getCommentPrefix("lua")).toBe("--")
  })

  it("defaults to // for everything else", () => {
    expect(getCommentPrefix("typescript")).toBe("//")
    expect(getCommentPrefix("")).toBe("//")
  })
})
