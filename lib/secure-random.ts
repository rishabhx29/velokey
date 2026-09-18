// ── Secure Random Helpers ─────────────────────────────────────────────────────
// Crypto-backed randomness shared by client and server (PartyKit runtimes and
// browsers both provide WebCrypto). Falls back to Math.random only for legacy
// runtimes without crypto — call sites that need unpredictability (room codes,
// session IDs) throw rather than degrade silently.

type ByteSource = (length: number) => Uint8Array

function getByteSource(): ByteSource {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    return (length) => crypto.getRandomValues(new Uint8Array(length))
  }
  // Legacy runtime without WebCrypto: return null so callers can decide.
  return null as unknown as ByteSource
}

const byteSource = getByteSource()

/**
 * Uniform random integer in [0, maxExclusive).
 * Throws on runtimes without WebCrypto.
 */
export function randomInt(maxExclusive: number): number {
  if (byteSource === null) {
    throw new Error(
      "crypto.getRandomValues unavailable: cannot generate secure random numbers"
    )
  }
  if (
    !Number.isInteger(maxExclusive) ||
    maxExclusive <= 0 ||
    maxExclusive > 0x100000000
  ) {
    throw new RangeError(
      `maxExclusive must be an integer in (0, 2^32], got ${maxExclusive}`
    )
  }
  // Rejection sampling: draw bytes until a sample lands inside the largest
  // multiple of maxExclusive, so every value is equally likely (no modulo bias).
  const range = 0x100000000 - (0x100000000 % maxExclusive)
  while (true) {
    const bytes = byteSource(4)
    const value =
      ((bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!) >>>
      0
    if (value < range) return value % maxExclusive
  }
}

/** Uniform random element of `items` (throws on empty input). */
export function randomPick<T>(items: readonly T[]): T {
  if (items.length === 0) throw new RangeError("randomPick: empty array")
  return items[randomInt(items.length)]!
}

/** Returns a new Fisher–Yates shuffle of `items` (uniform, crypto-backed). */
export function randomShuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const a = result[i]!
    const b = result[j]!
    result[i] = b
    result[j] = a
  }
  return result
}
