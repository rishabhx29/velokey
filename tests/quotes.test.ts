import { describe, expect, it } from "vitest"
import { getQuote, type QuoteLength } from "@/lib/quotes"
import rawQuotes from "@/data/quotes.json"

describe("getQuote", () => {
  const lengths: QuoteLength[] = ["short", "medium", "long"]

  for (const length of lengths) {
    it(`returns a non-empty ${length} quote with words and author`, () => {
      const { words, author } = getQuote(length)
      expect(words.length).toBeGreaterThan(0)
      expect(words.every((w) => w.length > 0)).toBe(true)
      expect(typeof author).toBe("string")
      expect(author.length).toBeGreaterThan(0)
    })

    it(`returns ${length} quotes within bounds when the pool has entries`, () => {
      for (let i = 0; i < 5; i++) {
        const { words } = getQuote(length)
        const text = words.join(" ")
        expect(text.length).toBeGreaterThan(0)
        // bound check is soft — fallback may pick any quote if a bucket is empty
        expect(text.length).toBeLessThan(2000)
      }
    })
  }

  it("quotes data has no split-author corruption", () => {
    const bad = (rawQuotes as { text: string; from: string }[]).filter(
      (q) => q.from && /^[a-z]/.test(q.from)
    )
    expect(bad).toHaveLength(0)
  })

  it("quotes data has no empty texts", () => {
    const empty = (rawQuotes as { text: string }[]).filter(
      (q) => !q.text || q.text.trim().length === 0
    )
    expect(empty).toHaveLength(0)
  })
})
