// ── PartyKit Host ─────────────────────────────────────────────────────────────
// Single source of truth for the PartyKit host used by the race client,
// quick match, and the room-configuration HTTP API.

const RAW_PARTYKIT_HOST: string =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999"

/**
 * "localhost" can resolve to IPv6 (::1) in browsers while local dev servers
 * (next/partykit) may bind IPv4 only — on Windows this breaks the WebSocket
 * handshake. Pin the loopback name to IPv4 for local development; remote
 * hosts pass through untouched.
 */
export const PARTYKIT_HOST: string =
  RAW_PARTYKIT_HOST === "localhost" ||
  RAW_PARTYKIT_HOST.startsWith("localhost:")
    ? RAW_PARTYKIT_HOST.replace(/^localhost/, "127.0.0.1")
    : RAW_PARTYKIT_HOST

/** URL of the HTTP API for a specific race room. */
export function partyRoomUrl(roomCode: string): string {
  const isAbsoluteUrl =
    PARTYKIT_HOST.startsWith("http://") || PARTYKIT_HOST.startsWith("https://")
  if (isAbsoluteUrl) {
    return `${trimTrailingSlashes(PARTYKIT_HOST)}/parties/main/${roomCode}`
  }
  const protocol =
    PARTYKIT_HOST.startsWith("127.0.0.1") ||
    PARTYKIT_HOST.startsWith("localhost")
      ? "http"
      : "https"
  return `${protocol}://${PARTYKIT_HOST}/parties/main/${roomCode}`
}

function trimTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === "/") end -= 1
  return value.slice(0, end)
}
