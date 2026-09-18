// ── Race Identity ─────────────────────────────────────────────────────────────
// Manages player identity (nickname, color, session ID) via localStorage.
// No login required — identity is ephemeral and fun.

import { PLAYER_COLORS, MAX_NICKNAME_LENGTH } from "@/shared/race-protocol"
import { randomPick } from "@/lib/secure-random"

const NICKNAME_KEY = "velokey-race-nickname"
const COLOR_KEY = "velokey-race-color"
const SESSION_KEY = "velokey-race-session"

// ── Nickname Generation ──────────────────────────────────────────────────────

const ADJECTIVES = [
  "Swift",
  "Neon",
  "Turbo",
  "Cosmic",
  "Silent",
  "Hyper",
  "Blazing",
  "Frost",
  "Crimson",
  "Shadow",
  "Midnight",
  "Thunder",
  "Stealth",
  "Phantom",
  "Atomic",
  "Velvet",
  "Rogue",
  "Amber",
  "Onyx",
  "Lunar",
  "Pixel",
  "Chrome",
  "Quantum",
  "Mystic",
  "Storm",
  "Rapid",
  "Flash",
  "Zenith",
  "Viper",
  "Arctic",
  "Ember",
  "Cobalt",
  "Cipher",
  "Nova",
  "Prism",
  "Echo",
  "Bolt",
  "Drift",
  "Glitch",
  "Orbit",
]

const ANIMALS = [
  "Panda",
  "Fox",
  "Wolf",
  "Hawk",
  "Lynx",
  "Tiger",
  "Falcon",
  "Otter",
  "Raven",
  "Viper",
  "Jaguar",
  "Eagle",
  "Cobra",
  "Phoenix",
  "Dragon",
  "Panther",
  "Bear",
  "Shark",
  "Mantis",
  "Owl",
  "Crane",
  "Gecko",
  "Heron",
  "Badger",
  "Puma",
  "Osprey",
  "Ferret",
  "Ibis",
  "Jackal",
  "Mako",
  "Toucan",
  "Wren",
  "Kite",
  "Newt",
  "Finch",
  "Marten",
  "Shrike",
  "Grouse",
  "Starling",
  "Sparrow",
]

function randomFrom<T>(arr: T[]): T {
  return randomPick(arr)
}

function generateNickname(): string {
  return `${randomFrom(ADJECTIVES)}${randomFrom(ANIMALS)}`
}

// ── Player Colors ────────────────────────────────────────────────────────────
// Palette lives in shared/race-protocol.ts alongside the sanitizers.

function randomColor(): string {
  return randomPick(PLAYER_COLORS)
}

// ── Session ID ───────────────────────────────────────────────────────────────

function generateSessionId(): string {
  // Session IDs are unpredictable so one client cannot impersonate another.
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(36)).join("")
  }
  throw new Error("WebCrypto unavailable: cannot generate a secure session ID")
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
  const trimmed = nickname.trim().slice(0, MAX_NICKNAME_LENGTH)
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
