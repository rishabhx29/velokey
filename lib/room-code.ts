// ── Room Code ─────────────────────────────────────────────────────────────────
// Generate and validate room codes in the format VELO-XXXX.
// Uses an unambiguous character set (no 0/O, 1/I/L).

// 30 characters → 30^4 = 810,000 possible codes
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 4
const PREFIX = "VELO"

export function generateRoomCode(): string {
  let code = ""
  const bytes = new Uint8Array(CODE_LENGTH)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < CODE_LENGTH; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[bytes[i] % CHARSET.length]
  }
  return `${PREFIX}-${code}`
}

export function isValidRoomCode(input: string): boolean {
  const normalized = normalizeRoomCode(input)
  if (!normalized) return false
  const re = new RegExp(`^${PREFIX}-[${CHARSET}]{${CODE_LENGTH}}$`)
  return re.test(normalized)
}

export function normalizeRoomCode(input: string): string | null {
  // Accept formats: "VELO-XXXX", "velo-xxxx", "XXXX", "xxxx", "velo xxxx", etc.
  const cleaned = input.trim().toUpperCase().replace(/[\s\-_]/g, "")

  // If it already has the prefix
  if (cleaned.startsWith(PREFIX) && cleaned.length === PREFIX.length + CODE_LENGTH) {
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
