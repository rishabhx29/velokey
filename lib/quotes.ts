import rawQuotes from "@/data/quotes.json";

export type QuoteLength = "short" | "medium" | "long";

const BOUNDS: Record<QuoteLength, [number, number]> = {
  short:  [40,  130],
  medium: [131, 199],
  long:   [200, 600],
};

interface RawQuote {
  text: string;
  from: string;
}

const ALL_QUOTES = (rawQuotes as RawQuote[]).filter(
  (q) => typeof q?.text === "string" && q.text.trim().length > 0,
);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getQuote(length: QuoteLength): { words: string[]; author: string } {
  const [min, max] = BOUNDS[length];
  const pool = ALL_QUOTES.filter((q) => q.text.length >= min && q.text.length <= max);
  // Fall back to any quote when a bucket is empty (or too small) so the
  // test can always start.
  const source = pool.length > 0 ? pool : ALL_QUOTES;
  const quote = source.length > 0 ? pick(source) : { text: "The quick brown fox jumps over the lazy dog", from: "Unknown" };
  return { words: quote.text.split(/\s+/).filter(Boolean), author: quote.from };
}
