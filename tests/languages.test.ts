import { describe, expect, it } from "vitest"
import {
  getLanguageFileCode,
  isRTLLanguage,
  stripArabicDiacritics,
} from "@/lib/languages"

describe("isRTLLanguage", () => {
  it("detects RTL languages", () => {
    expect(isRTLLanguage("arabic")).toBe(true)
    expect(isRTLLanguage("urdu")).toBe(true)
    expect(isRTLLanguage("persian")).toBe(true)
    expect(isRTLLanguage("hebrew")).toBe(true)
  })

  it("does not flag LTR languages", () => {
    expect(isRTLLanguage("english")).toBe(false)
    expect(isRTLLanguage("")).toBe(false)
  })
})

describe("stripArabicDiacritics", () => {
  it("removes harakat but keeps letters", () => {
    // مُحَمَّد with fatha/damma/kasra diacritics
    const withDiacritics = "\u0645\u064F\u062D\u064E\u0645\u0651\u062F"
    const stripped = stripArabicDiacritics(withDiacritics)
    expect(stripped).toBe("\u0645\u062D\u0645\u062F")
  })

  it("leaves plain text untouched", () => {
    expect(stripArabicDiacritics("hello")).toBe("hello")
    expect(stripArabicDiacritics("")).toBe("")
  })
})

describe("getLanguageFileCode", () => {
  it("maps layout variants to base file codes", () => {
    expect(getLanguageFileCode("chinese_traditional_zhuyin")).toBe(
      "chinese_traditional"
    )
    expect(getLanguageFileCode("chinese_traditional_cangjie")).toBe(
      "chinese_traditional"
    )
    expect(getLanguageFileCode("chinese_simplified_wubi")).toBe(
      "chinese_simplified"
    )
  })

  it("passes through regular codes", () => {
    expect(getLanguageFileCode("english")).toBe("english")
    expect(getLanguageFileCode("japanese_romaji")).toBe("japanese_romaji")
  })
})
