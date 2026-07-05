// ── Race Identity ─────────────────────────────────────────────────────────────
// Manages player identity (nickname, color, session ID) via localStorage.
// No login required — identity is ephemeral and fun.

const NICKNAME_KEY = "velokey-race-nickname"
const COLOR_KEY = "velokey-race-color"
const SESSION_KEY = "velokey-race-session"

// ── Nickname Generation ──────────────────────────────────────────────────────

const ADJECTIVES = [
  "Swift", "Neon", "Turbo", "Cosmic", "Silent", "Hyper", "Blazing", "Frost",
  "Crimson", "Shadow", "Midnight", "Thunder", "Stealth", "Phantom", "Atomic",
  "Velvet", "Rogue", "Amber", "Onyx", "Lunar", "Pixel", "Chrome", "Quantum",
  "Mystic", "Storm", "Rapid", "Flash", "Zenith", "Viper", "Arctic",
  "Ember", "Cobalt", "Cipher", "Nova", "Prism", "Echo", "Bolt", "Drift",
  "Glitch", "Orbit",
]

const ANIMALS = [
  "Panda", "Fox", "Wolf", "Hawk", "Lynx", "Tiger", "Falcon", "Otter",
  "Raven", "Viper", "Jaguar", "Eagle", "Cobra", "Phoenix", "Dragon",
  "Panther", "Bear", "Shark", "Mantis", "Owl", "Crane", "Gecko",
  "Heron", "Badger", "Puma", "Osprey", "Ferret", "Ibis", "Jackal",
  "Mako", "Toucan", "Wren", "Kite", "Newt", "Finch", "Marten",
  "Shrike", "Grouse", "Starling", "Sparrow",
]

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateNickname(): string {
  return `${randomFrom(ADJECTIVES)}${randomFrom(ANIMALS)}`
}

// ── Player Colors ────────────────────────────────────────────────────────────
// Curated palette — high contrast on both light and dark backgrounds.

export const PLAYER_COLORS = [
  "#22d3ee", // cyan
  "#f472b6", // pink
  "#a78bfa", // violet
  "#fb923c", // orange
  "#4ade80", // green
  "#f87171", // red
  "#facc15", // yellow
  "#60a5fa", // blue
] as const

function randomColor(): string {
  return PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]
}

// ── Session ID ───────────────────────────────────────────────────────────────

function generateSessionId(): string {
  // Prefer crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: simple random string
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getOrCreateNickname(): string {
  if (typeof window === "undefined") return generateNickname()
  const stored = localStorage.getItem(NICKNAME_KEY)
  if (stored) return stored
  const nick = generateNickname()
  localStorage.setItem(NICKNAME_KEY, nick)
  return nick
}

export function setNickname(nickname: string): void {
  if (typeof window === "undefined") return
  const trimmed = nickname.trim().slice(0, 20)
  if (trimmed.length > 0) {
    localStorage.setItem(NICKNAME_KEY, trimmed)
  }
}

export function getNickname(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(NICKNAME_KEY) || ""
}

export function getOrCreateColor(): string {
  if (typeof window === "undefined") return randomColor()
  const stored = localStorage.getItem(COLOR_KEY)
  if (stored) return stored
  const color = randomColor()
  localStorage.setItem(COLOR_KEY, color)
  return color
}

export function setColor(color: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(COLOR_KEY, color)
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return generateSessionId()
  const stored = sessionStorage.getItem(SESSION_KEY)
  if (stored) return stored
  const id = generateSessionId()
  sessionStorage.setItem(SESSION_KEY, id)
  return id
}

export function refreshNickname(): string {
  const nick = generateNickname()
  if (typeof window !== "undefined") {
    localStorage.setItem(NICKNAME_KEY, nick)
  }
  return nick
}
