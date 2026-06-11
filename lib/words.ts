import { generate } from "random-words";

const punctuationMarks = [".", ",", "!", "?", ";", ":"] as const;

export type Difficulty = "easy" | "medium" | "hard";

function shuffleInPlace(words: string[]): void {
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
}

function pickWithoutReplacement(pool: string[], count: number): string[] {
  const unique = [...new Set(pool)];
  const out: string[] = [];
  let deck = [...unique];
  shuffleInPlace(deck);
  let i = 0;

  while (out.length < count) {
    if (i >= deck.length) {
      const prev = out[out.length - 1];
      deck = [...unique];
      shuffleInPlace(deck);
      i = 0;
      if (prev !== undefined && deck[0] === prev && deck.length > 1) {
        const swapIdx = 1 + Math.floor(Math.random() * (deck.length - 1));
        [deck[0], deck[swapIdx]] = [deck[swapIdx], deck[0]];
      }
    }
    out.push(deck[i]!);
    i += 1;
  }

  return out;
}

function applyModifiers(
  raw: string[],
  options?: { punctuation?: boolean; numbers?: boolean },
): string[] {
  return raw.map((word) => {
    if (options?.numbers && Math.random() < 0.15) {
      return String(Math.floor(Math.random() * 10000));
    }
    if (!options?.punctuation) return word;
    const rand = Math.random();
    if (rand < 0.1) {
      return word + punctuationMarks[Math.floor(Math.random() * punctuationMarks.length)];
    } else if (rand < 0.15) {
      return `"${word}"`;
    } else if (rand < 0.2) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  });
}

/**
 * Generate words from a pre-fetched language word pool (MonkeyType lists).
 * Used for non-English languages and for English when a language pool is loaded.
 */
export function generateWordsFromPool(
  pool: string[],
  count: number,
  options?: { punctuation?: boolean; numbers?: boolean; difficulty?: Difficulty },
): string[] {
  let filtered = pool;
  if (options?.difficulty === "easy") {
    filtered = pool.filter((w) => w.length <= 6);
    if (filtered.length < 20) filtered = pool;
  } else if (options?.difficulty === "medium") {
    filtered = pool.filter((w) => w.length >= 4 && w.length <= 8);
    if (filtered.length < 20) filtered = pool;
  } else if (options?.difficulty === "hard") {
    filtered = pool.filter((w) => w.length >= 6);
    if (filtered.length < 20) filtered = pool;
  }
  const raw = pickWithoutReplacement(filtered, count);
  return applyModifiers(raw, options);
}

/**
 * Fallback: generate English words using the `random-words` npm package.
 * Only used when no language pool is available.
 */
export function generateWords(
  count: number,
  options?: { punctuation?: boolean; numbers?: boolean; difficulty?: Difficulty },
): string[] {
  let raw: string[];

  if (options?.difficulty === "hard") {
    raw = generate({ exactly: count, minLength: 6, maxLength: 13 }) as string[];
  } else if (options?.difficulty === "medium") {
    raw = generate({ exactly: count, minLength: 4, maxLength: 9 }) as string[];
  } else {
    raw = generate({ exactly: count, minLength: 2, maxLength: 6 }) as string[];
  }

  return applyModifiers(raw, options);
}

/**
 * Generate words weighted heavily toward problem keys.
 */
export function generateFocusWords(
  pool: string[],
  keys: string[],
  count: number,
): string[] {
  if (keys.length === 0 || pool.length === 0) {
    return generateWordsFromPool(pool, count);
  }
  const keySet = new Set(keys.map((k) => k.toLowerCase()));
  const scored = pool.map((w) => {
    let score = 0;
    for (const ch of w.toLowerCase()) {
      if (keySet.has(ch)) score += 2;
    }
    return { word: w, score };
  });
  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);
  const candidates = scored.filter((s) => s.score > 0).map((s) => s.word);
  const selectedPool = candidates.length >= 10 ? candidates : pool;
  return pickWithoutReplacement(selectedPool, count);
}
