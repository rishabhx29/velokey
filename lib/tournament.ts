// ── Tournament Bracket (pure, runtime-neutral) ────────────────────────────────
// State machine for host-driven single-elimination tournaments inside a race
// room. The host runs rounds sequentially; the room server owns applying
// results, clients only render the bracket from broadcast state.
//
// Design constraints:
// - 4 or 8 players (power-of-two brackets; 5–7 players get byes).
// - One match at a time so a casual room never needs per-player synchronization.
// - Word/time config is fixed at creation (the room's current config).
// - Serialized as plain JSON inside the party room's in-memory state; matches
//   the room's other state (no persistence beyond the room's lifetime).

export interface TournamentRound {
  /** Slot order for this round. `null` = TBD (winner of an earlier match). */
  slots: (string | null)[]
  /** Winner of each completed pairing, in pairing order. */
  winnerIds: (string | null)[]
}

export interface TournamentState {
  players: string[] // player IDs at tournament start
  rounds: TournamentRound[]
  currentRound: number
  /** Index into rounds[currentRound].winnerIds for the next undecided match. */
  nextMatchIndex: number
  config: {
    mode: "words" | "time"
    wordOption: number
    timeOption: number
    difficulty: string
  }
  champion: string | null
}

export const TOURNAMENT_PLAYERS = [4, 8] as const

/**
 * Create a bracket for `playerIds`. Accepts 4–8 entrants: when the count is
 * not a power of two the bracket is padded to the next power of two and the
 * padded slots become byes (a pairing against null auto-advances).
 */
export function createTournament(
  playerIds: string[],
  mode: "words" | "time",
  wordOption: number,
  timeOption: number,
  difficulty: string
): TournamentState {
  if (playerIds.length < 4 || playerIds.length > 8) {
    throw new Error("Tournament requires 4–8 players")
  }

  // Next power of two ≥ entrant count (4 or 8).
  let size = 4
  while (size < playerIds.length) size *= 2

  // Standard seeding: 1v{n}, 2v{n-1}… — entrants are seeded by join order.
  const seeded = [...playerIds]
  const slots: (string | null)[] = new Array(size).fill(null)
  for (let i = 0; i < seeded.length; i++) slots[i] = seeded[i]

  const firstWinners = new Array<null>(size / 2).fill(null)
  const rounds: TournamentRound[] = [{ slots, winnerIds: firstWinners }]

  // Pre-create subsequent rounds with TBD slots.
  let slotCount = size / 2
  while (slotCount >= 2) {
    rounds.push({
      slots: new Array<null>(slotCount).fill(null),
      winnerIds: new Array<null>(slotCount / 2).fill(null),
    })
    slotCount = slotCount / 2
  }

  return {
    players: [...playerIds],
    rounds,
    currentRound: 0,
    nextMatchIndex: 0,
    config: { mode, wordOption, timeOption, difficulty },
    champion: null,
  }
}

/** The pairing currently being played, or null when none is live. */
export function currentRoundMatch(
  state: TournamentState
): { a: string; b: string; index: number } | null {
  const round = state.rounds[state.currentRound]
  if (!round) return null
  const idx = state.nextMatchIndex
  if (idx >= round.winnerIds.length) return null
  const a = round.slots[idx * 2]
  const b = round.slots[idx * 2 + 1]
  if (a == null || b == null) return null
  return { a, b, index: idx }
}

/**
 * The next matchup to play, resolving byes as it walks. Returns null when the
 * round is complete (callers should advance via applyMatchResult flow) or the
 * tournament is finished.
 */
export function nextMatchup(
  state: TournamentState
): { a: string; b: string; index: number } | null {
  return currentRoundMatch(state)
}

/**
 * Record `winnerId` for the current undecided match of the current round.
 * Auto-resolves byes and cascades winners into the next round's slots.
 * Returns the same state object mutated in place (also returns unchanged
 * state when the call is invalid — callers can rely on idempotence).
 */
export function applyMatchResult(
  state: TournamentState,
  winnerId: string
): TournamentState {
  const round = state.rounds[state.currentRound]
  if (!round || state.champion) return state

  const idx = state.nextMatchIndex
  if (idx >= round.winnerIds.length) return state

  const a = round.slots[idx * 2]
  const b = round.slots[idx * 2 + 1]
  if (a == null || b == null) return state
  if (winnerId !== a && winnerId !== b) return state // invalid winner

  round.winnerIds[idx] = winnerId

  // Cascade: winner takes the parent slot in the next round.
  const next = state.rounds[state.currentRound + 1]
  if (next) next.slots[idx] = winnerId

  // Advance to the next undecided pairing, resolving byes as we go.
  let cursor = idx + 1
  while (cursor < round.winnerIds.length && isBye(round, cursor)) {
    resolveBye(round, state.rounds[state.currentRound + 1], cursor)
    cursor += 1
  }
  state.nextMatchIndex = cursor

  // Round complete? Fill trailing byes, cascade, and move on.
  if (state.nextMatchIndex < round.winnerIds.length) return state

  finalizeRound(state, round, next, winnerId)
  return state
}

/** True when the pairing at `matchIndex` contains at least one bye (null) slot. */
function isBye(round: TournamentRound, matchIndex: number): boolean {
  return (
    round.slots[matchIndex * 2] == null ||
    round.slots[matchIndex * 2 + 1] == null
  )
}

/**
 * Auto-advance a bye pairing: the present player wins (double byes —
 * impossible in a valid bracket — stay null so we never hang on them).
 */
function resolveBye(
  round: TournamentRound,
  next: TournamentRound | undefined,
  matchIndex: number
): void {
  const slotA = round.slots[matchIndex * 2]
  const slotB = round.slots[matchIndex * 2 + 1]
  const winner = slotA ?? slotB
  round.winnerIds[matchIndex] = winner
  if (next && winner != null) next.slots[matchIndex] = winner
}

/** Fill winner slots that were never decided (trailing byes) and cascade. */
function fillTrailingByes(
  round: TournamentRound,
  next: TournamentRound | undefined
): void {
  for (let i = 0; i < round.winnerIds.length; i++) {
    if (round.winnerIds[i] == null) {
      round.winnerIds[i] = round.slots[i * 2] ?? round.slots[i * 2 + 1] ?? null
    }
    if (next) next.slots[i] = round.winnerIds[i]
  }
}

/** Resolve every undecided bye pairing in the round at `roundIndex`. */
function resolveRoundByes(state: TournamentState, roundIndex: number): void {
  const round = state.rounds[roundIndex]
  const next = state.rounds[roundIndex + 1]
  for (let i = 0; i < round.winnerIds.length; i++) {
    if (round.winnerIds[i] != null || !isBye(round, i)) continue
    resolveBye(round, next, i)
  }
}

/**
 * After a round completes, keep advancing while the new round's first pairing
 * is itself a bye, resolving those rounds fully, until a real pairing or the
 * end of the bracket is reached.
 */
function advancePastByeRounds(state: TournamentState): void {
  while (state.currentRound < state.rounds.length) {
    const round = state.rounds[state.currentRound]
    if (round.slots[0] != null && round.slots[1] != null) return
    resolveRoundByes(state, state.currentRound)
    state.currentRound += 1
  }
}

/** Close out a completed round: cascade byes, advance, crown a champion. */
function finalizeRound(
  state: TournamentState,
  round: TournamentRound,
  next: TournamentRound | undefined,
  winnerId: string
): void {
  fillTrailingByes(round, next)
  if (!next) {
    // That was the final.
    state.champion = winnerId
    return
  }

  state.currentRound += 1
  state.nextMatchIndex = 0
  advancePastByeRounds(state)

  // Tournament over?
  if (state.currentRound >= state.rounds.length) {
    const finalRound = state.rounds[state.rounds.length - 1]
    state.champion = finalRound.winnerIds[0] ?? null
  }
}
