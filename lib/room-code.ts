// ── Room Code ─────────────────────────────────────────────────────────────────
// Generate and validate room codes in the format VELO-XXXX.
// Uses an unambiguous character set (no 0/O, 1/I/L).

import { randomPick } from "@/lib/secure-random"

// 30 characters → 30^4 = 810,000 possible codes
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 4
const PREFIX = "VELO"

// Static literal (not built via `new RegExp(string)`) — avoids the
// dynamic-regex/ReDoS pattern class entirely and is faster to evaluate.
const ROOM_CODE_PATTERN = /^VELO-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/

export function generateRoomCode(): string {
  const chars: string[] = []
  for (let i = 0; i < CODE_LENGTH; i++) {
    chars.push(randomPick([...CHARSET]))
  }
  return `${PREFIX}-${chars.join("")}`
}

export function isValidRoomCode(input: string): boolean {
  const normalized = normalizeRoomCode(input)
  if (!normalized) return false
  return ROOM_CODE_PATTERN.test(normalized)
}

export function normalizeRoomCode(input: string): string | null {
  // Accept formats: "VELO-XXXX", "velo-xxxx", "XXXX", "xxxx", "velo xxxx", etc.
  const cleaned = input
    .trim()
    .toUpperCase()
    .replace(/[\s\-_]/g, "")

  // If it already has the prefix
  if (
    cleaned.startsWith(PREFIX) &&
    cleaned.length === PREFIX.length + CODE_LENGTH
  ) {
    const code = cleaned.slice(PREFIX.length)
    return `${PREFIX}-${code}`
  }

  // Just the 4-char code
  if (cleaned.length === CODE_LENGTH) {
    return `${PREFIX}-${cleaned}`
  }

  return null
}

export function extractCodeSuffix(roomCode: string): string {
  // Returns just the XXXX part
  const parts = roomCode.split("-")
  return parts[parts.length - 1] || roomCode
}
