// ── Race sound effects ──────────────────────────────────────────────────────
// Client-side race audio: countdown beeps, overtake whoosh, finish horn.
// All sounds respect the global sound toggle from settings and never throw —
// audio is best-effort polish, a blocked autoplay policy must never break
// the race UI.

let countdownBeep: HTMLAudioElement | null = null
let countdownGo: HTMLAudioElement | null = null
let overtakeWhoosh: HTMLAudioElement | null = null
let finishHorn: HTMLAudioElement | null = null

function ensure(src: string, cache: HTMLAudioElement | null) {
  if (cache) return cache
  try {
    return new Audio(src)
  } catch {
    return null
  }
}

/** Play an element from the start, swallowing any autoplay-policy error. */
function playFromStart(el: HTMLAudioElement | null) {
  if (!el) return
  try {
    el.currentTime = 0
    void el.play().catch(() => {
      // Autoplay blocked (no gesture yet) or playback failed — ignore.
    })
  } catch {
    // Element in a bad state — ignore.
  }
}

export type RaceSoundKind = "beep" | "go" | "overtake" | "finish"

/**
 * Fire a race sound effect. `enabled` should come from the user's sound
 * setting; when false this is a no-op. Countdown "beep" fires once per
 * 3-2-1 tick, "go" when the race starts, "overtake" when someone passes the
 * local player mid-race, "finish" when the local player crosses the line.
 */
export function playRaceSound(kind: RaceSoundKind, enabled: boolean) {
  if (!enabled) return
  switch (kind) {
    case "beep":
      countdownBeep = ensure("/sounds/race/countdown-beep.mp3", countdownBeep)
      playFromStart(countdownBeep)
      break
    case "go":
      countdownGo = ensure("/sounds/race/countdown-go.mp3", countdownGo)
      playFromStart(countdownGo)
      break
    case "overtake":
      overtakeWhoosh = ensure(
        "/sounds/race/overtake-whoosh.mp3",
        overtakeWhoosh
      )
      playFromStart(overtakeWhoosh)
      break
    case "finish":
      finishHorn = ensure("/sounds/race/finish-horn.mp3", finishHorn)
      playFromStart(finishHorn)
      break
  }
}
